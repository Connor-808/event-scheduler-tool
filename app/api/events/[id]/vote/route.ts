import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const { cookieId, displayName, votes } = body;

    // Validate required fields
    if (!cookieId || !votes || !Array.isArray(votes)) {
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

    // Upsert votes (insert or update on conflict)
    const votePromises = votes.map(async (vote: { timeslotId: string; availability: string }) => {
      const { timeslotId, availability } = vote;

      // Validate availability
      if (!['available', 'maybe', 'unavailable'].includes(availability)) {
        throw new Error('Invalid availability value');
      }

      // First, try to update existing vote
      const { data: existingVote } = await supabase
        .from('votes')
        .select('vote_id')
        .eq('timeslot_id', timeslotId)
        .eq('cookie_id', cookieId)
        .single();

      if (existingVote) {
        // Update existing vote
        return supabase
          .from('votes')
          .update({
            availability,
            updated_at: new Date().toISOString(),
          })
          .eq('vote_id', existingVote.vote_id);
      } else {
        // Insert new vote
        return supabase.from('votes').insert({
          timeslot_id: timeslotId,
          cookie_id: cookieId,
          event_id: eventId,
          availability,
        });
      }
    });

    await Promise.all(votePromises);

    return NextResponse.json({
      success: true,
      message: 'Votes submitted successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/events/[id]/vote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

