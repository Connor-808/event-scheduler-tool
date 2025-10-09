'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getUserCookieId } from '@/lib/utils';

export default function Home() {
  // Initialize cookie on page load
  useEffect(() => {
    getUserCookieId();
  }, []);

  return (
    <div className="min-h-screen flex flex-col pb-24 sm:pb-28">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full text-center space-y-8 sm:space-y-10">
          {/* Calendar Icon */}
          <div className="flex justify-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-foreground/10 flex items-center justify-center shadow-lg">
              <svg
                className="w-12 h-12 sm:w-16 sm:h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                />
              </svg>
            </div>
          </div>

          {/* Header */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight px-4 max-w-4xl mx-auto">
            Schedule plans with friends
          </h1>
        </div>
      </main>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-foreground/10 z-50">
        <div className="px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] max-w-2xl mx-auto">
          <Link href="/create">
            <Button size="lg" className="w-full min-h-[56px] text-base sm:text-lg shadow-lg">
              Create an Event
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
