import { NextRequest, NextResponse } from 'next/server';
import { supabase, eventExists } from '@/lib/supabase';
import { generateEventId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      location, 
      notes, 
      heroImageUrl, 
      eventType, 
      fixedDatetime, 
      timeSlots, 
      cookieId, 
      organizerUserId 
    } = body;

    // Validate required fields
    if (!title || !cookieId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields (title, cookieId, eventType)' },
        { status: 400 }
      );
    }

    // Validate event type
    if (eventType !== 'fixed' && eventType !== 'polled') {
      return NextResponse.json(
        { error: 'eventType must be "fixed" or "polled"' },
        { status: 400 }
      );
    }

    // Type-specific validation
    if (eventType === 'fixed') {
      // Fixed Time: requires fixedDatetime
      if (!fixedDatetime) {
        return NextResponse.json(
          { error: 'fixedDatetime is required for fixed-time events' },
          { status: 400 }
        );
      }
    } else {
      // Polled Time: requires 2-10 time slots
      if (!Array.isArray(timeSlots) || timeSlots.length < 2 || timeSlots.length > 10) {
        return NextResponse.json(
          { error: 'Polled events require 2-10 time slots' },
          { status: 400 }
        );
      }
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

    // Prepare event data based on type
    const eventData: Record<string, unknown> = {
      event_id: eventId,
      title,
      location: location || null,
      notes: notes || null,
      hero_image_url: heroImageUrl || null,
      organizer_user_id: organizerUserId || null,
      event_type: eventType,
      status: 'active',
      ttl: ttl.toISOString(),
    };

    // Add type-specific fields
    if (eventType === 'fixed') {
      eventData.fixed_datetime = new Date(fixedDatetime).toISOString();
      eventData.locked_time_id = null;
    } else {
      eventData.fixed_datetime = null;
      eventData.locked_time_id = null;
    }

    // Create event
    const { error: eventError } = await supabase.from('events').insert(eventData);

    if (eventError) {
      console.error('Error creating event:', eventError);
      return NextResponse.json(
        { error: 'Failed to create event' },
        { status: 500 }
      );
    }

    // Create time slots (only for polled events)
    if (eventType === 'polled' && timeSlots && timeSlots.length > 0) {
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
    }

    // Create user cookie record (organizer)
    const { error: cookieError } = await supabase.from('user_cookies').insert({
      cookie_id: cookieId,
      event_id: eventId,
      is_organizer: true,
      display_name: null,
    });

    if (cookieError) {
      console.error('Error creating user cookie:', cookieError);
      // This is not critical - continue anyway
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

