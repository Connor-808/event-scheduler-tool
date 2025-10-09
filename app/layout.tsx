import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Event Scheduler - Find the perfect time for everyone",
  description: "Schedule plans with friends, effortlessly. No accounts, no hassle. Just create a poll, share the link, and find the perfect time.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-white via-blue-50/30 to-purple-50/40 dark:from-gray-950 dark:via-blue-950/20 dark:to-purple-950/20`}
      >
        {/* Strong halftone dot pattern for depth */}
        <div 
          className="fixed inset-0 pointer-events-none z-0"
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
          className="fixed inset-0 pointer-events-none opacity-70 dark:opacity-50 z-0"
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
        <div className="fixed inset-0 pointer-events-none opacity-40 z-0">
          <div className="absolute top-10 left-[5%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/4 right-[10%] w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-[15%] w-72 h-72 bg-pink-400/15 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
