import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/navigation/Navbar";

export const metadata: Metadata = {
  title: 'LeadOS Client Portal',
  description: 'Client-facing LeadOS portal for partner onboarding and AI support.',
  icons: {
    icon: '/LeadOS_Logo.jpg',
    shortcut: '/LeadOS_Logo.jpg',
    apple: '/LeadOS_Logo.jpg',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html
      lang="en"
      className="font-sans scroll-smooth"
      style={{ ["--font-sans" as string]: '"Segoe UI", ui-sans-serif, system-ui, sans-serif' }}
    >
      <body className="antialiased text-[#0f172a] bg-[#ffffff]" suppressHydrationWarning>
        <Navbar />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
