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
    <div className="min-h-screen flex flex-col pb-24 sm:pb-28 bg-gradient-to-b from-background via-background to-blue-50/30 dark:to-blue-950/10">
      {/* Fun pattern overlay with more personality */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%236366f1' fill-opacity='0.03'%3E%3Ccircle cx='10' cy='10' r='2'/%3E%3Ccircle cx='50' cy='30' r='3'/%3E%3Ccircle cx='90' cy='20' r='2'/%3E%3Ccircle cx='20' cy='70' r='2'/%3E%3Ccircle cx='70' cy='80' r='3'/%3E%3Ccircle cx='30' cy='50' r='2'/%3E%3Ccircle cx='80' cy='60' r='2'/%3E%3Cpath d='M15 15 L20 20 M55 35 L60 40 M75 25 L80 30' stroke='%238b5cf6' stroke-width='1' opacity='0.5'/%3E%3C/g%3E%3C/svg%3E")`,
        opacity: 0.4,
      }} />
      
      {/* Accent dots scattered around */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-20 left-[10%] w-32 h-32 bg-blue-400/10 rounded-full blur-2xl"></div>
        <div className="absolute top-40 right-[15%] w-40 h-40 bg-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 left-[20%] w-36 h-36 bg-pink-400/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-48 right-[25%] w-28 h-28 bg-blue-400/10 rounded-full blur-2xl"></div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative">
        <div className="w-full text-center space-y-6 sm:space-y-8 max-w-4xl mx-auto">
          {/* Tagline */}
          <div className="animate-bounce-in">
            <p className="text-sm sm:text-base font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-6">
              Making Plans: Solved
            </p>
          </div>

          {/* Fun Group of People Icon with bounce animation */}
          <div className="flex justify-center animate-bounce-in">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center shadow-lg relative overflow-hidden">
              {/* Playful sparkle effect */}
              <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              
              {/* Simple, fun people icons */}
              <div className="flex items-end gap-1.5 sm:gap-2">
                {/* Person 1 */}
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-500"></div>
                  <div className="w-7 h-8 sm:w-8 sm:h-10 rounded-t-full bg-blue-500 mt-1"></div>
                </div>
                
                {/* Person 2 - slightly taller */}
                <div className="flex flex-col items-center mb-1">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-purple-500"></div>
                  <div className="w-8 h-10 sm:w-9 sm:h-12 rounded-t-full bg-purple-500 mt-1"></div>
                </div>
                
                {/* Person 3 */}
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-pink-500"></div>
                  <div className="w-7 h-8 sm:w-8 sm:h-10 rounded-t-full bg-pink-500 mt-1"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Headline */}
          <div className="space-y-4 sm:space-y-5">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none">
              IRL &gt; URL
            </h1>
            <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-foreground/90 leading-tight px-4">
              One link. Everyone votes. Plans locked.
            </p>
          </div>

          {/* Supporting Text */}
          <p className="text-base sm:text-lg lg:text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed px-4">
            Stop letting plans fall through while you doomscroll—actually see your friends.
          </p>
        </div>
      </main>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-foreground/10 z-50 shadow-2xl">
        <div className="px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] max-w-2xl mx-auto">
          <Link href="/create">
            <Button size="lg" className="w-full min-h-[56px] text-base sm:text-lg shadow-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white">
              Create an Event
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
