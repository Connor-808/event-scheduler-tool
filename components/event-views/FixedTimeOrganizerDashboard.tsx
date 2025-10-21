'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EventWithDetails, TimeSlotWithVotes, supabase, getVoteBreakdown } from '@/lib/supabase';
import { formatDateTime, getRelativeTime } from '@/lib/utils';

interface FixedTimeOrganizerDashboardProps {
  event: EventWithDetails;
  eventId: string;
}

export function FixedTimeOrganizerDashboard({ event, eventId }: FixedTimeOrganizerDashboardProps) {
  const [timeSlot, setTimeSlot] = useState<TimeSlotWithVotes | null>(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/event/${eventId}` 
    : '';

  useEffect(() => {
    async function loadRSVPs() {
      if (event.time_slots[0]) {
        const singleSlot = event.time_slots[0];
        
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
        
        setTimeSlot(fixedTimeSlot);
      }
    }

    loadRSVPs();

    // Set up real-time subscription
    if (event.time_slots[0]) {
      const timeslotId = event.time_slots[0].timeslot_id;
      
      const channel = supabase
        .channel(`dashboard-rsvps-${eventId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'votes',
            filter: `timeslot_id=eq.${timeslotId}`,
          },
          () => {
            loadRSVPs();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
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

          {/* Prominent Time Display */}
          {event?.fixed_datetime && (
            <div className="mb-5 p-5 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-800/95 rounded-xl border-2 border-blue-600/40 dark:border-blue-400/40 shadow-sm">
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

          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleCopyLink} className="min-h-[48px]">
              {copied ? '✓ Copied!' : '📋 Copy Link'}
            </Button>
          </div>
        </div>

        {/* RSVP Summary Card */}
        <Card className="mb-6 sm:mb-8 border-2 border-blue-600/50 dark:border-blue-400/30 bg-blue-600/5 dark:bg-transparent">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1.5 text-sm font-bold bg-blue-600 dark:bg-blue-500 text-white rounded-full shadow-sm">
                📅 Event Time
              </span>
            </div>
            <CardTitle className="text-2xl sm:text-3xl">
              {event?.fixed_datetime ? formatDateTime(event.fixed_datetime) : 'Loading...'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5 sm:space-y-6">
              {/* RSVP Summary */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6 text-center">
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50">
                  <div className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400">
                    {timeSlot?.available_count || 0}
                  </div>
                  <div className="text-sm sm:text-base font-medium text-foreground/70 dark:text-foreground/90 mt-1">I'm In</div>
                </div>
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50">
                  <div className="text-3xl sm:text-4xl font-bold text-red-600 dark:text-red-400">
                    {timeSlot?.unavailable_count || 0}
                  </div>
                  <div className="text-sm sm:text-base font-medium text-foreground/70 dark:text-foreground/90 mt-1">Can't Make It</div>
                </div>
              </div>

              {/* Visual Bar */}
              {timeSlot && timeSlot.votes.length > 0 && (
                <div className="h-4 rounded-full overflow-hidden flex bg-foreground/10">
                  {timeSlot.available_count > 0 && (
                    <div
                      className="bg-green-600 transition-all"
                      style={{
                        width: `${(timeSlot.available_count / timeSlot.votes.length) * 100}%`,
                      }}
                    />
                  )}
                  {timeSlot.unavailable_count > 0 && (
                    <div
                      className="bg-red-600 transition-all"
                      style={{
                        width: `${(timeSlot.unavailable_count / timeSlot.votes.length) * 100}%`,
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

        {/* RSVP Responses */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground/60 uppercase tracking-wider">
              RSVP Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeSlot && timeSlot.votes.length > 0 ? (
                timeSlot.votes.map((vote) => {
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
      </div>
    </div>
  );
}

