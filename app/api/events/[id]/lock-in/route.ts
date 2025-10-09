import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import twilio from 'twilio';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const { finalOption, finalTime } = body;

    // Validate required fields
    if (!finalOption || !finalTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Query all verified phone numbers for this event
    const { data: notifications, error: notificationsError } = await supabase
      .from('event_notifications')
      .select('phone_number')
      .eq('event_id', eventId)
      .eq('verified', true);

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError);
      return NextResponse.json(
        { error: 'Failed to fetch notification list' },
        { status: 500 }
      );
    }

    // If no verified numbers, return success with count 0
    if (!notifications || notifications.length === 0) {
      return NextResponse.json({
        success: true,
        notificationsSent: 0,
        message: 'No verified phone numbers to notify',
      });
    }

    // Initialize Twilio client
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Send SMS to each verified phone number
    const smsPromises = notifications.map((notification) =>
      twilioClient.messages.create({
        body: `🎉 Plan locked in! ${finalOption} at ${finalTime}. See you there!`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: notification.phone_number,
      })
    );

    // Use Promise.allSettled to handle partial failures
    const results = await Promise.allSettled(smsPromises);

    // Count successful sends
    const successCount = results.filter((result) => result.status === 'fulfilled').length;
    const failureCount = results.filter((result) => result.status === 'rejected').length;

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(
          `Failed to send SMS to ${notifications[index].phone_number}:`,
          result.reason
        );
      }
    });

    // Return success if at least one message was sent
    if (successCount > 0) {
      return NextResponse.json({
        success: true,
        notificationsSent: successCount,
        message: `Notifications sent to ${successCount} participants${
          failureCount > 0 ? ` (${failureCount} failed)` : ''
        }`,
      });
    } else {
      return NextResponse.json(
        {
          error: 'Failed to send any notifications',
          notificationsSent: 0,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/events/[id]/lock-in:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

