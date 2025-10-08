import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const { timeslotId, cookieId } = body;

    // Validate required fields
    if (!timeslotId || !cookieId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Verify user is organizer
    const { data: userCookie, error: cookieError } = await supabase
      .from('user_cookies')
      .select('*')
      .eq('cookie_id', cookieId)
      .eq('event_id', eventId)
      .single();

    if (cookieError || !userCookie || !userCookie.is_organizer) {
      return NextResponse.json(
        { error: 'Unauthorized - only organizer can lock time' },
        { status: 403 }
      );
    }

    // Verify timeslot belongs to this event
    const { data: timeslot, error: slotError } = await supabase
      .from('time_slots')
      .select('*')
      .eq('timeslot_id', timeslotId)
      .eq('event_id', eventId)
      .single();

    if (slotError || !timeslot) {
      return NextResponse.json(
        { error: 'Invalid time slot' },
        { status: 400 }
      );
    }

    // Update event with locked time
    const { error: updateError } = await supabase
      .from('events')
      .update({
        locked_time_id: timeslotId,
        status: 'locked',
      })
      .eq('event_id', eventId);

    if (updateError) {
      console.error('Error locking time:', updateError);
      return NextResponse.json(
        { error: 'Failed to lock time' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Time locked successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/events/[id]/lock:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

