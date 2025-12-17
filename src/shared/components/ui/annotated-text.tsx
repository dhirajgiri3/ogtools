'use client';

import { useState } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

export interface Annotation {
    type: 'strength' | 'authentic' | 'natural' | 'warning' | 'info';
    label: string;
    description: string;
}

interface AnnotatedTextProps {
    text: string;
    annotations?: Annotation[];
    className?: string;
}

/**
 * AnnotatedText - Shows text with inline annotation badges
 * Used to highlight quality indicators in conversations
 */
export function AnnotatedText({ text, annotations = [], className = '' }: AnnotatedTextProps) {
    if (annotations.length === 0) {
        return <p className={className}>{text}</p>;
    }

    return (
        <div className={`relative group ${className}`}>
            <p className="whitespace-pre-wrap">{text}</p>

            {/* Annotation Badges */}
            <div className="mt-3 flex flex-wrap gap-1.5">
                {annotations.map((annotation, idx) => (
                    <AnnotationBadge key={idx} annotation={annotation} />
                ))}
            </div>
        </div>
    );
}

interface AnnotationBadgeProps {
    annotation: Annotation;
}

function AnnotationBadge({ annotation }: AnnotationBadgeProps) {
    const getIcon = () => {
        switch (annotation.type) {
            case 'strength':
                return <CheckCircle2 className="w-2.5 h-2.5" />;
            case 'authentic':
                return <Sparkles className="w-2.5 h-2.5" />;
            case 'natural':
                return <CheckCircle2 className="w-2.5 h-2.5" />;
            case 'warning':
                return <AlertTriangle className="w-2.5 h-2.5" />;
            case 'info':
                return <Info className="w-2.5 h-2.5" />;
        }
    };

    const getStyles = () => {
        switch (annotation.type) {
            case 'strength':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
            case 'authentic':
                return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
            case 'natural':
                return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
            case 'warning':
                return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
            case 'info':
                return 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100';
        }
    };

    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium transition-colors ${getStyles()}`}
                    >
                        {getIcon()}
                        <span>{annotation.label}</span>
                    </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">{annotation.description}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

/**
 * Generate annotations based on conversation content
 * This is a helper to automatically detect quality indicators
 */
export function generateAnnotations(
    content: string,
    options?: {
        isPost?: boolean;
        hasProductMention?: boolean;
        emotion?: string;
    }
): Annotation[] {
    const annotations: Annotation[] = [];
    const lowerContent = content.toLowerCase();

    // Authentic markers
    const authenticMarkers = ['honestly', 'tbh', 'lol', 'literally', 'ngl'];
    const hasAuthenticMarker = authenticMarkers.some(marker => lowerContent.includes(marker));
    if (hasAuthenticMarker) {
        annotations.push({
            type: 'authentic',
            label: 'Casual Tone',
            description: 'Uses natural conversational markers like "honestly" or "tbh" that feel human'
        });
    }

    // Specific details (numbers, time frames)
    const hasSpecificDetails = /\d+/.test(content);
    if (hasSpecificDetails && options?.isPost) {
        annotations.push({
            type: 'strength',
            label: 'Specific Details',
            description: 'Includes concrete numbers or timeframes, making the problem feel real and relatable'
        });
    }

    // Emotion indicators (for posts)
    if (options?.emotion && options?.isPost) {
        const emotionMap: Record<string, { label: string; description: string }> = {
            frustration: {
                label: 'Emotional Hook',
                description: 'Expresses genuine frustration, creating empathy and engagement opportunity'
            },
            excitement: {
                label: 'Positive Energy',
                description: 'Shows enthusiasm, encouraging others to share similar experiences'
            },
            curiosity: {
                label: 'Open Question',
                description: 'Genuine curiosity invites helpful responses from community'
            }
        };
        if (emotionMap[options.emotion]) {
            annotations.push({
                type: 'strength',
                ...emotionMap[options.emotion]
            });
        }
    }

    // Natural product mention
    if (options?.hasProductMention) {
        // Check if product mention is casual (not promotional)
        const casualFraming = ['tried', 'using', 'found', 'works', 'helped'];
        const hasCasualFraming = casualFraming.some(word => lowerContent.includes(word));
        if (hasCasualFraming) {
            annotations.push({
                type: 'natural',
                label: 'Natural Mention',
                description: 'Product referenced casually as part of personal experience, not promotional'
            });
        }
    }

    // Parenthetical asides (show natural thinking)
    if (content.includes('(') && content.includes(')')) {
        annotations.push({
            type: 'authentic',
            label: 'Conversational Flow',
            description: 'Parenthetical aside mimics natural thought process in casual writing'
        });
    }

    // Questions to community
    if (lowerContent.includes('anyone') || lowerContent.includes('does anyone')) {
        annotations.push({
            type: 'strength',
            label: 'Community Engagement',
            description: 'Asks relatable question that invites responses from others with similar experiences'
        });
    }

    return annotations;
}
