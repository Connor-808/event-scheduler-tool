'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getEventWithDetails, EventWithDetails } from '@/lib/supabase';
import { getUserCookieId } from '@/lib/utils';
import { FixedTimeOrganizerDashboard } from '@/components/event-views/FixedTimeOrganizerDashboard';
import { PolledTimeOrganizerDashboard } from '@/components/event-views/PolledTimeOrganizerDashboard';

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const cookieId = getUserCookieId();

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
      setIsLoading(false);
    }

    loadDashboard();
  }, [eventId, router]);

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

  if (!event) {
    return null;
  }

  // Route to the correct dashboard based on event type
  if (event.event_type === 'fixed') {
    return <FixedTimeOrganizerDashboard event={event} eventId={eventId} />;
  } else {
    return <PolledTimeOrganizerDashboard event={event} eventId={eventId} />;
  }
}

