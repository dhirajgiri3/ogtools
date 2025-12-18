'use client';

import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { Label } from '@/shared/components/ui/inputs/label';
import { Badge } from '@/shared/components/ui/feedback/badge';

interface TagInputProps {
    label: string;
    description?: string;
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    suggestions?: string[];
    min?: number;
    max?: number;
}

export function TagInput({
    label,
    description,
    value,
    onChange,
    placeholder = 'Type and press Enter...',
    suggestions = [],
    min = 0,
    max = 20
}: TagInputProps) {
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const addTag = (tag: string) => {
        const trimmed = tag.trim().toLowerCase();
        if (trimmed && !value.includes(trimmed) && value.length < max) {
            onChange([...value, trimmed]);
            setInputValue('');
            setShowSuggestions(false);
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(value.filter(tag => tag !== tagToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(inputValue);
        } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            removeTag(value[value.length - 1]);
        }
    };

    const filteredSuggestions = suggestions.filter(
        s => s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s.toLowerCase())
    ).slice(0, 8);

    const showWarning = min > 0 && value.length < min;
    const showMax = value.length >= max;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div>
                    <Label className="text-xs font-semibold text-zinc-700">{label}</Label>
                    {description && (
                        <p className="text-[11px] text-zinc-500 mt-0.5">{description}</p>
                    )}
                </div>
                <span className="text-[10px] font-mono text-zinc-400">
                    {value.length}/{max}
                </span>
            </div>

            {/* Tags display and input */}
            <div
                className="min-h-[42px] bg-white border border-zinc-200 rounded-lg p-2 focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-400/20 transition-all cursor-text"
                onClick={() => inputRef.current?.focus()}
            >
                <div className="flex flex-wrap gap-1.5 items-center">
                    {value.map((tag, index) => (
                        <Badge
                            key={index}
                            variant="secondary"
                            className="bg-zinc-900 text-white hover:bg-zinc-800 text-[11px] px-2 py-0.5 h-6 flex items-center gap-1 group"
                        >
                            <span>{tag}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeTag(tag);
                                }}
                                className="hover:text-red-300 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </Badge>
                    ))}

                    {!showMax && (
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                setShowSuggestions(e.target.value.length > 0);
                            }}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setShowSuggestions(inputValue.length > 0)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            placeholder={value.length === 0 ? placeholder : ''}
                            className="flex-1 min-w-[120px] bg-transparent border-0 outline-none text-sm text-zinc-900 placeholder:text-zinc-400"
                        />
                    )}
                </div>
            </div>

            {/* Suggestions */}
            {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden">
                    <div className="text-[10px] text-zinc-500 px-3 py-1.5 bg-zinc-50 border-b border-zinc-100 font-semibold uppercase tracking-wide">
                        Suggestions
                    </div>
                    <div className="max-h-[160px] overflow-y-auto">
                        {filteredSuggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center gap-2"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    addTag(suggestion);
                                }}
                            >
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 h-5">
                                    {suggestion}
                                </Badge>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Validation messages */}
            {showWarning && (
                <p className="text-xs text-amber-600">
                    Add at least {min - value.length} more {min - value.length === 1 ? 'keyword' : 'keywords'}
                </p>
            )}

            {showMax && (
                <p className="text-xs text-zinc-500">
                    Maximum keywords reached
                </p>
            )}
        </div>
    );
}
