'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getEventWithDetails, EventWithDetails } from '@/lib/supabase';
import { getUserCookieId } from '@/lib/utils';
import { FixedTimeRecipientView } from '@/components/event-views/FixedTimeRecipientView';
import { PolledTimeRecipientView } from '@/components/event-views/PolledTimeRecipientView';

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrganizer, setIsOrganizer] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      const userCookieId = getUserCookieId();

      const eventData = await getEventWithDetails(eventId);
      if (!eventData) {
        router.push('/');
        return;
      }

      setEvent(eventData);

      // Check if user is organizer
      const organizer = eventData.participants.find(
        (p) => p.cookie_id === userCookieId && p.is_organizer
      );
      setIsOrganizer(!!organizer);

      setIsLoading(false);
    }

    loadEvent();
  }, [eventId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4" />
          <p className="text-base text-foreground/70 font-medium">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Event not found</h1>
          <p className="text-foreground/70 mb-4">This event doesn&apos;t exist or has been deleted.</p>
        </div>
      </div>
    );
  }

  // Route to the correct view based on event type
  if (event.event_type === 'fixed') {
    return <FixedTimeRecipientView event={event} eventId={eventId} isOrganizer={isOrganizer} />;
  } else {
    return <PolledTimeRecipientView event={event} eventId={eventId} isOrganizer={isOrganizer} />;
  }
}

