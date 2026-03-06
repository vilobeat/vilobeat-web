import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import ConvexClientProvider from '@/providers/ConvexClientProvider';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-grotesk',
  weight: ['300', '400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: 'ViloBeat Admin Dashboard',
  description: 'Manage Distribution, Mastering, and Music Operations seamlessly.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Removed forced "dark" class to match mobile app's light, airy aesthetic
    <html lang="en" className={`${spaceGrotesk.variable}`}>
      <body suppressHydrationWarning className="bg-background text-foreground">
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
