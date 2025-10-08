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
        console.log('Dashboard access denied:', {
          cookieId,
          eventId,
          participantCount: eventData.participants.length,
          participants: eventData.participants.map(p => ({
            cookie_id: p.cookie_id,
            is_organizer: p.is_organizer,
            matches: p.cookie_id === cookieId
          }))
        });
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4" />
          <p className="text-foreground/60">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const recommendedSlot = timeSlots.length > 0 ? timeSlots[0] : null;
  const participantCount = event?.participants.length || 0;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">{event?.title}</h1>
              {event?.location && (
                <p className="text-foreground/60">📍 {event.location}</p>
              )}
            </div>
            <span className="px-3 py-1 text-sm font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-full">
              Active
            </span>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleCopyLink} className="min-h-[44px]">
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
        </div>

        {/* Response Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Response Overview</CardTitle>
            <CardDescription>
              {participantCount} {participantCount === 1 ? 'person has' : 'people have'} responded
            </CardDescription>
          </CardHeader>
          <CardContent>
            {participantCount > 0 ? (
              <div className="space-y-2">
                {event?.participants.map((participant) => (
                  <div
                    key={participant.cookie_id}
                    className="flex items-center justify-between py-2 border-b border-foreground/10 last:border-0"
                  >
                    <div>
                      <span className="font-medium">
                        {participant.display_name || 'Anonymous'}
                      </span>
                      {participant.is_organizer && (
                        <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 px-2 py-0.5 rounded">
                          Organizer
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-foreground/60">
                      {getRelativeTime(participant.last_active)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-foreground/60">
                <p>No responses yet</p>
                <p className="text-sm mt-2">Share your event link to get responses</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommended Time */}
        {recommendedSlot && (
          <Card className="mb-6 border-2 border-green-600/50 bg-green-600/5">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 text-sm font-medium bg-green-600 text-white rounded-full">
                  Best Option
                </span>
              </div>
              <CardTitle>{formatDateTime(recommendedSlot.start_time)}</CardTitle>
              {recommendedSlot.label && (
                <CardDescription>{recommendedSlot.label}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Vote Breakdown */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {recommendedSlot.available_count}
                    </div>
                    <div className="text-sm text-foreground/60">Can make it</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {recommendedSlot.maybe_count}
                    </div>
                    <div className="text-sm text-foreground/60">Maybe</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {recommendedSlot.unavailable_count}
                    </div>
                    <div className="text-sm text-foreground/60">Can&apos;t make it</div>
                  </div>
                </div>

                {/* Visual Bar */}
                {recommendedSlot.votes.length > 0 && (
                  <div className="h-4 rounded-full overflow-hidden flex">
                    {recommendedSlot.available_count > 0 && (
                      <div
                        className="bg-green-600"
                        style={{
                          width: `${(recommendedSlot.available_count / recommendedSlot.votes.length) * 100}%`,
                        }}
                      />
                    )}
                    {recommendedSlot.maybe_count > 0 && (
                      <div
                        className="bg-yellow-600"
                        style={{
                          width: `${(recommendedSlot.maybe_count / recommendedSlot.votes.length) * 100}%`,
                        }}
                      />
                    )}
                    {recommendedSlot.unavailable_count > 0 && (
                      <div
                        className="bg-red-600"
                        style={{
                          width: `${(recommendedSlot.unavailable_count / recommendedSlot.votes.length) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                )}

                <Button
                  size="lg"
                  onClick={() => handleLockClick(recommendedSlot)}
                  className="w-full min-h-[48px]"
                >
                  Lock In This Time
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
            <div className="space-y-4">
              {timeSlots.map((slot, index) => (
                <div
                  key={slot.timeslot_id}
                  className={`p-4 rounded-lg border ${
                    index === 0 ? 'border-green-600/30 bg-green-600/5' : 'border-foreground/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold">{formatDateTime(slot.start_time)}</div>
                      {slot.label && (
                        <div className="text-sm text-foreground/60">{slot.label}</div>
                      )}
                    </div>
                    {index !== 0 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleLockClick(slot)}
                        className="min-h-[44px]"
                      >
                        Select This Time
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="text-green-600">
                      ✓ {slot.available_count}
                    </div>
                    <div className="text-yellow-600">
                      ? {slot.maybe_count}
                    </div>
                    <div className="text-red-600">
                      ✗ {slot.unavailable_count}
                    </div>
                  </div>

                  {slot.votes.length > 0 && (
                    <div className="mt-2 h-2 rounded-full overflow-hidden flex">
                      {slot.available_count > 0 && (
                        <div
                          className="bg-green-600"
                          style={{
                            width: `${(slot.available_count / slot.votes.length) * 100}%`,
                          }}
                        />
                      )}
                      {slot.maybe_count > 0 && (
                        <div
                          className="bg-yellow-600"
                          style={{
                            width: `${(slot.maybe_count / slot.votes.length) * 100}%`,
                          }}
                        />
                      )}
                      {slot.unavailable_count > 0 && (
                        <div
                          className="bg-red-600"
                          style={{
                            width: `${(slot.unavailable_count / slot.votes.length) * 100}%`,
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
            <div className="space-y-4">
              <div className="p-4 bg-foreground/5 rounded-lg">
                <div className="font-semibold mb-1">
                  {formatDateTime(selectedSlot.start_time)}
                </div>
                {selectedSlot.label && (
                  <div className="text-sm text-foreground/60">{selectedSlot.label}</div>
                )}
                <div className="mt-3 text-sm">
                  <span className="text-green-600 font-medium">
                    {selectedSlot.available_count} can make it
                  </span>
                  {selectedSlot.maybe_count > 0 && (
                    <span className="text-foreground/60">
                      {' '}· {selectedSlot.maybe_count} maybe
                    </span>
                  )}
                  {selectedSlot.unavailable_count > 0 && (
                    <span className="text-foreground/60">
                      {' '}· {selectedSlot.unavailable_count} can&apos;t make it
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-foreground/60">
                Once locked, participants will see the final confirmed time.
              </p>

              <ModalFooter>
                <Button variant="secondary" onClick={() => setLockModalOpen(false)} className="min-h-[44px]">
                  Cancel
                </Button>
                <Button onClick={handleLockConfirm} isLoading={isLocking} className="min-h-[44px]">
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

