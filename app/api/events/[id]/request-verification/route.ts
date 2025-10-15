import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import twilio from 'twilio';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const { phoneNumber, cookieId } = body;

    // Validate required fields
    if (!phoneNumber || !cookieId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Format phone number to E.164 format (+1XXXXXXXXXX)
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (!formattedPhone.startsWith('1')) {
      formattedPhone = '1' + formattedPhone;
    }
    formattedPhone = '+' + formattedPhone;

    // Validate phone number length
    if (formattedPhone.length !== 12) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Verify event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('event_id')
      .eq('event_id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Generate random 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiry time to 10 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Upsert into event_notifications table (using admin client for write access)
    const { error: dbError } = await supabaseAdmin
      .from('event_notifications')
      .upsert(
        {
          cookie_id: cookieId,
          event_id: eventId,
          phone_number: formattedPhone,
          verified: false,
          verification_code: verificationCode,
          code_expires_at: expiresAt.toISOString(),
        },
        {
          onConflict: 'cookie_id,event_id',
        }
      );

    if (dbError) {
      console.error('Error saving verification code:', dbError);
      return NextResponse.json(
        { error: 'Failed to save verification code' },
        { status: 500 }
      );
    }

    // Send SMS via Twilio
    try {
      const twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      await twilioClient.messages.create({
        body: `Your Friendr.io verification code is: ${verificationCode}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone,
      });

      return NextResponse.json({
        success: true,
        message: 'Verification code sent',
      });
    } catch (twilioError) {
      console.error('Twilio error:', twilioError);
      return NextResponse.json(
        { error: 'Failed to send SMS. Please check your phone number.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/events/[id]/request-verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

