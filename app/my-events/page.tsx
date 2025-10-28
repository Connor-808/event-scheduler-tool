'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { getUserCookieId, formatDateTime, formatDate } from '@/lib/utils';

interface EventSummary {
  event_id: string;
  title: string;
  location: string | null;
  status: 'active' | 'locked' | 'cancelled';
  created_at: string;
  participant_count: number;
  vote_count: number;
  time_slot_count: number;
}

export default function MyHangoutsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMyEvents() {
      const cookieId = getUserCookieId();

      try {
        const response = await fetch(`/api/my-events?cookieId=${cookieId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }

        const data = await response.json();
        setEvents(data.events || []);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadMyEvents();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'locked':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Locked
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Active
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4" />
          <p className="text-base text-foreground/70 font-medium">Loading your events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 sm:mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">My Hangouts</h1>
                <p className="text-base sm:text-lg text-foreground/70">
                  Polls you&apos;ve created and shared
                </p>
              </div>
              <Link href="/">
                <Button variant="secondary" className="hidden sm:flex">
                  ← Home
                </Button>
              </Link>
            </div>

            {/* Mobile back button */}
            <div className="sm:hidden mb-4">
              <Link href="/">
                <Button variant="secondary" size="sm">
                  ← Back
                </Button>
              </Link>
            </div>

            {events.length > 0 && (
              <div className="flex items-center gap-4 text-sm text-foreground/60">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>{events.filter(e => e.status === 'active').length} Active</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>{events.filter(e => e.status === 'locked').length} Locked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span>{events.filter(e => e.status === 'cancelled').length} Cancelled</span>
                </div>
              </div>
            )}
          </div>

          {/* Events List */}
          {events.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-foreground/5 flex items-center justify-center">
                  <svg className="w-10 h-10 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">No hangouts yet</h3>
                <p className="text-foreground/60 mb-6 max-w-sm mx-auto">
                  You haven&apos;t created any polls yet. Start planning your first hangout!
                </p>
                <Link href="/create">
                  <Button size="lg">
                    Create Your First Poll
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <Card
                  key={event.event_id}
                  className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={() => router.push(`/event/${event.event_id}/dashboard`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl truncate">{event.title}</CardTitle>
                          {getStatusBadge(event.status)}
                        </div>
                        {event.location && (
                          <CardDescription className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {event.location}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {/* Stats */}
                      <div className="flex items-center gap-1.5 text-foreground/70">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{event.participant_count} participant{event.participant_count !== 1 ? 's' : ''}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-foreground/70">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <span>{event.vote_count} voted</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-foreground/70">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{event.time_slot_count} time option{event.time_slot_count !== 1 ? 's' : ''}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-foreground/60 ml-auto">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs">
                          Created {formatDate(event.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Action hint */}
                    <div className="mt-4 pt-4 border-t border-foreground/10">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground/60">
                          {event.status === 'active' ? 'View dashboard & manage event' : 'View event details'}
                        </span>
                        <svg className="w-5 h-5 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create New Event Button */}
          {events.length > 0 && (
            <div className="mt-8 text-center">
              <Link href="/create">
                <Button size="lg" className="min-h-[48px]">
                  Create Another Poll
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

