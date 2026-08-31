import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ATHAR ONE Client Portal',
  description: 'Review approvals, files, invoices, and reports in one secure place.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
