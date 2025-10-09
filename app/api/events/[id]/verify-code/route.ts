import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const { phoneNumber, cookieId, code } = body;

    // Validate required fields
    if (!phoneNumber || !cookieId || !code) {
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

    // Query event_notifications for matching record
    const { data: notification, error: notificationError } = await supabase
      .from('event_notifications')
      .select('*')
      .eq('event_id', eventId)
      .eq('cookie_id', cookieId)
      .eq('phone_number', formattedPhone)
      .eq('verification_code', code)
      .single();

    if (notificationError || !notification) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Check if code has expired
    const expiryTime = new Date(notification.code_expires_at);
    const now = new Date();

    if (now > expiryTime) {
      return NextResponse.json(
        { error: 'Verification code has expired' },
        { status: 400 }
      );
    }

    // Update record: set verified = true, clear verification_code
    const { error: updateError } = await supabase
      .from('event_notifications')
      .update({
        verified: true,
        verification_code: null,
        code_expires_at: null,
      })
      .eq('id', notification.id);

    if (updateError) {
      console.error('Error updating verification status:', updateError);
      return NextResponse.json(
        { error: 'Failed to verify code' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Phone verified!',
    });
  } catch (error) {
    console.error('Error in POST /api/events/[id]/verify-code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

