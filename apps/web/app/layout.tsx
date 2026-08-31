import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'ATHAR ONE', template: '%s · ATHAR ONE' },
  description: 'One operating system for client growth, delivery, and business operations.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
