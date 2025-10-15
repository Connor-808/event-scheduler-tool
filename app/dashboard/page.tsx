'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getUserCookieId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Event } from '@/lib/supabase';

type TabType = 'created' | 'invited';

export default function DashboardPage() {
  const [createdEvents, setCreatedEvents] = useState<Event[]>([]);
  const [invitedEvents, setInvitedEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cookieId, setCookieId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('created');

  useEffect(() => {
    const loadMyEvents = async () => {
      const userCookieId = getUserCookieId();
      setCookieId(userCookieId);
      await loadEvents(userCookieId);
    };
    loadMyEvents();
  }, []);

  const loadEvents = async (userCookieId: string) => {
    setIsLoading(true);
    try {
      // Get all events where this cookie exists
      const { data: allUserCookies, error: cookieError } = await supabase
        .from('user_cookies')
        .select('event_id, is_organizer')
        .eq('cookie_id', userCookieId);

      if (cookieError) {
        console.error('Error loading user cookies:', cookieError);
        setIsLoading(false);
        return;
      }

      if (!allUserCookies || allUserCookies.length === 0) {
        setCreatedEvents([]);
        setInvitedEvents([]);
        setIsLoading(false);
        return;
      }

      // Separate organizer events from invited events
      const organizerEventIds = allUserCookies
        .filter(c => c.is_organizer)
        .map(c => c.event_id);
      const invitedEventIds = allUserCookies
        .filter(c => !c.is_organizer)
        .map(c => c.event_id);

      // Fetch events user created (organizer)
      if (organizerEventIds.length > 0) {
        const { data: organizedEvents, error: organizedError } = await supabase
          .from('events')
          .select('*')
          .in('event_id', organizerEventIds)
          .order('created_at', { ascending: false });

        if (organizedError) {
          console.error('Error loading organized events:', organizedError);
        } else {
          setCreatedEvents(organizedEvents || []);
        }
      } else {
        setCreatedEvents([]);
      }

      // Fetch events user was invited to (participant)
      if (invitedEventIds.length > 0) {
        const { data: participantEvents, error: participantError } = await supabase
          .from('events')
          .select('*')
          .in('event_id', invitedEventIds)
          .order('created_at', { ascending: false });

        if (participantError) {
          console.error('Error loading invited events:', participantError);
        } else {
          setInvitedEvents(participantEvents || []);
        }
      } else {
        setInvitedEvents([]);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-blue-600/10 text-blue-600 border-blue-600/30',
      locked: 'bg-green-600/10 text-green-600 border-green-600/30',
      cancelled: 'bg-gray-600/10 text-gray-600 border-gray-600/30',
    };
    return styles[status as keyof typeof styles] || styles.active;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-foreground/10 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">My Events</h1>
              <p className="text-sm text-foreground/60 mt-1">
                {createdEvents.length + invitedEvents.length} {createdEvents.length + invitedEvents.length === 1 ? 'event' : 'events'} total
              </p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <ThemeToggle />
              <Link href="/">
                <Button size="md" variant="secondary">
                  Home
                </Button>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-foreground/10 -mb-[1px]">
            <button
              onClick={() => setActiveTab('created')}
              className={`px-4 py-2.5 font-medium text-sm transition-all relative ${
                activeTab === 'created'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-foreground/60 hover:text-foreground/80'
              }`}
            >
              My Events
              {createdEvents.length > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'created'
                    ? 'bg-blue-600/10 text-blue-600'
                    : 'bg-foreground/10 text-foreground/60'
                }`}>
                  {createdEvents.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('invited')}
              className={`px-4 py-2.5 font-medium text-sm transition-all relative ${
                activeTab === 'invited'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-foreground/60 hover:text-foreground/80'
              }`}
            >
              Invitations
              {invitedEvents.length > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'invited'
                    ? 'bg-green-600/10 text-green-600'
                    : 'bg-foreground/10 text-foreground/60'
                }`}>
                  {invitedEvents.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {createdEvents.length === 0 && invitedEvents.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-6">
              <svg
                className="w-24 h-24 mx-auto text-foreground/20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">No events yet</h2>
            <p className="text-foreground/60 mb-6">
              Create your first event to start scheduling with friends
            </p>
            <Link href="/create">
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg">
                Create Your First Event
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* My Events Tab */}
            {activeTab === 'created' && (
              <>
                {createdEvents.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mb-6">
                      <svg
                        className="w-20 h-20 mx-auto text-foreground/20"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold mb-2">No events created yet</h2>
                    <p className="text-foreground/60 mb-6">
                      Create your first event to start scheduling
                    </p>
                    <Link href="/create">
                      <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg">
                        Create Event
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {createdEvents.map((event) => (
                      <Link key={event.event_id} href={`/event/${event.event_id}/dashboard`}>
                        <Card className="hover:border-blue-600/50 transition-all cursor-pointer h-full">
                          {event.hero_image_url && (
                            <div className="aspect-video w-full overflow-hidden rounded-t-xl">
                              <img
                                src={event.hero_image_url}
                                alt={event.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <h3 className="font-bold text-lg leading-tight flex-1">
                                {event.title}
                              </h3>
                              <span
                                className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusBadge(
                                  event.status
                                )}`}
                              >
                                {event.status}
                              </span>
                            </div>
                            
                            {event.location && (
                              <p className="text-sm text-foreground/70 mb-2 flex items-center gap-1">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                {event.location}
                              </p>
                            )}
                            
                            <p className="text-xs text-foreground/50 mt-3">
                              Created {formatDate(event.created_at)}
                            </p>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Invitations Tab */}
            {activeTab === 'invited' && (
              <>
                {invitedEvents.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mb-6">
                      <svg
                        className="w-20 h-20 mx-auto text-foreground/20"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold mb-2">No invitations yet</h2>
                    <p className="text-foreground/60">
                      You&apos;ll see events here after you vote on them
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {invitedEvents.map((event) => (
                      <Link key={event.event_id} href={`/event/${event.event_id}`}>
                        <Card className="hover:border-green-600/50 transition-all cursor-pointer h-full">
                          {event.hero_image_url && (
                            <div className="aspect-video w-full overflow-hidden rounded-t-xl">
                              <img
                                src={event.hero_image_url}
                                alt={event.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <h3 className="font-bold text-lg leading-tight flex-1">
                                {event.title}
                              </h3>
                              <span
                                className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusBadge(
                                  event.status
                                )}`}
                              >
                                {event.status}
                              </span>
                            </div>
                            
                            {event.location && (
                              <p className="text-sm text-foreground/70 mb-2 flex items-center gap-1">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                {event.location}
                              </p>
                            )}
                            
                            <p className="text-xs text-foreground/50 mt-3">
                              Created {formatDate(event.created_at)}
                            </p>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Floating Action Button - Create Event */}
      <Link href="/create">
        <button
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 group"
          aria-label="Create new event"
        >
          <svg
            className="w-7 h-7 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </Link>
    </div>
  );
}

