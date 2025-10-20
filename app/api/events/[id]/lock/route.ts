import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyEventExists, verifyOrganizer, parseRequestBody, validateRequiredFields, errorResponse } from '@/lib/api-utils';

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

    // Verify event exists
    const { error: eventError } = await verifyEventExists(eventId);
    if (eventError) return eventError;

    // Verify user is organizer
    const { error: organizerError } = await verifyOrganizer(eventId, cookieId);
    if (organizerError) return organizerError;

    // Verify timeslot belongs to this event
    const { data: timeslot, error: slotError } = await supabase
      .from('time_slots')
      .select('*')
      .eq('timeslot_id', timeslotId)
      .eq('event_id', eventId)
      .single();

    if (slotError || !timeslot) {
      return errorResponse('Invalid time slot', 400);
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
      return errorResponse('Failed to lock time', 500);
    }

    return NextResponse.json({
      success: true,
      message: 'Time locked successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/events/[id]/lock:', error);
    return errorResponse('Internal server error', 500);
  }
}

