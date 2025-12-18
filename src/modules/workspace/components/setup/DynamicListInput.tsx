'use client';

import { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/inputs/button';
import { Input } from '@/shared/components/ui/inputs/input';
import { Label } from '@/shared/components/ui/inputs/label';

interface DynamicListInputProps {
    label: string;
    description?: string;
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    suggestions?: string[];
}

export function DynamicListInput({
    label,
    description,
    value,
    onChange,
    placeholder = 'Add item...',
    min = 0,
    max = 10,
    minLength = 3,
    maxLength = 100,
    suggestions = []
}: DynamicListInputProps) {
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const addItem = (item: string) => {
        const trimmed = item.trim();
        if (trimmed && !value.includes(trimmed)) {
            if (value.length < max) {
                onChange([...value, trimmed]);
                setInputValue('');
                setShowSuggestions(false);
            }
        }
    };

    const removeItem = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addItem(inputValue);
        }
    };

    const filteredSuggestions = suggestions.filter(
        s => s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s)
    ).slice(0, 5);

    const isValid = value.length >= min && value.length <= max;
    const showWarning = value.length < min;
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

            {/* Current items */}
            {value.length > 0 && (
                <div className="space-y-1.5">
                    {value.map((item, index) => (
                        <div
                            key={index}
                            className="group flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm hover:border-zinc-300 transition-colors"
                        >
                            <span className="flex-1 text-zinc-700">{item}</span>
                            <button
                                onClick={() => removeItem(index)}
                                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-600 transition-all"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input for new items */}
            {!showMax && (
                <div className="relative">
                    <div className="flex gap-2">
                        <Input
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                setShowSuggestions(e.target.value.length > 0);
                            }}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setShowSuggestions(inputValue.length > 0)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            placeholder={placeholder}
                            className="flex-1 h-9 text-sm bg-white border-zinc-200 focus:border-zinc-400 focus:ring-zinc-400/20"
                            maxLength={maxLength}
                        />
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => addItem(inputValue)}
                            disabled={!inputValue.trim()}
                            className="h-9 px-3 bg-zinc-900 hover:bg-zinc-800 text-white"
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Suggestions dropdown */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden">
                            {filteredSuggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        addItem(suggestion);
                                    }}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Validation feedback */}
            {showWarning && value.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-100">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Add at least {min - value.length} more {min - value.length === 1 ? 'item' : 'items'}</span>
                </div>
            )}

            {showMax && (
                <div className="text-xs text-zinc-500 bg-zinc-50 px-3 py-2 rounded-md border border-zinc-200">
                    Maximum items reached
                </div>
            )}
        </div>
    );
}
