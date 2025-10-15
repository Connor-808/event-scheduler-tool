/**
 * API Utilities and Middleware
 * Shared helpers for API routes to reduce duplication
 */

import { NextResponse } from 'next/server';
import { supabase } from './supabase';

/**
 * Standard API error response
 */
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Standard API success response
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Verify event exists and return standardized error response
 * Returns event data if found, or error response to return to client
 */
export async function verifyEventExists(
  eventId: string,
  selectFields: string = '*'
): Promise<{ event: any; error: null } | { event: null; error: NextResponse }> {
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select(selectFields)
    .eq('event_id', eventId)
    .single();

  if (eventError || !event) {
    return {
      event: null,
      error: errorResponse('Event not found', 404),
    };
  }

  return { event, error: null };
}

/**
 * Verify user is organizer for an event
 * Checks both cookie-based and auth-based organizer status
 */
export async function verifyOrganizer(
  eventId: string,
  cookieId: string,
  userId?: string
): Promise<{ isOrganizer: boolean; error: NextResponse | null }> {
  // Check cookie-based organizer
  const { data: userCookie } = await supabase
    .from('user_cookies')
    .select('is_organizer')
    .eq('cookie_id', cookieId)
    .eq('event_id', eventId)
    .single();

  if (userCookie?.is_organizer) {
    return { isOrganizer: true, error: null };
  }

  // Check auth-based organizer (if userId provided)
  if (userId) {
    const { data: event } = await supabase
      .from('events')
      .select('organizer_user_id')
      .eq('event_id', eventId)
      .single();

    if (event?.organizer_user_id === userId) {
      return { isOrganizer: true, error: null };
    }
  }

  return {
    isOrganizer: false,
    error: errorResponse('Unauthorized - only organizer can perform this action', 403),
  };
}

/**
 * Verify user cookie exists for an event
 * Returns user cookie data if found
 */
export async function verifyUserCookie(
  eventId: string,
  cookieId: string
): Promise<{ userCookie: any; error: null } | { userCookie: null; error: NextResponse }> {
  const { data: userCookie, error: cookieError } = await supabase
    .from('user_cookies')
    .select('*')
    .eq('cookie_id', cookieId)
    .eq('event_id', eventId)
    .single();

  if (cookieError || !userCookie) {
    return {
      userCookie: null,
      error: errorResponse('User not registered for this event', 404),
    };
  }

  return { userCookie, error: null };
}

/**
 * Parse JSON body from request with error handling
 */
export async function parseRequestBody<T>(request: Request): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const data = await request.json();
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: errorResponse('Invalid JSON in request body', 400),
    };
  }
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): { valid: true } | { valid: false; error: NextResponse } {
  const missing = requiredFields.filter(field => !data[field]);

  if (missing.length > 0) {
    return {
      valid: false,
      error: errorResponse(`Missing required fields: ${missing.join(', ')}`, 400),
    };
  }

  return { valid: true };
}
