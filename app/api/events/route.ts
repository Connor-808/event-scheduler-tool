import { NextRequest, NextResponse } from 'next/server';
import { supabase, eventExists } from '@/lib/supabase';
import { generateEventId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, location, timeSlots, cookieId } = body;

    // Validate required fields
    if (!title || !timeSlots || !cookieId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!Array.isArray(timeSlots) || timeSlots.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 time slots required' },
        { status: 400 }
      );
    }

    // Generate unique event ID (check for collisions)
    let eventId = generateEventId();
    let attempts = 0;
    while (await eventExists(eventId) && attempts < 10) {
      eventId = generateEventId();
      attempts++;
    }

    if (attempts >= 10) {
      return NextResponse.json(
        { error: 'Failed to generate unique event ID' },
        { status: 500 }
      );
    }

    // Calculate TTL (90 days from now)
    const ttl = new Date();
    ttl.setDate(ttl.getDate() + 90);

    // Create event
    const { error: eventError } = await supabase.from('events').insert({
      event_id: eventId,
      title,
      location: location || null,
      status: 'active',
      ttl: ttl.toISOString(),
    });

    if (eventError) {
      console.error('Error creating event:', eventError);
      return NextResponse.json(
        { error: 'Failed to create event' },
        { status: 500 }
      );
    }

    // Create time slots
    const timeSlotsData = timeSlots.map((slot: { start_time: string; end_time?: string; label?: string }) => ({
      event_id: eventId,
      start_time: new Date(slot.start_time).toISOString(),
      end_time: slot.end_time ? new Date(slot.end_time).toISOString() : null,
      label: slot.label || null,
    }));

    const { error: slotsError } = await supabase
      .from('time_slots')
      .insert(timeSlotsData);

    if (slotsError) {
      console.error('Error creating time slots:', slotsError);
      // Rollback event creation
      await supabase.from('events').delete().eq('event_id', eventId);
      return NextResponse.json(
        { error: 'Failed to create time slots' },
        { status: 500 }
      );
    }

    // Create user cookie record (organizer)
    const { error: cookieError } = await supabase.from('user_cookies').insert({
      cookie_id: cookieId,
      event_id: eventId,
      is_organizer: true,
      display_name: null,
    });

    if (cookieError) {
      console.error('Error creating organizer user cookie:', cookieError);
      // Rollback event and time slots
      await supabase.from('events').delete().eq('event_id', eventId);
      await supabase.from('time_slots').delete().eq('event_id', eventId);
      return NextResponse.json(
        { error: 'Failed to set up organizer access', details: cookieError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      eventId,
      url: `${request.nextUrl.origin}/event/${eventId}`,
    });
  } catch (error) {
    console.error('Error in POST /api/events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

