'use client';

import { motion } from 'framer-motion';
import { Loader2, Check, Sparkles, Shield, Wand2 } from 'lucide-react';
import { Progress } from '@/shared/components/ui/feedback/progress';

interface GenerationStatusProps {
    progress: number;
    status: string;
}

export function GenerationStatus({ progress, status }: GenerationStatusProps) {
    const stages = [
        { name: 'Preparing', icon: Sparkles, threshold: 10 },
        { name: 'Generating', icon: Wand2, threshold: 30 },
        { name: 'Quality Check', icon: Check, threshold: 70 },
        { name: 'Safety Scan', icon: Shield, threshold: 90 },
    ];

    const isComplete = progress >= 100;

    return (
        <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl bg-white/95 backdrop-blur-2xl border border-zinc-200 shadow-2xl shadow-zinc-900/10 rounded-2xl z-50 overflow-hidden"
        >
            {/* Progress bar at top */}
            <div className="h-1 bg-zinc-100">
                <motion.div
                    className={`h-full ${isComplete ? 'bg-emerald-500' : 'bg-zinc-900'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                />
            </div>

            <div className="px-6 py-5">
                <div className="flex items-center gap-4 mb-4">
                    {/* Spinner / Check */}
                    <div className={`relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${isComplete ? 'bg-emerald-100' : 'bg-zinc-100'}`}>
                        {isComplete ? (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', damping: 15 }}
                            >
                                <Check className="w-6 h-6 text-emerald-600" />
                            </motion.div>
                        ) : (
                            <Loader2 className="w-6 h-6 text-zinc-700 animate-spin" />
                        )}
                    </div>

                    {/* Status Text */}
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-zinc-900 text-sm truncate">{status}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            {isComplete ? 'Ready to view' : `${Math.round(progress)}% complete`}
                        </p>
                    </div>
                </div>

                {/* Stages */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                    {stages.map((stage, idx) => {
                        const isActive = progress >= stage.threshold;
                        const Icon = stage.icon;

                        return (
                            <div
                                key={stage.name}
                                className={`flex items-center gap-1.5 transition-all duration-300 ${isActive ? 'text-zinc-900' : 'text-zinc-300'}`}
                            >
                                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-700' : 'text-zinc-300'}`} />
                                <span className={`text-[11px] font-medium ${isActive ? 'text-zinc-700' : 'text-zinc-400'}`}>
                                    {stage.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}
