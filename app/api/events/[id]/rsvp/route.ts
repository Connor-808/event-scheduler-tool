import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  errorResponse,
  parseRequestBody,
  validateRequiredFields,
  verifyEventExists,
} from '@/lib/api-utils';

/**
 * POST /api/events/[id]/rsvp
 * Submit or update RSVP for a fixed-time event
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    // 1. Verify event exists
    const { event, error: eventError } = await verifyEventExists(eventId);
    if (eventError) return eventError;

    // 2. Verify this is a fixed-time event
    if (event.event_type !== 'fixed') {
      return errorResponse(
        'RSVPs are only available for fixed-time events. Use /vote for polled events.',
        400
      );
    }

    // 3. Parse and validate request body
    const bodyResult = await parseRequestBody<{
      cookie_id: string;
      user_name?: string;
      response: 'yes' | 'no' | 'maybe';
    }>(request);

    if (bodyResult.error) {
      return bodyResult.error;
    }

    const body = bodyResult.data;

    const validation = validateRequiredFields(body, ['cookie_id', 'response']);
    if (!validation.valid) {
      return validation.error;
    }

    const { cookie_id, user_name, response } = body;

    // 4. Validate response value
    if (!['yes', 'no', 'maybe'].includes(response)) {
      return errorResponse('Response must be "yes", "no", or "maybe"', 400);
    }

    // 5. Ensure user_cookie exists for this event
    const { data: existingCookie } = await supabaseAdmin
      .from('user_cookies')
      .select('cookie_id')
      .eq('cookie_id', cookie_id)
      .eq('event_id', eventId)
      .single();

    if (!existingCookie) {
      // Create user_cookie if it doesn't exist
      const { error: cookieError } = await supabaseAdmin
        .from('user_cookies')
        .insert({
          cookie_id,
          event_id: eventId,
          is_organizer: false,
          display_name: user_name || null,
        });

      if (cookieError) {
        console.error('Error creating user cookie:', cookieError);
        return errorResponse('Failed to register user', 500);
      }
    }

    // 6. Upsert RSVP
    const { data: rsvp, error: rsvpError } = await supabaseAdmin
      .from('rsvps')
      .upsert(
        {
          event_id: eventId,
          cookie_id,
          user_name: user_name || null,
          response,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'cookie_id,event_id',
        }
      )
      .select()
      .single();

    if (rsvpError) {
      console.error('Error upserting RSVP:', rsvpError);
      return errorResponse('Failed to save RSVP', 500);
    }

    return NextResponse.json({
      success: true,
      message: 'RSVP saved successfully',
      rsvp,
    });
  } catch (error) {
    console.error('Error in POST /api/events/[id]/rsvp:', error);
    return errorResponse('Internal server error', 500);
  }
}

/**
 * GET /api/events/[id]/rsvp
 * Get RSVP breakdown for a fixed-time event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    // 1. Verify event exists
    const { event, error: eventError } = await verifyEventExists(eventId);
    if (eventError) return eventError;

    // 2. Verify this is a fixed-time event
    if (event.event_type !== 'fixed') {
      return errorResponse(
        'RSVPs are only available for fixed-time events',
        400
      );
    }

    // 3. Get RSVP breakdown using database function
    const { data: breakdown, error: breakdownError } = await supabaseAdmin.rpc(
      'get_rsvp_breakdown',
      { p_event_id: eventId }
    );

    if (breakdownError) {
      console.error('Error fetching RSVP breakdown:', breakdownError);
      return errorResponse('Failed to fetch RSVP breakdown', 500);
    }

    // 4. Get all RSVPs with details
    const { data: rsvps, error: rsvpsError } = await supabaseAdmin
      .from('rsvps')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (rsvpsError) {
      console.error('Error fetching RSVPs:', rsvpsError);
      return errorResponse('Failed to fetch RSVPs', 500);
    }

    return NextResponse.json({
      success: true,
      breakdown: breakdown || [],
      rsvps: rsvps || [],
      total_count: rsvps?.length || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/events/[id]/rsvp:', error);
    return errorResponse('Internal server error', 500);
  }
}

