import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'LeadOS Marketing Website',
  description: 'The premium SaaS platform for AI-driven lead conversion and relationship management.',
  icons: {
    icon: '/LeadOS_Logo.jpg',
    shortcut: '/LeadOS_Logo.jpg',
    apple: '/LeadOS_Logo.jpg',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`scroll-smooth ${inter.variable}`}>
      <body className="antialiased font-body" suppressHydrationWarning>{children}</body>
    </html>
  );
}
