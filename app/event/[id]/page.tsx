'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { getEventWithDetails, EventWithDetails, Vote, supabase } from '@/lib/supabase';
import { getUserCookieId, formatDateTime } from '@/lib/utils';

interface VoteState {
  [timeslotId: string]: boolean; // true = available, false/undefined = not selected
}

export default function EventVotingPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [votes, setVotes] = useState<VoteState>({});
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [cookieId, setCookieId] = useState('');

  useEffect(() => {
    async function loadEventAndVotes() {
      // Get or create cookie ID
      const userCookieId = getUserCookieId();
      setCookieId(userCookieId);

      // Load event
      const eventData = await getEventWithDetails(eventId);
      if (!eventData) {
        router.push('/');
        return;
      }

      setEvent(eventData);

      // Don't set up voting if event is cancelled or locked
      if (eventData.status === 'cancelled' || eventData.status === 'locked') {
        setIsLoading(false);
        return;
      }

      // Create user_cookies record if needed
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
      } else {
        // Load existing display name
        if (existingCookie.display_name) {
          setDisplayName(existingCookie.display_name);
        }
      }

      // Load existing votes
      const { data: existingVotes } = await supabase
        .from('votes')
        .select('*')
        .eq('cookie_id', userCookieId)
        .in('timeslot_id', eventData.time_slots.map(ts => ts.timeslot_id));

      if (existingVotes && existingVotes.length > 0) {
        const voteState: VoteState = {};
        existingVotes.forEach((vote: Vote) => {
          // Only mark as selected if availability is 'available'
          voteState[vote.timeslot_id] = vote.availability === 'available';
        });
        setVotes(voteState);
        setHasVoted(true);
      }

      setIsLoading(false);
    }

    loadEventAndVotes();
  }, [eventId, router]);

  const handleToggle = (timeslotId: string) => {
    setVotes({ ...votes, [timeslotId]: !votes[timeslotId] });
  };

  const handleSubmit = async () => {
    if (!event) return;

    setIsSubmitting(true);

    try {
      // Submit votes via API - send all timeslots with their availability
      const response = await fetch(`/api/events/${eventId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cookieId,
          displayName: displayName || null,
          votes: event.time_slots.map(slot => ({
            timeslotId: slot.timeslot_id,
            availability: votes[slot.timeslot_id] ? 'available' : 'unavailable',
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit votes');
      }

      setHasVoted(true);
      setShowConfirmation(true);
    } catch (error) {
      console.error('Error submitting votes:', error);
      alert('Failed to submit votes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4" />
          <p className="text-base text-foreground/70 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 sm:mb-10 animate-in fade-in zoom-in duration-300">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-4 shadow-lg">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">Thanks for voting!</h1>
            <p className="text-base sm:text-lg text-foreground/70">Your availability has been recorded</p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{event?.title}</CardTitle>
              {event?.location && <CardDescription>📍 {event.location}</CardDescription>}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground/60">Times you selected:</p>
                {event?.time_slots.filter(slot => votes[slot.timeslot_id]).length === 0 ? (
                  <p className="text-sm text-foreground/60 py-4">You didn&apos;t select any times as available</p>
                ) : (
                  event?.time_slots.filter(slot => votes[slot.timeslot_id]).map(slot => (
                    <div key={slot.timeslot_id} className="flex items-center gap-3 py-2 border-b border-foreground/10 last:border-0">
                      <div className="text-green-600">✓</div>
                      <div className="text-sm flex-1">
                        <div className="font-medium">{formatDateTime(slot.start_time)}</div>
                        {slot.label && <div className="text-foreground/60">{slot.label}</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button variant="secondary" onClick={() => setShowConfirmation(false)} className="w-full">
              Change My Votes
            </Button>
            <p className="text-center text-sm text-foreground/60">
              The organizer will pick a time soon. Bookmark this page to check back later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const selectedCount = Object.values(votes).filter(Boolean).length;

  // Show locked state
  if (event?.status === 'locked' && event.locked_time) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 animate-in fade-in zoom-in duration-300">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
              <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">The time has been set!</h1>
            <p className="text-lg text-foreground/60">See you there</p>
          </div>

          <Card className="mb-6 border-2 border-blue-600/50">
            <CardHeader>
              <CardTitle>{event.title}</CardTitle>
              {event.location && <CardDescription>📍 {event.location}</CardDescription>}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground/60 mb-2">Final Time</p>
                  <p className="text-2xl font-bold">{formatDateTime(event.locked_time.start_time)}</p>
                  {event.locked_time.label && (
                    <p className="text-foreground/60 mt-1">{event.locked_time.label}</p>
                  )}
                </div>

                <div className="pt-4 border-t border-foreground/10">
                  <p className="text-sm font-medium text-foreground/60 mb-2">Who&apos;s Going</p>
                  <div className="space-y-1">
                    {event.participants
                      .filter(p => p.display_name)
                      .map(p => (
                        <div key={p.cookie_id} className="text-sm">
                          {p.display_name}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-foreground/60">
            <p>Voting is now closed</p>
          </div>
        </div>
      </div>
    );
  }

  // Show cancelled state
  if (event?.status === 'cancelled') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Event Cancelled</h1>
          <p className="text-foreground/60 mb-6">
            This event was cancelled by the organizer
          </p>
          <Button onClick={() => router.push('/')}>
            Create Your Own Event
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 sm:pb-12">
      <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Event Header */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle>{event?.title}</CardTitle>
              {event?.location && <CardDescription>📍 {event.location}</CardDescription>}
              {hasVoted && (
                <div className="pt-3">
                  <span className="inline-block px-3 py-1.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-full">
                    ✓ You voted {event?.participants.find(p => p.cookie_id === cookieId)?.last_active ? new Date(event.participants.find(p => p.cookie_id === cookieId)!.last_active).toLocaleTimeString() : ''}
                  </span>
                </div>
              )}
            </CardHeader>
          </Card>

          {/* Voting Prompt */}
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 leading-tight">What times work for you?</h2>
            <p className="text-base sm:text-lg text-foreground/70">
              {hasVoted ? 'You can update your availability anytime' : 'Select all times that work for you'}
            </p>
          </div>

          {/* Time Slots */}
          <div className="space-y-3 sm:space-y-4 mb-6">
            {event?.time_slots.map((slot) => (
              <button
                key={slot.timeslot_id}
                onClick={() => handleToggle(slot.timeslot_id)}
                className={`w-full p-4 sm:p-5 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-4 min-h-[76px] touch-manipulation ${
                  votes[slot.timeslot_id]
                    ? 'border-green-600 bg-green-600/10 shadow-sm'
                    : 'border-foreground/20 hover:border-foreground/40 active:bg-foreground/5'
                }`}
              >
                {/* Checkbox - larger for better touch */}
                <div className={`flex-shrink-0 w-7 h-7 sm:w-6 sm:h-6 rounded border-2 flex items-center justify-center transition-all ${
                  votes[slot.timeslot_id]
                    ? 'bg-green-600 border-green-600'
                    : 'border-foreground/40'
                }`}>
                  {votes[slot.timeslot_id] && (
                    <svg className="w-5 h-5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Time Info */}
                <div className="flex-1">
                  <div className="font-bold text-base sm:text-lg">{formatDateTime(slot.start_time)}</div>
                  {slot.label && <div className="text-sm sm:text-base text-foreground/70 mt-0.5">{slot.label}</div>}
                </div>
              </button>
            ))}
          </div>

          {/* Display Name */}
          <Card className="p-4 mb-6">
            <Input
              label="Your Name (Optional)"
              placeholder="Anonymous"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              helperText="Help others identify you"
              maxLength={50}
            />
          </Card>

          {/* Desktop Submit Button - hidden on mobile */}
          <div className="hidden sm:block">
            <Button
              size="lg"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              className="w-full"
            >
              {hasVoted ? 'Update My Availability' : 'Submit My Availability'}
              {selectedCount > 0 && ` (${selectedCount} selected)`}
            </Button>
          </div>
        </div>
      </div>

      {/* Fixed Bottom CTA - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-foreground/10 sm:hidden z-50">
        <div className="px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <Button
            size="lg"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            className="w-full min-h-[52px] shadow-lg"
          >
            {hasVoted ? 'Update My Availability' : 'Submit My Availability'}
            {selectedCount > 0 && ` (${selectedCount})`}
          </Button>
        </div>
      </div>
    </div>
  );
}

