'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getEventWithDetails, EventWithDetails } from '@/lib/supabase';

export default function SharePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/event/${eventId}` 
    : '';

  useEffect(() => {
    async function loadEvent() {
      const eventData = await getEventWithDetails(eventId);
      if (!eventData) {
        router.push('/');
        return;
      }
      setEvent(eventData);
      setIsLoading(false);
    }
    loadEvent();
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title || 'Event',
          text: "Let's figure out when we can meet! Vote on your availability:",
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copy
      handleCopyLink();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4" />
          <p className="text-foreground/60">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Success Animation */}
        <div className="text-center mb-8 animate-in fade-in zoom-in duration-300">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
            <svg
              className="w-10 h-10 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Event Created!</h1>
          <p className="text-lg text-foreground/60">Share this link with your friends</p>
        </div>

        {/* Event Details */}
        <Card className="mb-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold mb-2">{event?.title}</h2>
              {event?.location && (
                <p className="text-foreground/60">📍 {event.location}</p>
              )}
            </div>

            <div className="pt-4 border-t border-foreground/10">
              <p className="text-sm font-medium text-foreground/60 mb-2">
                Proposed Times ({event?.time_slots.length})
              </p>
              <div className="space-y-1 text-sm">
                {event?.time_slots.slice(0, 3).map((slot) => (
                  <div key={slot.timeslot_id} className="text-foreground/80">
                    {new Date(slot.start_time).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                    {slot.label && ` - ${slot.label}`}
                  </div>
                ))}
                {event && event.time_slots.length > 3 && (
                  <div className="text-foreground/60">
                    +{event.time_slots.length - 3} more
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Shareable Link */}
        <Card className="mb-6">
          <div className="space-y-4">
            <label className="block text-sm font-medium">
              Shareable Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-4 py-2 text-sm border border-foreground/20 rounded-lg bg-foreground/5 focus:outline-none select-all"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button onClick={handleCopyLink} variant="secondary">
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button onClick={handleShare} size="lg" className="w-full">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            Share with Friends
          </Button>

          <Link href={`/event/${eventId}/dashboard`} className="block">
            <Button variant="secondary" size="lg" className="w-full">
              View Organizer Dashboard
            </Button>
          </Link>
        </div>

        {/* Helper Text */}
        <div className="mt-8 text-center text-sm text-foreground/60">
          <p>Bookmark this page to return to your organizer dashboard later.</p>
        </div>
      </div>
    </div>
  );
}


