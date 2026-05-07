'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { APP_URLS } from '@/lib/app-urls';

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`sticky top-0 z-50 w-full h-[72px] transition-all duration-200 border-b border-border-subtle ${scrolled ? 'bg-bg-primary/80 backdrop-blur-md shadow-sm' : 'bg-bg-primary/80 backdrop-blur-md'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="font-display font-bold text-xl tracking-tight flex items-center gap-2 text-text-1">
              <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center">
                <div className="w-4 h-4 bg-bg-primary rounded-sm rotate-45"></div>
              </div>
              LeadOS
            </Link>
          </div>
          
          <nav className="hidden md:flex gap-8 items-center">
            <Link href="#product-preview" className="text-sm font-medium text-text-2 hover:text-accent-primary transition-colors">Product</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-text-2 hover:text-accent-primary transition-colors">How it Works</Link>
            <Link href="#features" className="text-sm font-medium text-text-2 hover:text-accent-primary transition-colors">Features</Link>
            <Link href="#product-preview" className="text-sm font-medium text-text-2 hover:text-accent-primary transition-colors">Platform</Link>
            <Link href="#architecture" className="text-sm font-medium text-text-2 hover:text-accent-primary transition-colors">Architecture</Link>
            <Link href="#cta" className="text-sm font-medium text-text-2 hover:text-accent-primary transition-colors">Demo</Link>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 border-r border-border-subtle pr-4 mr-1">
              <Link href={APP_URLS.adminPortal} className="text-sm font-semibold text-text-2 hover:text-text-1 px-3 py-2 transition-colors">
                Admin Portal
              </Link>
              <Link href={APP_URLS.rmPortal} className="text-sm font-semibold text-text-2 hover:text-text-1 px-3 py-2 transition-colors">
                RM Portal
              </Link>
            </div>
            <Link href="#cta" className="hidden md:inline-flex btn-primary px-6 py-2.5 text-sm font-semibold shadow-lg shadow-blue-500/20">
              Try Demo
            </Link>
            <button 
              className="md:hidden p-2 text-text-2 hover:text-text-1 hover:bg-bg-soft rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[72px] z-40 bg-white md:hidden overflow-y-auto pb-24">
          <div className="flex flex-col p-4 space-y-4">
            <Link href="#product-preview" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-text-1 p-2 hover:bg-bg-soft rounded-lg">Product</Link>
            <Link href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-text-1 p-2 hover:bg-bg-soft rounded-lg">How it Works</Link>
            <Link href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-text-1 p-2 hover:bg-bg-soft rounded-lg">Features</Link>
            <Link href="#product-preview" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-text-1 p-2 hover:bg-bg-soft rounded-lg">Platform</Link>
            <Link href="#architecture" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-text-1 p-2 hover:bg-bg-soft rounded-lg">Architecture</Link>
            <Link href="#cta" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-text-1 p-2 hover:bg-bg-soft rounded-lg">Demo</Link>
            <div className="h-px bg-border-subtle my-2"></div>
            <Link href={APP_URLS.adminPortal} onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-text-1 p-2 hover:bg-bg-soft rounded-lg">Admin Portal</Link>
            <Link href={APP_URLS.rmPortal} onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-text-1 p-2 hover:bg-bg-soft rounded-lg">RM Portal</Link>
          </div>
        </div>
      )}

      {/* Mobile Sticky Button */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
        <Link href="#cta" className="btn-primary w-full py-4 text-base font-semibold shadow-2xl shadow-blue-500/30 flex justify-center items-center">
          Try Demo
        </Link>
      </div>
    </>
  );
}
