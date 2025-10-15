import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyEventExists, parseRequestBody, validateRequiredFields, errorResponse } from '@/lib/api-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    // Parse request body
    const { data: body, error: bodyError } = await parseRequestBody<{
      cookieId: string;
      displayName?: string;
      votes: Array<{ timeslotId: string; availability: string }>;
    }>(request);
    if (bodyError) return bodyError;

    // Validate required fields
    const validation = validateRequiredFields(body, ['cookieId', 'votes']);
    if (!validation.valid) return validation.error;

    if (!Array.isArray(body.votes)) {
      return errorResponse('Votes must be an array', 400);
    }

    const { cookieId, displayName, votes } = body;

    // Verify event exists
    const { event, error: eventError } = await verifyEventExists(eventId, 'event_id');
    if (eventError) return eventError;

    // Update display name and last_active if provided
    if (displayName) {
      await supabase
        .from('user_cookies')
        .update({
          display_name: displayName,
          last_active: new Date().toISOString(),
        })
        .eq('cookie_id', cookieId)
        .eq('event_id', eventId);
    } else {
      // Just update last_active
      await supabase
        .from('user_cookies')
        .update({
          last_active: new Date().toISOString(),
        })
        .eq('cookie_id', cookieId)
        .eq('event_id', eventId);
    }

    // Validate all votes first
    for (const vote of votes) {
      if (!['available', 'maybe', 'unavailable'].includes(vote.availability)) {
        return errorResponse('Invalid availability value', 400);
      }
    }

    // OPTIMIZED: Batch upsert using PostgreSQL's ON CONFLICT
    // This replaces 2N queries (select + insert/update) with 1 batch query
    const voteRecords = votes.map((vote: { timeslotId: string; availability: string }) => ({
      timeslot_id: vote.timeslotId,
      cookie_id: cookieId,
      event_id: eventId,
      availability: vote.availability,
      updated_at: new Date().toISOString(),
    }));

    const { error: voteError } = await supabase
      .from('votes')
      .upsert(voteRecords, {
        onConflict: 'timeslot_id,cookie_id',
        ignoreDuplicates: false, // Update on conflict
      });

    if (voteError) {
      console.error('Error upserting votes:', voteError);
      return errorResponse('Failed to save votes', 500);
    }

    return NextResponse.json({
      success: true,
      message: 'Votes submitted successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/events/[id]/vote:', error);
    return errorResponse('Internal server error', 500);
  }
}

