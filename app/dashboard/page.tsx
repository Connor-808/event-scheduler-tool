'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getUserCookieId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Event } from '@/lib/supabase';

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cookieId, setCookieId] = useState<string>('');

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
      // Get all events where this cookie is marked as organizer
      const { data: organizerCookies, error: cookieError } = await supabase
        .from('user_cookies')
        .select('event_id')
        .eq('cookie_id', userCookieId)
        .eq('is_organizer', true);

      if (cookieError) {
        console.error('Error loading organizer cookies:', cookieError);
        setIsLoading(false);
        return;
      }

      if (!organizerCookies || organizerCookies.length === 0) {
        setEvents([]);
        setIsLoading(false);
        return;
      }

      // Get event details for all events where user is organizer
      const eventIds = organizerCookies.map(c => c.event_id);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('event_id', eventIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading events:', error);
      } else {
        setEvents(data || []);
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
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">My Events</h1>
            <p className="text-sm text-foreground/60 mt-1">
              Events you&apos;ve organized
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link href="/">
              <Button size="md" variant="secondary">
                Home
              </Button>
            </Link>
            <Link href="/create">
              <Button size="md">Create Event</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {events.length === 0 ? (
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
              <Button size="lg">Create Your First Event</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
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
      </main>
    </div>
  );
}

