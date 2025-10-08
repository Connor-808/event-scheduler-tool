'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { getEventWithDetails, EventWithDetails, Vote, supabase } from '@/lib/supabase';
import { getUserCookieId, formatDateTime } from '@/lib/utils';

type Availability = 'available' | 'maybe' | 'unavailable';

interface VoteState {
  [timeslotId: string]: Availability;
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
          voteState[vote.timeslot_id] = vote.availability;
        });
        setVotes(voteState);
        setHasVoted(true);
      }

      setIsLoading(false);
    }

    loadEventAndVotes();
  }, [eventId, router]);

  const handleVote = (timeslotId: string, availability: Availability) => {
    setVotes({ ...votes, [timeslotId]: availability });
  };

  const handleSubmit = async () => {
    if (!event) return;

    // Validate all slots have votes
    const allSlotsVoted = event.time_slots.every(slot => votes[slot.timeslot_id]);
    if (!allSlotsVoted) {
      alert('Please vote on all time slots');
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit votes via API
      const response = await fetch(`/api/events/${eventId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cookieId,
          displayName: displayName || null,
          votes: Object.entries(votes).map(([timeslotId, availability]) => ({
            timeslotId,
            availability,
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4" />
          <p className="text-foreground/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 animate-in fade-in zoom-in duration-300">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Thanks for voting!</h1>
            <p className="text-lg text-foreground/60">Your availability has been recorded</p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{event?.title}</CardTitle>
              {event?.location && <CardDescription>📍 {event.location}</CardDescription>}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground/60">Your Votes:</p>
                {event?.time_slots.map(slot => (
                  <div key={slot.timeslot_id} className="flex items-center justify-between py-2 border-b border-foreground/10 last:border-0">
                    <div className="text-sm">
                      <div className="font-medium">{formatDateTime(slot.start_time)}</div>
                      {slot.label && <div className="text-foreground/60">{slot.label}</div>}
                    </div>
                    <div className={`text-sm font-medium ${
                      votes[slot.timeslot_id] === 'available' ? 'text-green-600' :
                      votes[slot.timeslot_id] === 'maybe' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {votes[slot.timeslot_id] === 'available' ? '✓ Can make it' :
                       votes[slot.timeslot_id] === 'maybe' ? '? Maybe' :
                       '✗ Can\'t make it'}
                    </div>
                  </div>
                ))}
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

  const votedCount = Object.keys(votes).length;
  const totalSlots = event?.time_slots.length || 0;

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
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Event Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{event?.title}</CardTitle>
            {event?.location && <CardDescription>📍 {event.location}</CardDescription>}
            {hasVoted && (
              <div className="pt-2">
                <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-full">
                  You voted {event?.participants.find(p => p.cookie_id === cookieId)?.last_active ? new Date(event.participants.find(p => p.cookie_id === cookieId)!.last_active).toLocaleTimeString() : ''}
                </span>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Voting Prompt */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">What time can you make it?</h2>
          <p className="text-foreground/60">
            {hasVoted ? 'You can update your votes anytime' : 'Vote on each time slot below'}
          </p>
        </div>

        {/* Time Slots */}
        <div className="space-y-4 mb-6">
          {event?.time_slots.map((slot) => (
            <Card key={slot.timeslot_id} className="p-4">
              <div className="mb-3">
                <div className="font-semibold">{formatDateTime(slot.start_time)}</div>
                {slot.label && <div className="text-sm text-foreground/60">{slot.label}</div>}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleVote(slot.timeslot_id, 'available')}
                  className={`py-3 px-4 rounded-lg border-2 transition-all ${
                    votes[slot.timeslot_id] === 'available'
                      ? 'border-green-600 bg-green-600/10 text-green-600 font-medium'
                      : 'border-foreground/20 hover:border-green-600/50'
                  }`}
                >
                  <div className="text-lg mb-1">✓</div>
                  <div className="text-xs">Can make it</div>
                </button>

                <button
                  onClick={() => handleVote(slot.timeslot_id, 'maybe')}
                  className={`py-3 px-4 rounded-lg border-2 transition-all ${
                    votes[slot.timeslot_id] === 'maybe'
                      ? 'border-yellow-600 bg-yellow-600/10 text-yellow-600 font-medium'
                      : 'border-foreground/20 hover:border-yellow-600/50'
                  }`}
                >
                  <div className="text-lg mb-1">?</div>
                  <div className="text-xs">Maybe</div>
                </button>

                <button
                  onClick={() => handleVote(slot.timeslot_id, 'unavailable')}
                  className={`py-3 px-4 rounded-lg border-2 transition-all ${
                    votes[slot.timeslot_id] === 'unavailable'
                      ? 'border-red-600 bg-red-600/10 text-red-600 font-medium'
                      : 'border-foreground/20 hover:border-red-600/50'
                  }`}
                >
                  <div className="text-lg mb-1">✗</div>
                  <div className="text-xs">Can&apos;t make it</div>
                </button>
              </div>
            </Card>
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

        {/* Submit Button */}
        <Button
          size="lg"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          disabled={votedCount !== totalSlots}
          className="w-full"
        >
          {hasVoted ? 'Update My Votes' : 'Submit My Availability'}
          {votedCount < totalSlots && ` (${votedCount}/${totalSlots} voted)`}
        </Button>
      </div>
    </div>
  );
}

