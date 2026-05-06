import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import Solution from "@/components/Solution";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import ProductPreview from "@/components/ProductPreview";
import Architecture from "@/components/Architecture";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[100] bg-text-1 text-bg-primary px-4 py-2 font-medium rounded-md shadow-md">
        Skip to main content
      </a>
      <main id="main-content" className="w-full flex-col flex items-center min-h-screen pb-28 md:pb-0">
        <Navigation />
        <Hero />
        <Problem />
        <Solution />
        <HowItWorks />
        <Features />
        <ProductPreview />
        <Architecture />
        <CTA />
        <Footer />
      </main>
    </>
  );
}
