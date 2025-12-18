'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/shared/components/ui/layout/card';
import { Badge } from '@/shared/components/ui/feedback/badge';
import { Bot, User, GripVertical } from 'lucide-react';
import { motion, useSpring, useTransform } from 'framer-motion';

/**
 * Before/After Slider Component
 *
 * Modern interactive comparison showing AI text transformation.
 * Refactored for a minimalistic, premium feel.
 */

const beforeText = `I recently discovered PlanShift and it has revolutionized my workflow. The seamless integration with Jira and the intuitive user interface make it the best project management tool on the market. It offers unparalleled efficiency and I believe every team should adopt it immediately for maximum productivity gains. #productivity #scrum #agile`;

const afterText = `My team just switched to PlanShift after struggling with Jira for years. Honestly, the two-way sync is the only thing keeping me sane right now.

It’s not perfect (mobile app is still kinda buggy), but for actual sprint planning, it’s been a massive upgrade. No idea why Atlassian hasn't just bought them yet lol.`;

export function BeforeAfterSlider() {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isHovering, setIsHovering] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    // Smooth spring animation for the handle movement
    const springConfig = { damping: 25, stiffness: 120 };
    const springPosition = useSpring(50, springConfig);

    useEffect(() => {
        springPosition.set(sliderPosition);
    }, [sliderPosition, springPosition]);

    const handleMouseDown = () => {
        isDragging.current = true;
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;

        // If dragging, update position
        if (isDragging.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
            setSliderPosition(percentage);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!containerRef.current) return;

        const touch = e.touches[0];
        const rect = containerRef.current.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPosition(percentage);
    };

    // Allow clicking to jump
    const handleClick = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPosition(percentage);
    };

    return (
        <section className="py-24 bg-white relative overflow-hidden">
            <div className="max-w-5xl mx-auto px-6 relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <Badge variant="outline" className="mb-4 px-4 py-1 border-blue-200 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                            Authenticity Engine
                        </Badge>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                            See the Difference
                        </h2>
                        <p className="text-md text-gray-500 max-w-md mx-auto leading-relaxed">
                            Drag the slider to compare standard AI generation versus our calibrated human-like output.
                        </p>
                    </motion.div>
                </div>

                {/* Comparison Slider */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="relative select-none"
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                >
                    <div
                        ref={containerRef}
                        className="relative h-[480px] md:h-[420px] rounded-3xl overflow-hidden cursor-ew-resize shadow-2xl ring-1 ring-gray-900/5"
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        onTouchMove={handleTouchMove}
                        onClick={handleClick}
                    >
                        {/* Before (Left) - Generic AI */}
                        <div className="absolute inset-0 bg-gray-50 flex flex-col p-8 md:p-12">
                            <div className="flex items-center justify-between mb-8 opacity-60 grayscale transition-all duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-gray-500" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-gray-900">Standard AI</div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Generic Model</div>
                                    </div>
                                </div>
                            </div>
                            <div className="prose prose-lg text-gray-500 max-w-none leading-relaxed">
                                <p>{beforeText}</p>
                            </div>
                            <div className="mt-auto pt-6 border-t border-gray-200/60 flex gap-4 text-sm text-gray-400 font-medium font-mono">
                                <span>Risk: High</span>
                                <span>•</span>
                                <span>Tone: Robotic</span>
                            </div>
                        </div>

                        {/* After (Right) - Authentic Overlay */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 flex flex-col p-8 md:p-12"
                            style={{
                                clipPath: `inset(0 0 0 ${sliderPosition}%)`
                            }}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                        <User className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-white">Reddit Mastermind</div>
                                        <div className="text-xs text-blue-100 uppercase tracking-wider font-medium">Calibrated Model</div>
                                    </div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                                    98% Human Score
                                </div>
                            </div>
                            <div className="prose prose-lg text-white/90 max-w-none leading-relaxed">
                                <p className="whitespace-pre-line">{afterText}</p>
                            </div>
                            <div className="mt-auto pt-6 border-t border-white/20 flex gap-4 text-sm text-blue-100 font-medium font-mono">
                                <span>Risk: Safe</span>
                                <span>•</span>
                                <span>Tone: Native</span>
                            </div>
                        </motion.div>

                        {/* Slider Handle */}
                        <div
                            className="absolute top-0 bottom-0 w-1.5 bg-white cursor-ew-resize z-20 shadow-[0_0_30px_rgba(0,0,0,0.3)]"
                            style={{
                                left: `${sliderPosition}%`,
                            }}
                        >
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center transform transition-transform hover:scale-110 active:scale-95">
                                <GripVertical className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    {/* Caption */}
                    <div className="flex justify-between mt-4 text-sm font-medium text-gray-400 uppercase tracking-widest px-4">
                        <span>Generic Output</span>
                        <span>Authentic Output</span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

export default BeforeAfterSlider;
