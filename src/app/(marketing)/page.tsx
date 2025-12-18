
import { Hero } from '@/modules/landing/components/hero';
import { BeforeAfterSlider } from '@/modules/landing/components/sections';
import { FeatureSteps } from '@/modules/landing/components/sections';
import { Button } from '@/shared/components/ui/inputs/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * Landing Page - Minimalistic Redesign
 */

const processSteps = [
  {
    step: 'Step 1',
    title: 'Define Your Company',
    content: 'Enter your product details, value propositions, and ideal customer profile. Our AI learns what makes your offering unique.',
    image: '/images/features/step-1.png'
  },
  {
    step: 'Step 2',
    title: 'Select Personas',
    content: 'Choose from diverse, authentic personas with unique backgrounds and Reddit behavior patterns that match your target audience.',
    image: '/images/features/step-2.png'
  },
  {
    step: 'Step 3',
    title: 'AI Generates Content',
    content: 'Our advanced AI crafts natural Reddit conversations tailored to specific subreddit cultures, ensuring safety and authenticity.',
    image: '/images/features/step-3.png'
  },
  {
    step: 'Step 4',
    title: 'Review & Launch',
    content: 'Get a complete weekly calendar with optimized posting times. Review, edit, and export your authentic content.',
    image: '/images/features/step-4.png'
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-xs">RM</span>
            </div>
            <span className="font-semibold text-gray-900 text-base sm:text-lg tracking-tight">Reddit Mastermind</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/workspace">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full px-4 sm:px-5 text-xs sm:text-sm transition-colors h-9 sm:h-10">
                Get Started
                <ArrowRight className="ml-1 sm:ml-1.5 w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <Hero />

      {/* Comparison Section */}
      <BeforeAfterSlider />

      {/* Simplified Journey/Process Section */}
      <section className="bg-white">
        <FeatureSteps
          features={processSteps}
          title="Your Journey to Authentic Growth"
          subtitle="From setup to success in 4 simple steps. Our platform guides you through every stage."
          autoPlayInterval={5000}
          imageHeight="h-[500px]"
          className="py-24"
        />
      </section>

      {/* Minimalistic Premium Footer */}
      <footer className="bg-gray-50 py-3 sm:py-4 px-4 sm:px-6 flex items-center justify-center">
        <p className="text-xs sm:text-sm font-medium text-gray-400 flex items-center gap-1.5 text-center">
          Developed with <span className="text-red-500">♥</span> by <span className="text-gray-900">Dhiraj Giri</span>
        </p>
      </footer>
    </main>
  );
}
