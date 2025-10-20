'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Modal, ModalFooter } from '@/components/ui/modal';
import {
  getEventWithDetails,
  getVoteBreakdown,
  EventWithDetails,
  TimeSlotWithVotes,
  supabase,
} from '@/lib/supabase';
import { getUserCookieId, formatDateTime, getRelativeTime } from '@/lib/utils';

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlotWithVotes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotWithVotes | null>(null);
  const [isLocking, setIsLocking] = useState(false);

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/event/${eventId}` 
    : '';

  useEffect(() => {
    async function loadDashboard() {
      const cookieId = getUserCookieId();

      // Load event
      const eventData = await getEventWithDetails(eventId);
      if (!eventData) {
        router.push('/');
        return;
      }

      // Check if user is organizer
      const organizer = eventData.participants.find(
        (p) => p.cookie_id === cookieId && p.is_organizer
      );

      if (!organizer) {
        // Not organizer, redirect to voting page
        router.push(`/event/${eventId}`);
        return;
      }

      setEvent(eventData);

      // Load vote breakdown - handle fixed time events differently
      if (eventData.time_slots.length === 1) {
        // Fixed time event - directly fetch votes for the single timeslot
        const singleSlot = eventData.time_slots[0];
        
        const { data: votes } = await supabase
          .from('votes')
          .select('*')
          .eq('timeslot_id', singleSlot.timeslot_id);
        
        const availableCount = votes?.filter(v => v.availability === 'available').length || 0;
        const unavailableCount = votes?.filter(v => v.availability === 'unavailable').length || 0;
        const maybeCount = votes?.filter(v => v.availability === 'maybe').length || 0;
        
        const fixedTimeSlot: TimeSlotWithVotes = {
          ...singleSlot,
          votes: votes || [],
          available_count: availableCount,
          maybe_count: maybeCount,
          unavailable_count: unavailableCount,
        };
        
        setTimeSlots([fixedTimeSlot]);
      } else {
        // Multi-time event - use the existing breakdown function
        const breakdown = await getVoteBreakdown(eventId);
        
        // If no votes yet, show all timeslots with zero counts
        if (breakdown.length === 0 && eventData.time_slots.length > 0) {
          const emptySlots = eventData.time_slots.map(slot => ({
            ...slot,
            votes: [],
            available_count: 0,
            maybe_count: 0,
            unavailable_count: 0,
          }));
          setTimeSlots(emptySlots);
        } else {
          setTimeSlots(breakdown);
        }
      }

      setIsLoading(false);

      // Set up real-time subscription for votes with debouncing
      const timeslotIds = eventData.time_slots.map((ts) => ts.timeslot_id);

      // Debounce timer for vote updates (prevent UI thrashing)
      let debounceTimer: NodeJS.Timeout;

      const channel = supabase
        .channel(`dashboard-votes-${eventId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'votes',
            filter: `timeslot_id=in.(${timeslotIds.join(',')})`,
          },
          () => {
            // Debounce rapid vote changes (1 second delay)
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
              if (eventData.time_slots.length === 1) {
                // Fixed time event - refresh votes directly
                const singleSlot = eventData.time_slots[0];
                const { data: votes } = await supabase
                  .from('votes')
                  .select('*')
                  .eq('timeslot_id', singleSlot.timeslot_id);
                
                const availableCount = votes?.filter(v => v.availability === 'available').length || 0;
                const unavailableCount = votes?.filter(v => v.availability === 'unavailable').length || 0;
                const maybeCount = votes?.filter(v => v.availability === 'maybe').length || 0;
                
                const fixedTimeSlot: TimeSlotWithVotes = {
                  ...singleSlot,
                  votes: votes || [],
                  available_count: availableCount,
                  maybe_count: maybeCount,
                  unavailable_count: unavailableCount,
                };
                
                setTimeSlots([fixedTimeSlot]);
              } else {
                // Multi-time event - use breakdown function
                const newBreakdown = await getVoteBreakdown(eventId);
                setTimeSlots(newBreakdown);
              }
            }, 1000);
          }
        )
        .subscribe();

      return () => {
        clearTimeout(debounceTimer);
        supabase.removeChannel(channel);
      };
    }

    loadDashboard();
  }, [eventId, router]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleLockClick = (slot: TimeSlotWithVotes) => {
    setSelectedSlot(slot);
    setLockModalOpen(true);
  };

  const handleLockConfirm = async () => {
    if (!selectedSlot || !event) return;

    setIsLocking(true);

    try {
      // First, lock the time in the database
      const lockResponse = await fetch(`/api/events/${eventId}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeslotId: selectedSlot.timeslot_id,
          cookieId: getUserCookieId(),
        }),
      });

      if (!lockResponse.ok) {
        throw new Error('Failed to lock time');
      }

      // Send SMS notifications to verified participants
      const finalOption = event.title;
      const finalTime = formatDateTime(selectedSlot.start_time);

      await fetch(`/api/events/${eventId}/lock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finalOption,
          finalTime,
        }),
      }).catch(err => {
        // Log error but don't fail the lock-in
        console.error('Error sending notifications:', err);
      });

      // Redirect to event page (now shows locked state)
      router.push(`/event/${eventId}`);
    } catch (error) {
      console.error('Error locking time:', error);
      alert('Failed to lock time. Please try again.');
      setIsLocking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4" />
          <p className="text-base text-foreground/70 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const recommendedSlot = timeSlots.length > 0 ? timeSlots[0] : null;
  const participantCount = event?.participants.length || 0;
  const isFixedTimeEvent = event?.time_slots.length === 1;

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Hero Image */}
        {event?.hero_image_url && (
          <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
            <img 
              src={event.hero_image_url} 
              alt={event.title} 
              className="w-full h-48 sm:h-64 object-cover"
            />
          </div>
        )}

        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-5">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 leading-tight">{event?.title}</h1>
              {event?.location && (
                <p className="text-base text-foreground/70">📍 {event.location}</p>
              )}
            </div>
            <span className="px-4 py-2 text-sm font-bold bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-full shadow-sm">
              ● Active
            </span>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleCopyLink} className="min-h-[48px]">
              {copied ? '✓ Copied!' : '📋 Copy Link'}
            </Button>
          </div>
        </div>

        {/* Response Overview */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle>Response Overview</CardTitle>
            <CardDescription>
              {participantCount} {participantCount === 1 ? 'person has' : 'people have'} responded
            </CardDescription>
          </CardHeader>
          <CardContent>
            {participantCount > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {event?.participants.map((participant) => (
                  <div
                    key={participant.cookie_id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 sm:py-2 border-b border-foreground/10 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base">
                        {participant.display_name || 'Anonymous'}
                      </span>
                      {participant.is_organizer && (
                        <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 px-2 py-1 rounded-md">
                          Organizer
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-foreground/70">
                      {getRelativeTime(participant.last_active)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 sm:py-12 text-foreground/70">
                <p className="text-base font-medium">No responses yet</p>
                <p className="text-sm mt-2">Share your event link to get responses</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Type Specific Display */}
        {isFixedTimeEvent ? (
          /* Fixed Time Event - RSVP Responses */
          <Card className="mb-6 sm:mb-8 border-2 border-blue-600/50 bg-blue-600/5">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1.5 text-sm font-bold bg-blue-600 text-white rounded-full shadow-sm">
                  📅 Event Time
                </span>
              </div>
              <CardTitle className="text-2xl sm:text-3xl">
                {event?.time_slots[0] ? formatDateTime(event.time_slots[0].start_time) : 'Loading...'}
              </CardTitle>
              {event?.time_slots[0]?.label && (
                <CardDescription>{event.time_slots[0].label}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-5 sm:space-y-6">
                {/* RSVP Summary */}
                <div className="grid grid-cols-2 gap-4 sm:gap-6 text-center">
                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/10">
                    <div className="text-3xl sm:text-4xl font-bold text-green-600">
                      {recommendedSlot?.available_count || 0}
                    </div>
                    <div className="text-sm sm:text-base font-medium text-foreground/70 mt-1">I'm In</div>
                  </div>
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10">
                    <div className="text-3xl sm:text-4xl font-bold text-red-600">
                      {recommendedSlot?.unavailable_count || 0}
                    </div>
                    <div className="text-sm sm:text-base font-medium text-foreground/70 mt-1">Can't Make It</div>
                  </div>
                </div>

                {/* Visual Bar */}
                {recommendedSlot && recommendedSlot.votes.length > 0 && (
                  <div className="h-4 rounded-full overflow-hidden flex bg-foreground/10">
                    {recommendedSlot.available_count > 0 && (
                      <div
                        className="bg-green-600 transition-all"
                        style={{
                          width: `${(recommendedSlot.available_count / recommendedSlot.votes.length) * 100}%`,
                        }}
                      />
                    )}
                    {recommendedSlot.unavailable_count > 0 && (
                      <div
                        className="bg-red-600 transition-all"
                        style={{
                          width: `${(recommendedSlot.unavailable_count / recommendedSlot.votes.length) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                )}

                <Button
                  variant="secondary"
                  onClick={handleCopyLink}
                  className="w-full min-h-[52px]"
                >
                  📋 Copy Event Link
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Multi-Time Event - Voting Results */
          recommendedSlot ? (
            <Card className="mb-6 sm:mb-8 border-2 border-green-600/50 bg-green-600/5">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1.5 text-sm font-bold bg-green-600 text-white rounded-full shadow-sm">
                    ⭐ Best Option
                  </span>
                </div>
                <CardTitle className="text-2xl sm:text-3xl">{formatDateTime(recommendedSlot.start_time)}</CardTitle>
                {recommendedSlot.label && (
                  <CardDescription>{recommendedSlot.label}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-5 sm:space-y-6">
                  {/* Vote Breakdown */}
                  <div className="grid grid-cols-2 gap-4 sm:gap-6 text-center">
                    <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/10">
                      <div className="text-3xl sm:text-4xl font-bold text-green-600">
                        {recommendedSlot.available_count}
                      </div>
                      <div className="text-sm sm:text-base font-medium text-foreground/70 mt-1">Available</div>
                    </div>
                    <div className="p-4 rounded-xl bg-foreground/5">
                      <div className="text-3xl sm:text-4xl font-bold text-foreground/40">
                        {recommendedSlot.unavailable_count}
                      </div>
                      <div className="text-sm sm:text-base font-medium text-foreground/70 mt-1">Not available</div>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  {recommendedSlot.votes.length > 0 && (
                    <div className="h-4 rounded-full overflow-hidden flex bg-foreground/10">
                      {recommendedSlot.available_count > 0 && (
                        <div
                          className="bg-green-600 transition-all"
                          style={{
                            width: `${(recommendedSlot.available_count / recommendedSlot.votes.length) * 100}%`,
                          }}
                        />
                      )}
                    </div>
                  )}

                  <Button
                    size="lg"
                    onClick={() => handleLockClick(recommendedSlot)}
                    className="w-full min-h-[52px]"
                  >
                    🔒 Lock In This Time
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6 sm:mb-8 border-2 border-blue-600/50 bg-blue-600/5">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1.5 text-sm font-bold bg-blue-600 text-white rounded-full shadow-sm">
                    📊 Waiting for Votes
                  </span>
                </div>
                <CardTitle className="text-2xl sm:text-3xl">No votes yet</CardTitle>
                <CardDescription>Share your event link to start collecting responses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-foreground/70">
                    Once people start voting, you'll see the recommended time here with a "Lock In This Time" button.
                  </p>
                  <Button
                    variant="secondary"
                    onClick={handleCopyLink}
                    className="w-full min-h-[52px]"
                  >
                    📋 Copy Event Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        )}

        {/* Event Details Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground/60 uppercase tracking-wider">
              {isFixedTimeEvent ? 'RSVP Responses' : 'All Times'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isFixedTimeEvent ? (
              /* Fixed Time Event - Show Individual RSVP Responses */
              <div className="space-y-4">
                {recommendedSlot && recommendedSlot.votes.length > 0 ? (
                  recommendedSlot.votes.map((vote) => {
                    const participant = event?.participants.find(p => p.cookie_id === vote.cookie_id);
                    const isAttending = vote.availability === 'available';
                    
                    return (
                      <div key={vote.vote_id} className="flex items-center justify-between p-4 rounded-lg border border-foreground/10">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${isAttending ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div>
                            <div className="font-semibold text-base">
                              {participant?.display_name || 'Anonymous'}
                            </div>
                            <div className="text-sm text-foreground/60">
                              {isAttending ? 'I\'m in' : 'Can\'t make it'}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-foreground/50">
                          {new Date(vote.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-foreground/60">
                    <p className="text-base font-medium">No responses yet</p>
                    <p className="text-sm mt-2">Share your event link to start collecting RSVPs</p>
                  </div>
                )}
              </div>
            ) : (
              /* Multi-Time Event - Show All Time Slots */
              timeSlots.length === 0 ? (
                <div className="text-center py-8 text-foreground/60">
                  <p className="text-base font-medium">No time slots found</p>
                  <p className="text-sm mt-2">This event may not have any time slots configured</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {timeSlots.map((slot, index) => {
                  const availableVotes = slot.votes.filter(v => v.availability === 'available');
                  const availableNames = availableVotes
                    .map(v => {
                      const participant = event?.participants.find(p => p.cookie_id === v.cookie_id);
                      return participant?.display_name || 'Anonymous';
                    })
                    .join(', ');

                  return (
                    <div key={slot.timeslot_id} className="space-y-3">
                      {/* Time and Count */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-3">
                          <h3 className="text-2xl sm:text-3xl font-bold">
                            {new Date(slot.start_time).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </h3>
                          {index === 0 && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleLockClick(slot)}
                              className="text-xs"
                            >
                              Lock In
                            </Button>
                          )}
                        </div>
                        <span className="text-xl sm:text-2xl text-foreground/40 font-medium">
                          {slot.available_count}/{slot.votes.length}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      {slot.votes.length > 0 && (
                        <div className="h-2 rounded-full overflow-hidden bg-foreground/10">
                          {slot.available_count > 0 && (
                            <div
                              className="h-full bg-foreground rounded-full transition-all"
                              style={{
                                width: `${(slot.available_count / slot.votes.length) * 100}%`,
                              }}
                            />
                          )}
                        </div>
                      )}

                      {/* Names of people who voted available */}
                      {availableNames && (
                        <p className="text-sm text-foreground/60">
                          {availableNames}
                        </p>
                      )}

                      {/* Show label if exists */}
                      {slot.label && (
                        <p className="text-sm text-foreground/50 italic">{slot.label}</p>
                      )}
                    </div>
                  );
                })}
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* Lock Time Confirmation Modal */}
        <Modal
          isOpen={lockModalOpen}
          onClose={() => setLockModalOpen(false)}
          title="Lock in this time?"
          description="This will finalize your event and send text notifications to verified participants"
        >
          {selectedSlot && (
            <div className="space-y-5">
              <div className="p-4 sm:p-5 bg-foreground/5 rounded-xl">
                <div className="font-bold text-base sm:text-lg mb-2">
                  {formatDateTime(selectedSlot.start_time)}
                </div>
                {selectedSlot.label && (
                  <div className="text-sm sm:text-base text-foreground/70 mb-3">{selectedSlot.label}</div>
                )}
                <div className="mt-3 text-sm sm:text-base">
                  <span className="text-green-600 font-bold">
                    ✓ {selectedSlot.available_count} available
                  </span>
                  {selectedSlot.unavailable_count > 0 && (
                    <span className="text-foreground/70 font-medium">
                      {' '}· {selectedSlot.unavailable_count} not available
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                Once locked, participants will see the final confirmed time and those who verified their phone will receive a text notification.
              </p>

              <ModalFooter>
                <Button variant="secondary" onClick={() => setLockModalOpen(false)} className="min-h-[52px] w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleLockConfirm} isLoading={isLocking} className="min-h-[52px] w-full sm:w-auto">
                  Yes, Lock It In
                </Button>
              </ModalFooter>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}

