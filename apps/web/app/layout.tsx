import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import '@fontsource-variable/manrope';
import './globals.css';
import './zm.css';

export const metadata: Metadata = {
  title: 'ZM HMS — Hospital Management System',
  description: 'Hospital Management System for clinical operations, pharmacy, billing, and administration.'
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
