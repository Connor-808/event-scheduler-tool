'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PhoneVerification } from '@/components/PhoneVerification';
import { getEventWithDetails, EventWithDetails, Vote, supabase, TimeSlotWithVotes } from '@/lib/supabase';
import { getUserCookieId, formatDateTime } from '@/lib/utils';

interface VoteState {
  [timeslotId: string]: boolean;
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
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [timeSlotsWithVotes, setTimeSlotsWithVotes] = useState<TimeSlotWithVotes[]>([]);

  useEffect(() => {
    async function loadEventAndVotes() {
      const userCookieId = getUserCookieId();
      setCookieId(userCookieId);

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

      // Create user_cookies record if needed and check if organizer
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
        setIsOrganizer(false);
      } else {
        setIsOrganizer(existingCookie.is_organizer);
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
          voteState[vote.timeslot_id] = vote.availability === 'available';
        });
        setVotes(voteState);
        setHasVoted(true);
      }

      // Load vote breakdown for displaying who voted
      if (eventData.time_slots.length > 1) {
        const slotsWithVotes = await Promise.all(
          eventData.time_slots.map(async (slot) => {
            const { data: slotVotes } = await supabase
              .from('votes')
              .select(`
                *,
                user_cookies!inner (
                  display_name,
                  is_organizer
                )
              `)
              .eq('timeslot_id', slot.timeslot_id);

            const available_count = slotVotes?.filter(v => v.availability === 'available').length || 0;
            const maybe_count = slotVotes?.filter(v => v.availability === 'maybe').length || 0;
            const unavailable_count = slotVotes?.filter(v => v.availability === 'unavailable').length || 0;

            return {
              ...slot,
              votes: slotVotes || [],
              available_count,
              maybe_count,
              unavailable_count,
            };
          })
        );
        setTimeSlotsWithVotes(slotsWithVotes as TimeSlotWithVotes[]);
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

  const handleRSVP = async (attending: boolean) => {
    if (!event || event.time_slots.length !== 1) return;

    const singleSlot = event.time_slots[0];
    setVotes({ [singleSlot.timeslot_id]: attending });
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/events/${eventId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cookieId,
          displayName: displayName || null,
          votes: [{
            timeslotId: singleSlot.timeslot_id,
            availability: attending ? 'available' : 'unavailable',
          }],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit RSVP');
      }

      setHasVoted(true);
      setShowConfirmation(true);
    } catch (error) {
      console.error('Error submitting RSVP:', error);
      alert('Failed to submit RSVP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEvent = async () => {
    if (!confirm('Are you sure you want to cancel this event? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookieId }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel event');
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error cancelling event:', error);
      alert('Failed to cancel event. Please try again.');
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
          {event?.hero_image_url ? (
            <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
              <img 
                src={event.hero_image_url} 
                alt={event.title} 
                className="w-full h-48 sm:h-64 object-cover"
              />
            </div>
          ) : (
            <div className="mb-8 rounded-xl overflow-hidden shadow-lg h-48 sm:h-64 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-60" />
          )}

          <div className="text-center mb-8 sm:mb-10 animate-in fade-in zoom-in duration-300">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-4 shadow-lg">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">
              {event && event.time_slots.length === 1 ? 'Thanks for responding!' : 'Thanks for voting!'}
            </h1>
            <p className="text-base sm:text-lg text-foreground/70">
              {event && event.time_slots.length === 1 
                ? 'Your RSVP has been recorded' 
                : 'Your availability has been recorded'}
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{event?.title}</CardTitle>
              {event?.location && <CardDescription>📍 {event.location}</CardDescription>}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {event && event.time_slots.length === 1 ? (
                  <div className="text-center py-4">
                    <p className="text-sm font-medium text-foreground/60 mb-3">Your response:</p>
                    {votes[event.time_slots[0].timeslot_id] ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-bold text-lg">I&apos;m in - I can attend</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-red-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="font-bold text-lg">Can&apos;t make it</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button variant="secondary" onClick={() => setShowConfirmation(false)} className="w-full">
              {event && event.time_slots.length === 1 ? 'Change My Response' : 'Change My Votes'}
            </Button>
            <p className="text-center text-sm text-foreground/60">
              The organizer will pick a time soon. Bookmark this page to check back later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show locked state
  if (event?.status === 'locked' && event.locked_time) {
    const shareUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/event/${eventId}` 
      : '';

    const handleShare = async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: event?.title || 'Event',
            text: `The time has been set! ${formatDateTime(event.locked_time!.start_time)}`,
            url: shareUrl,
          });
        } catch (error) {
          console.error('Error sharing:', error);
        }
      } else {
        try {
          await navigator.clipboard.writeText(shareUrl);
          alert('Link copied to clipboard!');
        } catch (error) {
          console.error('Failed to copy:', error);
        }
      }
    };

    return (
      <div className="min-h-screen pb-40 sm:pb-12">
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            {event.hero_image_url ? (
              <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
                <img 
                  src={event.hero_image_url} 
                  alt={event.title} 
                  className="w-full h-64 sm:h-80 object-cover"
                />
              </div>
            ) : (
              <div className="mb-8 rounded-xl overflow-hidden shadow-lg h-64 sm:h-80 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-60" />
            )}

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

            {/* Desktop Action Buttons */}
            <div className="hidden sm:block space-y-3">
              <Button onClick={handleShare} size="lg" className="w-full">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share with Friends
              </Button>

              <Button variant="secondary" size="lg" onClick={() => router.push('/create')} className="w-full">
                Create New Event
              </Button>
            </div>
          </div>
        </div>

        {/* Fixed Bottom CTA - Mobile Only */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-foreground/10 sm:hidden z-50">
          <div className="px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-3">
            <Button onClick={handleShare} size="lg" className="w-full min-h-[52px] shadow-lg">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share with Friends
            </Button>

            <Button variant="secondary" size="lg" onClick={() => router.push('/create')} className="w-full min-h-[52px]">
              Create New Event
            </Button>
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

  const selectedCount = Object.values(votes).filter(Boolean).length;
  const isPollingEvent = event && event.time_slots.length > 1;
  const isFixedTimeEvent = event && event.time_slots.length === 1;

  return (
    <div className={`min-h-screen ${isFixedTimeEvent ? 'pb-40' : 'pb-32'} sm:pb-12 py-8 sm:py-12`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          
          {/* ========== SECTION 1: EVENT HEADER ========== */}
          {event?.hero_image_url ? (
            <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
              <img 
                src={event.hero_image_url} 
                alt={event.title} 
                className="w-full h-48 sm:h-64 object-cover"
              />
            </div>
          ) : (
            <div className="mb-8 rounded-xl overflow-hidden shadow-lg h-48 sm:h-64 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-60" />
          )}

          <div className="mb-8 sm:mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 leading-tight">{event?.title}</h1>
            {event?.location && (
              <p className="text-base text-foreground/70 mb-3">📍 {event.location}</p>
            )}
            {hasVoted && (
              <span className="inline-block px-3 py-1.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-full">
                ✓ You responded
              </span>
            )}
          </div>

          {/* ========== SECTION 2: TIME SECTION ========== */}
          <div className="mb-8 sm:mb-10">
            {isFixedTimeEvent ? (
              /* FIXED TIME EVENT - RSVP */
              <>
                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">Can you make it?</h2>
                  <div className="text-lg sm:text-xl text-foreground/90 font-semibold mb-2">
                    {formatDateTime(event.time_slots[0].start_time)}
                  </div>
                  {event.time_slots[0].label && (
                    <div className="text-base text-foreground/70 mb-3">{event.time_slots[0].label}</div>
                  )}
                  <p className="text-base sm:text-lg text-foreground/70">
                    {hasVoted ? 'You can change your response anytime' : 'Let us know if you can attend'}
                  </p>
                </div>
              </>
            ) : (
              /* POLLING EVENT - VOTE ON MULTIPLE TIMES */
              <>
                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2 leading-tight">What times work for you?</h2>
                  <p className="text-base sm:text-lg text-foreground/70">
                    {hasVoted ? 'You can update your availability anytime' : 'Select all times that work for you'}
                  </p>
                </div>

                {/* Quick Actions */}
                {event && event.time_slots.length > 2 && (
                  <div className="flex gap-3 mb-4">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const allAvailable: VoteState = {};
                        event.time_slots.forEach(slot => {
                          allAvailable[slot.timeslot_id] = true;
                        });
                        setVotes(allAvailable);
                      }}
                      disabled={Object.values(votes).filter(Boolean).length === event.time_slots.length}
                      className="flex-1"
                    >
                      ✓ Select All
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setVotes({})}
                      disabled={Object.values(votes).filter(Boolean).length === 0}
                      className="flex-1"
                    >
                      Clear All
                    </Button>
                  </div>
                )}

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
                      <div className={`flex-shrink-0 w-8 h-8 sm:w-6 sm:h-6 rounded border-2 flex items-center justify-center transition-all ${
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

                      <div className="flex-1">
                        <div className="font-bold text-base sm:text-lg">{formatDateTime(slot.start_time)}</div>
                        {slot.label && <div className="text-sm sm:text-base text-foreground/70 mt-0.5">{slot.label}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ========== SECTION 3: WHO'S RESPONDED ========== */}
          {event && (
            <Card className="mb-8 sm:mb-10">
              <CardHeader>
                <CardTitle>
                  {isPollingEvent ? 'Who Has Voted' : 'Responses'}
                </CardTitle>
                <CardDescription>
                  {event.participants.length} {event.participants.length === 1 ? 'person has' : 'people have'} responded
                </CardDescription>
              </CardHeader>
              <CardContent>
                {event.participants.length > 0 ? (
                  <div className="space-y-3">
                    {event.participants
                      .filter(p => p.last_active) // Only show people who have actually voted
                      .map((participant) => (
                        <div
                          key={participant.cookie_id}
                          className="flex items-center justify-between py-2 border-b border-foreground/10 last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {participant.display_name || 'Anonymous'}
                            </span>
                            {participant.is_organizer && (
                              <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 px-2 py-1 rounded-md">
                                Host
                              </span>
                            )}
                          </div>
                          {participant.last_active && (
                            <span className="text-sm text-foreground/60">
                              {new Date(participant.last_active).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-foreground/60">
                    <p className="text-sm">No responses yet</p>
                  </div>
                )}

                {/* Show vote breakdown for polling events */}
                {isPollingEvent && timeSlotsWithVotes.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-foreground/10">
                    <h4 className="font-semibold mb-4">Vote Summary</h4>
                    <div className="space-y-3">
                      {timeSlotsWithVotes
                        .sort((a, b) => b.available_count - a.available_count)
                        .map((slot) => (
                          <div key={slot.timeslot_id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="text-sm">
                                <div className="font-medium">{formatDateTime(slot.start_time)}</div>
                                {slot.label && <div className="text-foreground/60 text-xs">{slot.label}</div>}
                              </div>
                              <div className="text-sm font-semibold text-green-600">
                                {slot.available_count} available
                              </div>
                            </div>
                            {slot.votes.length > 0 && (
                              <div className="h-2 rounded-full overflow-hidden flex bg-foreground/10">
                                {slot.available_count > 0 && (
                                  <div
                                    className="bg-green-600"
                                    style={{
                                      width: `${(slot.available_count / slot.votes.length) * 100}%`,
                                    }}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ========== SECTION 4: NOTES/DETAILS ========== */}
          {event?.notes && (
            <Card className="mb-8 sm:mb-10">
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/80 whitespace-pre-wrap">{event.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* User Info Section */}
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

          <div className="mb-6">
            <PhoneVerification 
              eventId={eventId} 
              cookieId={cookieId}
              comingSoon={false}
            />
          </div>

          {/* Desktop Submit Button - Only for polling events */}
          {isPollingEvent && (
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
          )}

          {/* ========== SECTION 5: HOST MANAGEMENT ACTIONS ========== */}
          {isOrganizer && (
            <Card className="mt-8 sm:mt-10 border-2 border-purple-500/30 bg-purple-500/5">
              <CardHeader>
                <CardTitle>Host Actions</CardTitle>
                <CardDescription>You are the organizer of this event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/event/${eventId}/dashboard`)}
                  className="w-full"
                >
                  View Organizer Dashboard
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleCancelEvent}
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Cancel Event
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Fixed Bottom CTA - Multi Time Slot Voting */}
      {isPollingEvent && (
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
      )}

      {/* Fixed Bottom RSVP Buttons - Single Time Slot */}
      {isFixedTimeEvent && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-foreground/10 z-50">
          <div className="px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
              <button
                onClick={() => handleRSVP(true)}
                disabled={isSubmitting}
                className={`min-h-[52px] rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 font-semibold ${
                  hasVoted && votes[event.time_slots[0].timeslot_id]
                    ? 'border-green-600 bg-green-600 text-white shadow-lg'
                    : 'border-green-600/50 bg-green-600/10 text-green-600 hover:bg-green-600/20 active:bg-green-600/30'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>I&apos;m in</span>
              </button>

              <button
                onClick={() => handleRSVP(false)}
                disabled={isSubmitting}
                className={`min-h-[52px] rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 font-semibold ${
                  hasVoted && !votes[event.time_slots[0].timeslot_id]
                    ? 'border-red-600 bg-red-600 text-white shadow-lg'
                    : 'border-red-600/50 bg-red-600/10 text-red-600 hover:bg-red-600/20 active:bg-red-600/30'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Can&apos;t make it</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

