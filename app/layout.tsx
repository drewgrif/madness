import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'March Madness',
  description: 'March Madness bracket pool',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
