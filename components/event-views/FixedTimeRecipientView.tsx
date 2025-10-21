'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EventWithDetails, supabase } from '@/lib/supabase';
import { getUserCookieId, formatDateTime, openCalendar, CalendarEvent } from '@/lib/utils';
import { EventHeroImage } from '@/components/EventHeroImage';

interface FixedTimeRecipientViewProps {
  event: EventWithDetails;
  eventId: string;
  isOrganizer: boolean;
}

export function FixedTimeRecipientView({ event, eventId, isOrganizer }: FixedTimeRecipientViewProps) {
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [cookieId, setCookieId] = useState('');
  const [rsvpResponse, setRsvpResponse] = useState<'yes' | 'no' | 'maybe' | null>(null);

  // Load existing RSVP
  useEffect(() => {
    async function loadRSVP() {
      const userCookieId = getUserCookieId();
      setCookieId(userCookieId);

      const { data: rsvp } = await supabase
        .from('rsvps')
        .select('*')
        .eq('event_id', eventId)
        .eq('cookie_id', userCookieId)
        .single();

      if (rsvp) {
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

    loadRSVP();
  }, [eventId]);

  const handleSubmitRSVP = async (response: 'yes' | 'no' | 'maybe') => {
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

  // Confirmation screen
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
              Thanks for your RSVP!
            </h1>
            <p className="text-base sm:text-lg text-foreground/70">
              Your response has been recorded
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{event.title}</CardTitle>
              {event.location && <CardDescription>📍 {event.location}</CardDescription>}
            </CardHeader>
            <CardContent>
              {rsvpResponse && (
                <div className="text-center py-4 space-y-4">
                  <p className="text-sm font-medium text-foreground/60 mb-3">Your response:</p>
                  {rsvpResponse === 'yes' && (
                    <>
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-bold text-lg">Yes, I&apos;ll be there!</span>
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
                      <span className="font-bold text-lg">Can&apos;t make it</span>
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
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            {isOrganizer && (
              <Link href={`/event/${eventId}/dashboard`} className="flex-1">
                <Button className="w-full" variant="default">
                  View Event Dashboard
                </Button>
              </Link>
            )}
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full" variant="default">
                My Events
              </Button>
            </Link>
            <Button
              onClick={() => setShowConfirmation(false)}
              variant="secondary"
              className="flex-1"
            >
              {hasResponded ? 'Change Response' : 'Go Back'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main RSVP View
  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 pb-32 sm:pb-12">
      <div className="max-w-2xl mx-auto">
        <EventHeroImage imageUrl={event.hero_image_url} title={event.title} />

        {/* Event Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">{event.title}</h1>
          
          {/* Fixed Time Display - Prominent */}
          {event.fixed_datetime && (
            <div className="mb-4 p-5 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-500/10 dark:to-blue-600/10 rounded-xl border-2 border-blue-600/40 dark:border-blue-500/30 shadow-sm">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-400 uppercase tracking-wide mb-1">
                    Event Time
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-950 dark:text-blue-100 leading-tight">
                    {formatDateTime(event.fixed_datetime)}
                  </div>
                </div>
              </div>
            </div>
          )}
          
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
            <CardDescription>Optional - helps the organizer know who&apos;s responding</CardDescription>
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

        {/* RSVP Interface */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Can you make it?</CardTitle>
            <CardDescription>Let the organizer know if you&apos;ll be there</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                      <span className="font-semibold">Yes, I&apos;ll be there!</span>
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
                      <span className="font-semibold">Can&apos;t make it</span>
                  </div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

