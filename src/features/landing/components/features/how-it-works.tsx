'use client';

import { Card } from '@/shared/components/ui/card';
import { Settings, Sparkles, CheckCircle, Download, Shield, Zap } from 'lucide-react';

/**
 * How It Works Section Component
 * 
 * 3-step process visualization with feature highlights.
 */

const steps = [
    {
        number: '1',
        title: 'Setup',
        time: '5 min',
        description: 'Configure your company, personas, and target subreddits. Use our templates or start from scratch.',
        icon: Settings,
        features: ['Pre-built personas', 'Subreddit targeting', 'Smart defaults'],
        color: 'blue',
    },
    {
        number: '2',
        title: 'Generate & Review',
        time: '10 min',
        description: 'AI generates conversations, applies authenticity transformations, and scores quality automatically.',
        icon: Sparkles,
        features: ['5-layer authenticity', 'Quality scoring', 'Safety validation'],
        color: 'purple',
    },
    {
        number: '3',
        title: 'Export & Deploy',
        time: '2 min',
        description: 'Download your calendar in client-ready formats. Share with stakeholders or post directly.',
        icon: Download,
        features: ['PDF reports', 'CSV export', 'Scheduling data'],
        color: 'green',
    },
];

const benefits = [
    {
        icon: Shield,
        title: '5 Safety Checks',
        description: 'Account readiness, frequency limits, timing, collusion detection, content similarity',
    },
    {
        icon: Sparkles,
        title: 'Authenticity Engine',
        description: '5-layer transformation: calibration, imperfections, personality, culture, structure',
    },
    {
        icon: Zap,
        title: 'Quality Scoring',
        description: '5 dimensions: relevance, specificity, authenticity (highest weight), value-first, engagement',
    },
    {
        icon: CheckCircle,
        title: 'Client-Ready',
        description: 'Professional exports, shareable previews, transparent quality metrics',
    },
];

export function HowItWorks() {
    return (
        <section className="py-20 bg-white">
            <div className="max-w-6xl mx-auto px-6">
                {/* Section header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        From Setup to Deploy in 17 Minutes
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Our streamlined workflow gets you from configuration to client-ready calendar
                        faster than ever before.
                    </p>
                </div>

                {/* Steps */}
                <div className="relative">
                    {/* Connection line */}
                    <div className="hidden md:block absolute top-20 left-0 right-0 h-0.5 bg-gray-200" style={{ marginLeft: '16.67%', marginRight: '16.67%' }} />

                    <div className="grid md:grid-cols-3 gap-8">
                        {steps.map((step, idx) => (
                            <div key={idx} className="relative">
                                {/* Step number */}
                                <div className={`
                  relative z-10 w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white font-bold text-xl mb-6
                  ${step.color === 'blue' ? 'bg-blue-600' : ''}
                  ${step.color === 'purple' ? 'bg-purple-600' : ''}
                  ${step.color === 'green' ? 'bg-green-600' : ''}
                `}>
                                    {step.number}
                                </div>

                                <Card className="p-6 text-center h-full">
                                    {/* Icon */}
                                    <div className={`
                    inline-flex p-3 rounded-lg mb-4
                    ${step.color === 'blue' ? 'bg-blue-50 text-blue-600' : ''}
                    ${step.color === 'purple' ? 'bg-purple-50 text-purple-600' : ''}
                    ${step.color === 'green' ? 'bg-green-50 text-green-600' : ''}
                  `}>
                                        <step.icon className="w-6 h-6" />
                                    </div>

                                    {/* Title & time */}
                                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{step.title}</h3>
                                    <p className={`
                    text-sm font-medium mb-3
                    ${step.color === 'blue' ? 'text-blue-600' : ''}
                    ${step.color === 'purple' ? 'text-purple-600' : ''}
                    ${step.color === 'green' ? 'text-green-600' : ''}
                  `}>
                                        ~{step.time}
                                    </p>

                                    {/* Description */}
                                    <p className="text-gray-600 mb-4">{step.description}</p>

                                    {/* Features */}
                                    <div className="space-y-2">
                                        {step.features.map((feature, fIdx) => (
                                            <div key={fIdx} className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Benefits grid */}
                <div className="mt-20 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {benefits.map((benefit, idx) => (
                        <div key={idx} className="text-center p-6">
                            <div className="inline-flex p-3 rounded-lg bg-gray-100 text-gray-700 mb-4">
                                <benefit.icon className="w-6 h-6" />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">{benefit.title}</h4>
                            <p className="text-sm text-gray-600">{benefit.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default HowItWorks;
