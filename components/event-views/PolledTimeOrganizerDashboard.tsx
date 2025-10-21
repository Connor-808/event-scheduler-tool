'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Modal, ModalFooter } from '@/components/ui/modal';
import {
  EventWithDetails,
  TimeSlotWithVotes,
  supabase,
  getVoteBreakdown,
} from '@/lib/supabase';
import { getUserCookieId, formatDateTime, getRelativeTime } from '@/lib/utils';

interface PolledTimeOrganizerDashboardProps {
  event: EventWithDetails;
  eventId: string;
}

export function PolledTimeOrganizerDashboard({ event, eventId }: PolledTimeOrganizerDashboardProps) {
  const router = useRouter();
  const [timeSlots, setTimeSlots] = useState<TimeSlotWithVotes[]>([]);
  const [copied, setCopied] = useState(false);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotWithVotes | null>(null);
  const [isLocking, setIsLocking] = useState(false);

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/event/${eventId}` 
    : '';

  useEffect(() => {
    async function loadVotes() {
      const breakdown = await getVoteBreakdown(eventId);
      
      if (breakdown.length === 0 && event.time_slots.length > 0) {
        const emptySlots = event.time_slots.map(slot => ({
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

    loadVotes();

    // Set up real-time subscription
    const timeslotIds = event.time_slots.map((ts) => ts.timeslot_id);
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
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(async () => {
            const newBreakdown = await getVoteBreakdown(eventId);
            setTimeSlots(newBreakdown);
          }, 1000);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [eventId, event.time_slots]);

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
    if (!selectedSlot) return;

    setIsLocking(true);

    try {
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
        console.error('Error sending notifications:', err);
      });

      router.push(`/event/${eventId}`);
    } catch (error) {
      console.error('Error locking time:', error);
      alert('Failed to lock time. Please try again.');
      setIsLocking(false);
    }
  };

  const recommendedSlot = timeSlots.length > 0 ? timeSlots[0] : null;
  const participantCount = event?.participants.length || 0;

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

          {/* Prominent Time Display - Best Option */}
          {recommendedSlot && (
            <div className="mb-5 p-5 sm:p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-slate-800 dark:to-slate-800/95 rounded-xl border-2 border-green-600/40 dark:border-green-400/40 shadow-sm">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-600 dark:bg-green-500 flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-green-900 dark:text-green-400 uppercase tracking-wide mb-1">
                    Best Option · {recommendedSlot.available_count} {recommendedSlot.available_count === 1 ? 'vote' : 'votes'}
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-green-950 dark:text-green-100 leading-tight">
                    {formatDateTime(recommendedSlot.start_time)}
                  </div>
                  {recommendedSlot.label && (
                    <div className="text-sm text-green-800 dark:text-green-300 mt-1">
                      {recommendedSlot.label}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleCopyLink} className="min-h-[48px]">
              {copied ? '✓ Copied!' : '📋 Copy Link'}
            </Button>
          </div>
        </div>

        {/* Vote Summary Card */}
        {recommendedSlot ? (
          <Card className="mb-6 sm:mb-8 border-2 border-green-600/50 dark:border-green-400/30 bg-green-600/5 dark:bg-transparent">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1.5 text-sm font-bold bg-green-600 dark:bg-green-500 text-white rounded-full shadow-sm">
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
                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50">
                    <div className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400">
                      {recommendedSlot.available_count}
                    </div>
                    <div className="text-sm sm:text-base font-medium text-foreground/70 dark:text-foreground/90 mt-1">Available</div>
                  </div>
                  <div className="p-4 rounded-xl bg-foreground/5 dark:bg-slate-700/40 border border-foreground/10 dark:border-slate-600/50">
                    <div className="text-3xl sm:text-4xl font-bold text-foreground/40 dark:text-foreground/60">
                      {recommendedSlot.unavailable_count}
                    </div>
                    <div className="text-sm sm:text-base font-medium text-foreground/70 dark:text-foreground/90 mt-1">Not available</div>
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
          <Card className="mb-6 sm:mb-8 border-2 border-blue-600/50 dark:border-blue-400/30 bg-blue-600/5 dark:bg-transparent">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1.5 text-sm font-bold bg-blue-600 dark:bg-blue-500 text-white rounded-full shadow-sm">
                  📊 Waiting for Votes
                </span>
              </div>
              <CardTitle className="text-2xl sm:text-3xl">No votes yet</CardTitle>
              <CardDescription>Share your event link to start collecting responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-foreground/70 dark:text-foreground/80">
                  Once people start voting, you&apos;ll see the recommended time here with a &quot;Lock In This Time&quot; button.
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
        )}

        {/* All Times */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground/60 uppercase tracking-wider">
              All Times
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeSlots.length === 0 ? (
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

                      {/* Names */}
                      {availableNames && (
                        <p className="text-sm text-foreground/60">
                          {availableNames}
                        </p>
                      )}

                      {/* Label */}
                      {slot.label && (
                        <p className="text-sm text-foreground/50 italic">{slot.label}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Response Overview */}
        <Card>
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

        {/* Lock Confirmation Modal */}
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

