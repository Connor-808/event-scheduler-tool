import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyEventExists, verifyOrganizer, parseRequestBody, validateRequiredFields, errorResponse } from '@/lib/api-utils';

/**
 * POST /api/events/[id]/lock
 * Lock a polled event and convert it to a fixed-time event
 * 
 * This endpoint:
 * 1. Verifies the event is a polled type
 * 2. Locks the selected time slot
 * 3. Converts the event from 'polled' to 'fixed' type
 * 4. Copies the locked time to fixed_datetime
 * 5. Preserves votes and time_slots for history
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    // Parse request body
    const { data: body, error: bodyError } = await parseRequestBody<{
      timeslotId: string;
      cookieId: string;
    }>(request);
    if (bodyError) return bodyError;

    // Validate required fields
    const validation = validateRequiredFields(body, ['timeslotId', 'cookieId']);
    if (!validation.valid) return validation.error;

    const { timeslotId, cookieId } = body;

    // 1. Verify event exists and get full event data
    const { event, error: eventError } = await verifyEventExists(eventId);
    if (eventError) return eventError;

    // 2. Verify this is a polled event
    if (event.event_type !== 'polled') {
      return errorResponse('Only polled events can be locked. This is already a fixed-time event.', 400);
    }

    // 3. Verify event is not already locked
    if (event.status === 'locked' || event.locked_at) {
      return errorResponse('Event is already locked', 400);
    }

    // 4. Verify user is organizer
    const { error: organizerError } = await verifyOrganizer(eventId, cookieId);
    if (organizerError) return organizerError;

    // 5. Verify timeslot belongs to this event and get its data
    const { data: timeslot, error: slotError } = await supabaseAdmin
      .from('time_slots')
      .select('*')
      .eq('timeslot_id', timeslotId)
      .eq('event_id', eventId)
      .single();

    if (slotError || !timeslot) {
      return errorResponse('Invalid time slot', 400);
    }

    // 6. Lock and convert the event
    const { error: updateError } = await supabaseAdmin
      .from('events')
      .update({
        event_type: 'fixed', // Convert to fixed-time event
        fixed_datetime: timeslot.start_time, // Copy locked time
        locked_time_id: timeslotId, // Reference to locked timeslot
        locked_at: new Date().toISOString(), // When it was locked
        locked_by_cookie_id: cookieId, // Who locked it
        status: 'locked', // Mark as locked
      })
      .eq('event_id', eventId);

    if (updateError) {
      console.error('Error locking event:', updateError);
      return errorResponse('Failed to lock event', 500);
    }

    // Note: We keep time_slots and votes intact for historical reference

    return NextResponse.json({
      success: true,
      message: 'Event locked and converted to fixed-time successfully',
      locked_time: {
        datetime: timeslot.start_time,
        label: timeslot.label,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/events/[id]/lock:', error);
    return errorResponse('Internal server error', 500);
  }
}

