'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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

      // Load vote breakdown
      const breakdown = await getVoteBreakdown(eventId);
      setTimeSlots(breakdown);

      setIsLoading(false);

      // Set up real-time subscription for votes
      const timeslotIds = eventData.time_slots.map((ts) => ts.timeslot_id);
      
      const channel = supabase
        .channel('dashboard-votes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'votes',
            filter: `timeslot_id=in.(${timeslotIds.join(',')})`,
          },
          async () => {
            // Reload vote breakdown on any vote change
            const newBreakdown = await getVoteBreakdown(eventId);
            setTimeSlots(newBreakdown);
          }
        )
        .subscribe();

      return () => {
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
    if (!selectedSlot) return;

    setIsLocking(true);

    try {
      const response = await fetch(`/api/events/${eventId}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeslotId: selectedSlot.timeslot_id,
          cookieId: getUserCookieId(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to lock time');
      }

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

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
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
            <Link href={`/event/${eventId}`}>
              <Button variant="secondary" className="min-h-[48px]">
                Vote on Your Poll
              </Button>
            </Link>
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

        {/* Recommended Time */}
        {recommendedSlot && (
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
        )}

        {/* All Time Slots */}
        <Card>
          <CardHeader>
            <CardTitle>All Time Slots</CardTitle>
            <CardDescription>Vote breakdown for each proposed time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 sm:space-y-5">
              {timeSlots.map((slot, index) => (
                <div
                  key={slot.timeslot_id}
                  className={`p-4 sm:p-5 rounded-xl border-2 transition-all ${
                    index === 0 ? 'border-green-600/30 bg-green-600/5' : 'border-foreground/10 hover:border-foreground/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
                    <div className="flex-1">
                      <div className="font-bold text-base sm:text-lg">{formatDateTime(slot.start_time)}</div>
                      {slot.label && (
                        <div className="text-sm sm:text-base text-foreground/70 mt-1">{slot.label}</div>
                      )}
                    </div>
                    {index !== 0 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleLockClick(slot)}
                        className="min-h-[48px] w-full sm:w-auto"
                      >
                        Select This Time
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center text-sm sm:text-base mb-3">
                    <div className="font-semibold text-green-600">
                      ✓ {slot.available_count} available
                    </div>
                    <div className="font-medium text-foreground/70">
                      ✗ {slot.unavailable_count} not available
                    </div>
                  </div>

                  {slot.votes.length > 0 && (
                    <div className="h-3 rounded-full overflow-hidden flex bg-foreground/10">
                      {slot.available_count > 0 && (
                        <div
                          className="bg-green-600 transition-all"
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
          </CardContent>
        </Card>

        {/* Lock Time Confirmation Modal */}
        <Modal
          isOpen={lockModalOpen}
          onClose={() => setLockModalOpen(false)}
          title="Lock in this time?"
          description="This will finalize your event and notify all participants"
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
                Once locked, participants will see the final confirmed time.
              </p>

              <ModalFooter>
                <Button variant="secondary" onClick={() => setLockModalOpen(false)} className="min-h-[52px]">
                  Cancel
                </Button>
                <Button onClick={handleLockConfirm} isLoading={isLocking} className="min-h-[52px]">
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

