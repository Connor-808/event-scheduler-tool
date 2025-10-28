import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const cookieId = request.nextUrl.searchParams.get('cookieId');

    if (!cookieId) {
      return NextResponse.json(
        { error: 'Cookie ID is required' },
        { status: 400 }
      );
    }

    // Get all events where user is organizer
    const { data: userCookies, error: cookiesError } = await supabase
      .from('user_cookies')
      .select('event_id')
      .eq('cookie_id', cookieId)
      .eq('is_organizer', true);

    if (cookiesError) {
      console.error('Error fetching user cookies:', cookiesError);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    if (!userCookies || userCookies.length === 0) {
      return NextResponse.json({ events: [] });
    }

    const eventIds = userCookies.map((uc) => uc.event_id);

    // Fetch all events with details
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .in('event_id', eventIds)
      .order('created_at', { ascending: false });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    // For each event, get participant count and vote count
    const eventsWithDetails = await Promise.all(
      (events || []).map(async (event) => {
        // Get participant count
        const { count: participantCount } = await supabase
          .from('user_cookies')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.event_id);

        // Get vote count (unique voters)
        const { data: votes } = await supabase
          .from('votes')
          .select('cookie_id')
          .eq('event_id', event.event_id);

        const uniqueVoters = new Set(votes?.map((v) => v.cookie_id) || []).size;

        // Get time slot count
        const { count: timeSlotCount } = await supabase
          .from('time_slots')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.event_id);

        return {
          ...event,
          participant_count: participantCount || 0,
          vote_count: uniqueVoters,
          time_slot_count: timeSlotCount || 0,
        };
      })
    );

    return NextResponse.json({ events: eventsWithDetails });
  } catch (error) {
    console.error('Error in GET /api/my-events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

