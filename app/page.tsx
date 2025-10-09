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
    <div className="min-h-screen flex flex-col pb-24 sm:pb-28 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/40 dark:from-gray-950 dark:via-blue-950/20 dark:to-purple-950/20">
      {/* Strong halftone dot pattern for depth */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(99, 102, 241, 0.4) 1px, transparent 1px),
            radial-gradient(circle, rgba(139, 92, 246, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px, 30px 30px',
          backgroundPosition: '0 0, 15px 15px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 60% 40%, black 0%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 60% 40%, black 0%, transparent 100%)',
        }}
      />
      
      {/* Gradient halftone effect for depth */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-70 dark:opacity-50"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, transparent 0%, rgba(0,0,0,0.03) 50%),
            radial-gradient(1.5px 1.5px at 10% 20%, rgba(99, 102, 241, 0.15), transparent),
            radial-gradient(2px 2px at 40% 50%, rgba(139, 92, 246, 0.12), transparent),
            radial-gradient(1px 1px at 60% 30%, rgba(99, 102, 241, 0.1), transparent),
            radial-gradient(2.5px 2.5px at 80% 60%, rgba(236, 72, 153, 0.1), transparent),
            radial-gradient(1.5px 1.5px at 30% 70%, rgba(139, 92, 246, 0.12), transparent)
          `,
          backgroundSize: '100% 100%, 50px 50px, 80px 80px, 40px 40px, 70px 70px, 60px 60px',
          backgroundPosition: '0 0, 0 0, 40px 60px, 130px 270px, 70px 100px, 150px 220px',
        }}
      />
      
      {/* Soft gradient orbs for atmosphere */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-10 left-[5%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 right-[10%] w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-[15%] w-72 h-72 bg-pink-400/15 rounded-full blur-3xl"></div>
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
