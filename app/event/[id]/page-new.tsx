'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { getEventWithDetails, EventWithDetails, Vote, RSVP, supabase } from '@/lib/supabase';
import { getUserCookieId, formatDateTime, openCalendar, CalendarEvent } from '@/lib/utils';
import { EventHeroImage } from '@/components/EventHeroImage';

// ============================================================================
// TYPE GUARDS & HELPERS
// ============================================================================

function isFixedTimeEvent(event: EventWithDetails): boolean {
  return event.event_type === 'fixed';
}

function isPolledTimeEvent(event: EventWithDetails): boolean {
  return event.event_type === 'polled';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [cookieId, setCookieId] = useState('');
  const [isOrganizer, setIsOrganizer] = useState(false);

  // Fixed Time (RSVP) state
  const [rsvpResponse, setRsvpResponse] = useState<'yes' | 'no' | 'maybe' | null>(null);
  const [existingRsvp, setExistingRsvp] = useState<RSVP | null>(null);

  // Polled Time (Voting) state
  const [selectedTimes, setSelectedTimes] = useState<Set<string>>(new Set());
  const [existingVotes, setExistingVotes] = useState<Vote[]>([]);

  // ============================================================================
  // LOAD EVENT DATA
  // ============================================================================

  useEffect(() => {
    async function loadEvent() {
      const userCookieId = getUserCookieId();
      setCookieId(userCookieId);

      // Load event
      const eventData = await getEventWithDetails(eventId);
      if (!eventData) {
        router.push('/');
        return;
      }

      setEvent(eventData);

      // Check if user is organizer
      const organizer = eventData.participants.find(
        (p) => p.cookie_id === userCookieId && p.is_organizer
      );
      setIsOrganizer(!!organizer);

      // Load type-specific data
      if (isFixedTimeEvent(eventData)) {
        await loadRSVPData(eventData, userCookieId);
      } else if (isPolledTimeEvent(eventData)) {
        await loadVotingData(eventData, userCookieId);
      }

      setIsLoading(false);
    }

    loadEvent();
  }, [eventId, router]);

  // ============================================================================
  // LOAD RSVP DATA (Fixed Time Events)
  // ============================================================================

  async function loadRSVPData(eventData: EventWithDetails, userCookieId: string) {
    // Check for existing RSVP
    const { data: rsvp } = await supabase
      .from('rsvps')
      .select('*')
      .eq('event_id', eventId)
      .eq('cookie_id', userCookieId)
      .single();

    if (rsvp) {
      setExistingRsvp(rsvp);
      setRsvpResponse(rsvp.response);
      setHasResponded(true);
      if (rsvp.user_name) {
        setDisplayName(rsvp.user_name);
      }
    }

    // Ensure user_cookie exists
    const { data: existingCookie } = await supabase
      .from('user_cookies')
      .select('*')
      .eq('cookie_id', userCookieId)
      .eq('event_id', eventId)
      .single();

    if (!existingCookie) {
      await supabase.from('user_cookies').insert({
        cookie_id: userCookieId,
        event_id: eventId,
        is_organizer: false,
      });
    } else if (existingCookie.display_name) {
      setDisplayName(existingCookie.display_name);
    }
  }

  // ============================================================================
  // LOAD VOTING DATA (Polled Events)
  // ============================================================================

  async function loadVotingData(eventData: EventWithDetails, userCookieId: string) {
    // Check for existing votes
    const { data: votes } = await supabase
      .from('votes')
      .select('*')
      .eq('cookie_id', userCookieId)
      .in('timeslot_id', eventData.time_slots.map(ts => ts.timeslot_id));

    if (votes && votes.length > 0) {
      setExistingVotes(votes);
      const selected = new Set<string>();
      votes.forEach((vote: Vote) => {
        if (vote.availability === 'available') {
          selected.add(vote.timeslot_id);
        }
      });
      setSelectedTimes(selected);
      setHasResponded(true);
    }

    // Ensure user_cookie exists
    const { data: existingCookie } = await supabase
      .from('user_cookies')
      .select('*')
      .eq('cookie_id', userCookieId)
      .eq('event_id', eventId)
      .single();

    if (!existingCookie) {
      await supabase.from('user_cookies').insert({
        cookie_id: userCookieId,
        event_id: eventId,
        is_organizer: false,
      });
    } else if (existingCookie.display_name) {
      setDisplayName(existingCookie.display_name);
    }
  }

  // ============================================================================
  // SUBMIT RSVP (Fixed Time)
  // ============================================================================

  const handleSubmitRSVP = async (response: 'yes' | 'no' | 'maybe') => {
    if (!event || !isFixedTimeEvent(event)) return;

    setIsSubmitting(true);

    try {
      const apiResponse = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cookie_id: cookieId,
          user_name: displayName || null,
          response,
        }),
      });

      if (!apiResponse.ok) {
        throw new Error('Failed to submit RSVP');
      }

      setRsvpResponse(response);
      setHasResponded(true);
      setShowConfirmation(true);
    } catch (error) {
      console.error('Error submitting RSVP:', error);
      alert('Failed to submit RSVP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // SUBMIT VOTES (Polled Time)
  // ============================================================================

  const handleSubmitVotes = async () => {
    if (!event || !isPolledTimeEvent(event)) return;

    if (selectedTimes.size === 0) {
      alert('Please select at least one time that works for you.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Send all votes with availability status
      const votes = event.time_slots.map(slot => ({
        timeslotId: slot.timeslot_id,
        availability: selectedTimes.has(slot.timeslot_id) ? 'available' : 'unavailable',
      }));

      const response = await fetch(`/api/events/${eventId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cookieId,
          displayName: displayName || null,
          votes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit votes');
      }

      setHasResponded(true);
      setShowConfirmation(true);
    } catch (error) {
      console.error('Error submitting votes:', error);
      alert('Failed to submit votes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // TOGGLE TIME SELECTION (Polled Events)
  // ============================================================================

  const toggleTimeSelection = (timeslotId: string) => {
    const newSelected = new Set(selectedTimes);
    if (newSelected.has(timeslotId)) {
      newSelected.delete(timeslotId);
    } else {
      newSelected.add(timeslotId);
    }
    setSelectedTimes(newSelected);
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4" />
          <p className="text-base text-foreground/70 font-medium">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Event not found</h1>
          <p className="text-foreground/70 mb-4">This event doesn't exist or has been deleted.</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ============================================================================
  // CONFIRMATION SCREEN
  // ============================================================================

  if (showConfirmation) {
    return (
      <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <EventHeroImage imageUrl={event.hero_image_url} title={event.title} />

          <div className="text-center mb-8 sm:mb-10 animate-in fade-in zoom-in duration-300">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-4 shadow-lg">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">
              {isFixedTimeEvent(event) ? 'Thanks for your RSVP!' : 'Thanks for voting!'}
            </h1>
            <p className="text-base sm:text-lg text-foreground/70">
              {isFixedTimeEvent(event) 
                ? 'Your response has been recorded' 
                : 'Your availability has been recorded'}
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{event.title}</CardTitle>
              {event.location && <CardDescription>📍 {event.location}</CardDescription>}
            </CardHeader>
            <CardContent>
              {isFixedTimeEvent(event) && rsvpResponse && (
                <div className="text-center py-4 space-y-4">
                  <p className="text-sm font-medium text-foreground/60 mb-3">Your response:</p>
                  {rsvpResponse === 'yes' && (
                    <>
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-bold text-lg">Yes, I'll be there!</span>
                      </div>
                      {event.fixed_datetime && (
                        <Button
                          onClick={() => {
                            const calendarEvent: CalendarEvent = {
                              title: event.title,
                              start: new Date(event.fixed_datetime!),
                              location: event.location || '',
                              description: event.notes || '',
                            };
                            openCalendar(calendarEvent, 'google');
                          }}
                          variant="secondary"
                          className="w-full"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Add to Calendar
                        </Button>
                      )}
                    </>
                  )}
                  {rsvpResponse === 'no' && (
                    <div className="flex items-center justify-center gap-2 text-red-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="font-bold text-lg">Can't make it</span>
                    </div>
                  )}
                  {rsvpResponse === 'maybe' && (
                    <div className="flex items-center justify-center gap-2 text-yellow-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-bold text-lg">Maybe</span>
                    </div>
                  )}
                </div>
              )}

              {isPolledTimeEvent(event) && selectedTimes.size > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground/60">Times you selected:</p>
                  {event.time_slots.filter(slot => selectedTimes.has(slot.timeslot_id)).map(slot => (
                    <div key={slot.timeslot_id} className="flex items-center gap-3 py-2 border-b border-foreground/10 last:border-0">
                      <div className="text-green-600">✓</div>
                      <div className="text-sm flex-1">
                        <div className="font-medium">{formatDateTime(slot.start_time)}</div>
                        {slot.label && <div className="text-foreground/60">{slot.label}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            {isOrganizer && (
              <Link href={`/event/${eventId}/dashboard`} className="flex-1">
                <Button className="w-full" variant="default">
                  View Dashboard
                </Button>
              </Link>
            )}
            <Button
              onClick={() => setShowConfirmation(false)}
              variant="secondary"
              className={isOrganizer ? 'flex-1' : 'w-full'}
            >
              {hasResponded ? 'Change Response' : 'Go Back'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MAIN EVENT VIEW
  // ============================================================================

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 pb-32 sm:pb-12">
      <div className="max-w-2xl mx-auto">
        <EventHeroImage imageUrl={event.hero_image_url} title={event.title} />

        {/* Event Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">{event.title}</h1>
          
          {event.location && (
            <div className="flex items-start gap-2 text-base sm:text-lg text-foreground/70 mb-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{event.location}</span>
            </div>
          )}

          {event.notes && (
            <div className="mt-4 p-4 bg-foreground/5 rounded-lg border border-foreground/10">
              <p className="text-sm text-foreground/70 whitespace-pre-wrap">{event.notes}</p>
            </div>
          )}
        </div>

        {/* Organizer Dashboard Link */}
        {isOrganizer && (
          <Link href={`/event/${eventId}/dashboard`}>
            <Button variant="secondary" className="w-full mb-6">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Event Dashboard
            </Button>
          </Link>
        )}

        {/* Name Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Your Name</CardTitle>
            <CardDescription>Optional - helps the organizer know who's responding</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Enter your name (optional)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
            />
          </CardContent>
        </Card>

        {/* FIXED TIME EVENT - RSVP INTERFACE */}
        {isFixedTimeEvent(event) && event.fixed_datetime && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">Event Time</CardTitle>
              <CardDescription>Can you make it?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Show Event Time */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-600/30">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <div className="font-semibold text-blue-900 dark:text-blue-100">
                        {formatDateTime(event.fixed_datetime)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RSVP Buttons */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground/70">Your response:</p>
                  
                  <button
                    onClick={() => handleSubmitRSVP('yes')}
                    disabled={isSubmitting}
                    className={`w-full py-4 px-4 rounded-lg border-2 transition-all duration-200 ${
                      rsvpResponse === 'yes'
                        ? 'bg-green-600 border-green-600 text-white shadow-md'
                        : 'border-foreground/20 hover:border-green-600/50 hover:bg-green-600/5'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-semibold">Yes, I'll be there!</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSubmitRSVP('maybe')}
                    disabled={isSubmitting}
                    className={`w-full py-4 px-4 rounded-lg border-2 transition-all duration-200 ${
                      rsvpResponse === 'maybe'
                        ? 'bg-yellow-600 border-yellow-600 text-white shadow-md'
                        : 'border-foreground/20 hover:border-yellow-600/50 hover:bg-yellow-600/5'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-semibold">Maybe</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSubmitRSVP('no')}
                    disabled={isSubmitting}
                    className={`w-full py-4 px-4 rounded-lg border-2 transition-all duration-200 ${
                      rsvpResponse === 'no'
                        ? 'bg-red-600 border-red-600 text-white shadow-md'
                        : 'border-foreground/20 hover:border-red-600/50 hover:bg-red-600/5'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="font-semibold">Can't make it</span>
                    </div>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* POLLED TIME EVENT - VOTING INTERFACE */}
        {isPolledTimeEvent(event) && event.time_slots.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">Which times work for you?</CardTitle>
              <CardDescription>Select all times you're available</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {event.time_slots.map((slot) => {
                  const isSelected = selectedTimes.has(slot.timeslot_id);
                  return (
                    <button
                      key={slot.timeslot_id}
                      onClick={() => toggleTimeSelection(slot.timeslot_id)}
                      className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                          : 'border-foreground/20 hover:border-blue-600/50 hover:bg-blue-600/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                          isSelected
                            ? 'bg-white border-white'
                            : 'border-foreground/30'
                        }`}>
                          {isSelected && (
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{formatDateTime(slot.start_time)}</div>
                          {slot.label && <div className={`text-sm ${isSelected ? 'text-white/80' : 'text-foreground/60'}`}>{slot.label}</div>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button - Fixed at bottom on mobile */}
        {isPolledTimeEvent(event) && (
          <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-foreground/10 sm:hidden z-50">
            <div className="px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <Button
                onClick={handleSubmitVotes}
                disabled={isSubmitting || selectedTimes.size === 0}
                className="w-full min-h-[52px] text-base font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  `Submit ${selectedTimes.size} Time${selectedTimes.size !== 1 ? 's' : ''}`
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Submit Button - Desktop */}
        {isPolledTimeEvent(event) && (
          <div className="hidden sm:block">
            <Button
              onClick={handleSubmitVotes}
              disabled={isSubmitting || selectedTimes.size === 0}
              className="w-full h-14 text-base font-semibold"
            >
              {isSubmitting ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                `Submit Votes (${selectedTimes.size} selected)`
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

