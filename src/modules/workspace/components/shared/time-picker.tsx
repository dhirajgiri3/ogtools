'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/inputs/button';
import { Input } from '@/shared/components/ui/inputs/input';
import { cn } from '@/shared/lib/utils/cn';

export interface TimePickerProps {
    value: Date;
    onChange: (date: Date) => void;
    onSave?: () => void;
    onCancel?: () => void;
    minDate?: Date;
    maxDate?: Date;
    validateFn?: (date: Date) => { valid: boolean; message?: string };
    className?: string;
}

/**
 * Time picker component for rescheduling conversations
 *
 * Features:
 * - Date + time selection
 * - Timezone display
 * - Custom validation support
 * - Visual feedback for conflicts
 * - Save/Cancel actions
 */
export function TimePicker({
    value,
    onChange,
    onSave,
    onCancel,
    minDate,
    maxDate,
    validateFn,
    className,
}: TimePickerProps) {
    const [dateValue, setDateValue] = useState(formatDateForInput(value));
    const [timeValue, setTimeValue] = useState(formatTimeForInput(value));
    const [validationError, setValidationError] = useState<string | null>(null);

    // Update internal state when external value changes
    useEffect(() => {
        setDateValue(formatDateForInput(value));
        setTimeValue(formatTimeForInput(value));
    }, [value]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDateValue = e.target.value;
        setDateValue(newDateValue);

        // Combine with current time
        const combined = combineDateAndTime(newDateValue, timeValue);
        if (combined) {
            validateAndUpdate(combined);
        }
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTimeValue = e.target.value;
        setTimeValue(newTimeValue);

        // Combine with current date
        const combined = combineDateAndTime(dateValue, newTimeValue);
        if (combined) {
            validateAndUpdate(combined);
        }
    };

    const validateAndUpdate = (newDate: Date) => {
        // Validate min/max dates
        if (minDate && newDate < minDate) {
            setValidationError(`Date must be after ${minDate.toLocaleDateString()}`);
            return;
        }

        if (maxDate && newDate > maxDate) {
            setValidationError(`Date must be before ${maxDate.toLocaleDateString()}`);
            return;
        }

        // Custom validation
        if (validateFn) {
            const result = validateFn(newDate);
            if (!result.valid) {
                setValidationError(result.message || 'Invalid date/time');
                onChange(newDate); // Still update to show the user what they selected
                return;
            }
        }

        setValidationError(null);
        onChange(newDate);
    };

    const handleSave = () => {
        if (!validationError && onSave) {
            onSave();
        }
    };

    const handleCancel = () => {
        // Reset to original value
        setDateValue(formatDateForInput(value));
        setTimeValue(formatTimeForInput(value));
        setValidationError(null);

        if (onCancel) {
            onCancel();
        }
    };

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return (
        <div className={cn('bg-white rounded-lg border border-zinc-200 p-4 shadow-sm', className)}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-semibold text-zinc-900">Reschedule Conversation</span>
            </div>

            {/* Date Input */}
            <div className="space-y-3 mb-4">
                <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                        Date
                    </label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                        <Input
                            type="date"
                            value={dateValue}
                            onChange={handleDateChange}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Time Input */}
                <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                        Time
                    </label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                        <Input
                            type="time"
                            value={timeValue}
                            onChange={handleTimeChange}
                            className="pl-9"
                        />
                    </div>
                </div>
            </div>

            {/* Timezone Display */}
            <div className="text-xs text-zinc-500 mb-4 px-1">
                Timezone: {timezone}
            </div>

            {/* Validation Error */}
            {validationError && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 leading-relaxed">{validationError}</p>
                </div>
            )}

            {/* Preview */}
            <div className="bg-zinc-50 rounded-lg p-3 mb-4 border border-zinc-100">
                <p className="text-xs text-zinc-500 mb-1">Preview:</p>
                <p className="text-sm font-medium text-zinc-900">
                    {value.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </p>
                <p className="text-sm text-zinc-700">
                    {value.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                    })}
                </p>
            </div>

            {/* Actions */}
            {(onSave || onCancel) && (
                <div className="flex items-center gap-2">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCancel}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    )}
                    {onSave && (
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleSave}
                            disabled={!!validationError}
                            className="flex-1"
                        >
                            Save
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

// Helper functions

function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatTimeForInput(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function combineDateAndTime(dateStr: string, timeStr: string): Date | null {
    if (!dateStr || !timeStr) return null;

    try {
        // Parse date parts
        const [year, month, day] = dateStr.split('-').map(Number);

        // Parse time parts
        const [hours, minutes] = timeStr.split(':').map(Number);

        // Create new date
        const combined = new Date(year, month - 1, day, hours, minutes);

        // Validate result
        if (isNaN(combined.getTime())) {
            return null;
        }

        return combined;
    } catch (error) {
        console.error('Failed to combine date and time:', error);
        return null;
    }
}
