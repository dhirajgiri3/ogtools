'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/overlays/dialog';
import { Button } from '@/shared/components/ui/inputs/button';
import { cn } from '@/shared/lib/utils/cn';

export interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    variant?: 'default' | 'destructive' | 'warning';
    isLoading?: boolean;
}

/**
 * Reusable confirmation dialog component
 *
 * Features:
 * - Keyboard shortcuts (Enter = confirm, Escape = cancel)
 * - Visual variants (default, destructive, warning)
 * - Loading state support
 * - Accessible (ARIA labels, focus management)
 */
export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    variant = 'default',
    isLoading = false,
}: ConfirmDialogProps) {
    // Keyboard shortcuts
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !isLoading) {
                e.preventDefault();
                onConfirm();
            } else if (e.key === 'Escape' && !isLoading) {
                e.preventDefault();
                if (onCancel) {
                    onCancel();
                } else {
                    onOpenChange(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, isLoading, onConfirm, onCancel, onOpenChange]);

    const handleConfirm = async () => {
        await onConfirm();
        if (!isLoading) {
            onOpenChange(false);
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
        onOpenChange(false);
    };

    const variantStyles = {
        default: {
            icon: 'text-blue-500',
            iconBg: 'bg-blue-100',
            button: 'default' as const,
        },
        destructive: {
            icon: 'text-red-500',
            iconBg: 'bg-red-100',
            button: 'destructive' as const,
        },
        warning: {
            icon: 'text-amber-500',
            iconBg: 'bg-amber-100',
            button: 'default' as const,
        },
    };

    const style = variantStyles[variant];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md" showCloseButton={false}>
                <DialogHeader>
                    <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div
                            className={cn(
                                'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                                style.iconBg
                            )}
                        >
                            <AlertTriangle className={cn('w-5 h-5', style.icon)} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-1">
                            <DialogTitle className="text-left text-zinc-900 mb-2">
                                {title}
                            </DialogTitle>
                            <DialogDescription className="text-left text-zinc-600 leading-relaxed">
                                {description}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <DialogFooter className="sm:gap-3 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="sm:flex-1"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant={style.button}
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="sm:flex-1"
                    >
                        {isLoading ? 'Processing...' : confirmText}
                    </Button>
                </DialogFooter>

                {/* Keyboard hints */}
                <div className="mt-2 pt-4 border-t border-zinc-100 flex items-center justify-center gap-4 text-xs text-zinc-400">
                    <span>
                        <kbd className="px-1.5 py-0.5 bg-zinc-100 rounded text-zinc-600 font-mono">
                            Enter
                        </kbd>{' '}
                        to confirm
                    </span>
                    <span>
                        <kbd className="px-1.5 py-0.5 bg-zinc-100 rounded text-zinc-600 font-mono">
                            Esc
                        </kbd>{' '}
                        to cancel
                    </span>
                </div>
            </DialogContent>
        </Dialog>
    );
}
