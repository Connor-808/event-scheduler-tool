import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Validate file type (including HEIC/HEIF for iPhone)
    const isValidImage = image.type.startsWith('image/') || 
                        image.name.toLowerCase().endsWith('.heic') ||
                        image.name.toLowerCase().endsWith('.heif');
    
    if (!isValidImage) {
      return NextResponse.json(
        { error: 'File must be an image (JPG, PNG, HEIC, GIF, WebP)' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image must be less than 5MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = image.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `event-images/${fileName}`;

    // Convert File to ArrayBuffer then to Buffer for Supabase
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine content type - handle HEIC/HEIF files from iPhone
    let contentType = image.type;
    if (!contentType || contentType === 'application/octet-stream') {
      const ext = image.name.toLowerCase().split('.').pop();
      if (ext === 'heic' || ext === 'heif') {
        contentType = 'image/heic';
      } else if (ext === 'jpg' || ext === 'jpeg') {
        contentType = 'image/jpeg';
      } else if (ext === 'png') {
        contentType = 'image/png';
      } else if (ext === 'gif') {
        contentType = 'image/gif';
      } else if (ext === 'webp') {
        contentType = 'image/webp';
      } else {
        contentType = 'image/jpeg'; // fallback
      }
    }

    console.log('Uploading file:', {
      name: image.name,
      originalType: image.type,
      finalContentType: contentType,
      size: image.size,
    });

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('event-images')
      .upload(filePath, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error('Error uploading to Supabase Storage:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'Failed to upload image', details: error.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('event-images')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    });
  } catch (error) {
    console.error('Error in POST /api/upload-image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

