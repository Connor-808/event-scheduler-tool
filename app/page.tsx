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
    <div className="min-h-screen flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full text-center space-y-10 sm:space-y-12 py-8 sm:py-12">
          {/* Hero Section */}
          <div className="space-y-5 sm:space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Schedule plans with friends,{' '}
              <span className="text-foreground/60">effortlessly</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed px-2">
              No accounts, no hassle. Just create a poll, share the link, and find the perfect time
              for everyone.
            </p>
          </div>

          {/* Primary CTA */}
          <div className="pt-2">
            <Link href="/create">
              <Button size="lg" className="text-base sm:text-lg px-10 sm:px-12">
                Create an Event
              </Button>
            </Link>
          </div>

          {/* Feature Highlights */}
          <div className="pt-8 sm:pt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-3xl mx-auto">
            <div className="space-y-3 p-4 rounded-xl hover:bg-foreground/5 transition-colors">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-xl bg-foreground/10 flex items-center justify-center">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="font-bold text-base sm:text-lg">Lightning Fast</h3>
              <p className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                Create an event and share it in under 60 seconds
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-xl hover:bg-foreground/5 transition-colors">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-xl bg-foreground/10 flex items-center justify-center">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="font-bold text-base sm:text-lg">No Login Required</h3>
              <p className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                Anonymous and simple. No accounts or passwords needed
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-xl hover:bg-foreground/5 transition-colors">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-xl bg-foreground/10 flex items-center justify-center">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="font-bold text-base sm:text-lg">Easy Sharing</h3>
              <p className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                Share via text, social media, or any messaging app
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 sm:py-8 px-4 border-t border-foreground/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-xs sm:text-sm text-foreground/60">
          <p>&copy; {new Date().getFullYear()} Event Scheduler. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors touch-manipulation min-h-[44px] flex items-center">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors touch-manipulation min-h-[44px] flex items-center">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
