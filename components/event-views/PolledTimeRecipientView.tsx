'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EventWithDetails, Vote, supabase } from '@/lib/supabase';
import { getUserCookieId, formatDateTime } from '@/lib/utils';
import { EventHeroImage } from '@/components/EventHeroImage';

interface PolledTimeRecipientViewProps {
  event: EventWithDetails;
  eventId: string;
  isOrganizer: boolean;
}

export function PolledTimeRecipientView({ event, eventId, isOrganizer }: PolledTimeRecipientViewProps) {
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [cookieId, setCookieId] = useState('');
  const [selectedTimes, setSelectedTimes] = useState<Set<string>>(new Set());

  // Load existing votes
  useEffect(() => {
    async function loadVotes() {
      const userCookieId = getUserCookieId();
      setCookieId(userCookieId);

      const { data: votes } = await supabase
        .from('votes')
        .select('*')
        .eq('cookie_id', userCookieId)
        .in('timeslot_id', event.time_slots.map(ts => ts.timeslot_id));

      if (votes && votes.length > 0) {
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

    loadVotes();
  }, [eventId, event.time_slots]);

  const toggleTimeSelection = (timeslotId: string) => {
    const newSelected = new Set(selectedTimes);
    if (newSelected.has(timeslotId)) {
      newSelected.delete(timeslotId);
    } else {
      newSelected.add(timeslotId);
    }
    setSelectedTimes(newSelected);
  };

  const handleSubmitVotes = async () => {
    if (selectedTimes.size === 0) {
      alert('Please select at least one time that works for you.');
      return;
    }

    setIsSubmitting(true);

    try {
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
              Thanks for voting!
            </h1>
            <p className="text-base sm:text-lg text-foreground/70">
              Your availability has been recorded
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{event.title}</CardTitle>
              {event.location && <CardDescription>📍 {event.location}</CardDescription>}
            </CardHeader>
            <CardContent>
              {selectedTimes.size > 0 && (
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

  // Main voting view
  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 pb-32 sm:pb-12">
      <div className="max-w-2xl mx-auto">
        <EventHeroImage imageUrl={event.hero_image_url} title={event.title} />

        {/* Event Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">{event.title}</h1>
          
          {/* Polled Time Display - Prominent */}
          {event.time_slots.length > 0 && (
            <div className="mb-4 p-5 sm:p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-500/10 dark:to-purple-600/10 rounded-xl border-2 border-purple-600/40 dark:border-purple-500/30 shadow-sm">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-600 dark:bg-purple-500 flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-purple-900 dark:text-purple-400 uppercase tracking-wide mb-1">
                    Time Options
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-purple-950 dark:text-purple-100 leading-tight">
                    {event.time_slots.length} {event.time_slots.length === 1 ? 'time' : 'times'} to choose from
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

        {/* Voting Interface */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Which times work for you?</CardTitle>
            <CardDescription>Select all times you&apos;re available</CardDescription>
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

        {/* Submit Button - Fixed at bottom on mobile */}
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

        {/* Submit Button - Desktop */}
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
      </div>
    </div>
  );
}

