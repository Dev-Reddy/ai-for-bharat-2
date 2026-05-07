'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  if (pathname !== '/') {
    return null;
  }

  return (
    <header 
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        isScrolled 
          ? 'bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] py-3'
          : 'bg-transparent py-5'
      )}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link 
          href="/" 
          onClick={closeMobileMenu}
          className="flex items-center gap-2 group"
        >
          <Image src="/LeadOS_Logo.jpg" alt="LeadOS logo" width={40} height={40} className="rounded-xl object-cover shadow-md group-hover:shadow-lg transition-all duration-300" />
          <span className="text-xl font-bold tracking-tight text-[#0f172a]">
            LeadOS Client Portal
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/#benefits" className="text-sm font-medium text-[#475569] hover:text-[#0f172a] transition-colors">
            Benefits
          </Link>
          <Link href="/#how-it-works" className="text-sm font-medium text-[#475569] hover:text-[#0f172a] transition-colors">
            How it Works
          </Link>
          <Link href="/chat" className="text-sm font-medium text-[#475569] hover:text-[#0f172a] transition-colors">
            Partner Support
          </Link>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/#login" className="text-sm font-semibold text-[#0f172a] hover:text-[#0ea5e9] transition-colors">
            Log in
          </Link>
          <Link href="/#lead-form" className={cn("inline-flex items-center justify-center rounded-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white shadow-md hover:shadow-lg transition-all h-10 px-6 font-semibold text-sm")}>
            Partner with Us
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden p-2 text-[#0f172a]"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-xl md:hidden flex flex-col p-6 gap-6 animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col gap-4">
            <Link href="/#benefits" onClick={closeMobileMenu} className="text-lg font-medium text-[#0f172a]">
              Benefits
            </Link>
            <Link href="/#how-it-works" onClick={closeMobileMenu} className="text-lg font-medium text-[#0f172a]">
              How it Works
            </Link>
            <Link href="/chat" onClick={closeMobileMenu} className="text-lg font-medium text-[#0f172a]">
              Partner Support
            </Link>
          </nav>
          
          <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
            <Link href="/#login" onClick={closeMobileMenu} className="w-full h-12 flex items-center justify-center rounded-xl bg-gray-50 text-[#0f172a] font-semibold">
              Log in
            </Link>
            <Link href="/#lead-form" onClick={closeMobileMenu} className="w-full h-12 flex items-center justify-center rounded-xl bg-[#0ea5e9] text-white font-semibold shadow-md">
              Partner with Us
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
