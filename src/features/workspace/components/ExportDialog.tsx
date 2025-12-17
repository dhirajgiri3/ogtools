'use client';

import { useState } from 'react';
import { Download, FileText, Table, Code } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { WeekCalendar } from '@/core/types';
import {
    exportAsMarkdown,
    exportAsCSV,
    downloadFile,
    generateFilename
} from '@/shared/lib/utils/export-helpers';

interface ExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    calendars: WeekCalendar[];
}

type ExportFormat = 'markdown' | 'csv' | 'json';

export function ExportDialog({ open, onOpenChange, calendars }: ExportDialogProps) {
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('markdown');
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = () => {
        setIsExporting(true);

        try {
            switch (selectedFormat) {
                case 'markdown': {
                    const content = exportAsMarkdown(calendars);
                    downloadFile(
                        content,
                        generateFilename('reddit-calendar', 'md'),
                        'text/markdown'
                    );
                    break;
                }
                case 'csv': {
                    const content = exportAsCSV(calendars);
                    downloadFile(
                        content,
                        generateFilename('reddit-calendar', 'csv'),
                        'text/csv'
                    );
                    break;
                }
                case 'json': {
                    const exportData = {
                        exportedAt: new Date().toISOString(),
                        version: '1.0',
                        weeks: calendars
                    };
                    downloadFile(
                        JSON.stringify(exportData, null, 2),
                        generateFilename('reddit-calendar', 'json'),
                        'application/json'
                    );
                    break;
                }
            }

            // Close dialog after short delay
            setTimeout(() => {
                onOpenChange(false);
                setIsExporting(false);
            }, 500);
        } catch (error) {
            console.error('Export error:', error);
            setIsExporting(false);
        }
    };

    const totalConversations = calendars.reduce((sum, cal) => sum + cal.conversations.length, 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Export Calendar</DialogTitle>
                    <DialogDescription>
                        Export {calendars.length} week{calendars.length !== 1 ? 's' : ''} ({totalConversations} conversations) in your preferred format
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Format Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-700">
                            Select Format
                        </label>

                        <div className="grid gap-3">
                            {/* Markdown Option */}
                            <button
                                onClick={() => setSelectedFormat('markdown')}
                                className={`group relative flex items-start gap-4 rounded-lg border-2 p-4 text-left transition-all ${selectedFormat === 'markdown'
                                    ? 'border-zinc-900 bg-zinc-50'
                                    : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                                    }`}
                            >
                                <div className={`mt-0.5 rounded-lg p-2 ${selectedFormat === 'markdown'
                                    ? 'bg-zinc-900 text-white'
                                    : 'bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200'
                                    }`}>
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-zinc-900">Markdown</span>
                                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                            Recommended
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                                        Human-readable format with full thread details, quality breakdowns, and timestamps. Perfect for review.
                                    </p>
                                </div>
                            </button>

                            {/* CSV Option */}
                            <button
                                onClick={() => setSelectedFormat('csv')}
                                className={`group relative flex items-start gap-4 rounded-lg border-2 p-4 text-left transition-all ${selectedFormat === 'csv'
                                    ? 'border-zinc-900 bg-zinc-50'
                                    : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                                    }`}
                            >
                                <div className={`mt-0.5 rounded-lg p-2 ${selectedFormat === 'csv'
                                    ? 'bg-zinc-900 text-white'
                                    : 'bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200'
                                    }`}>
                                    <Table className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-zinc-900">CSV</div>
                                    <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                                        Spreadsheet format for data analysis. Opens in Excel, Google Sheets, or any spreadsheet tool.
                                    </p>
                                </div>
                            </button>

                            {/* JSON Option */}
                            <button
                                onClick={() => setSelectedFormat('json')}
                                className={`group relative flex items-start gap-4 rounded-lg border-2 p-4 text-left transition-all ${selectedFormat === 'json'
                                    ? 'border-zinc-900 bg-zinc-50'
                                    : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                                    }`}
                            >
                                <div className={`mt-0.5 rounded-lg p-2 ${selectedFormat === 'json'
                                    ? 'bg-zinc-900 text-white'
                                    : 'bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200'
                                    }`}>
                                    <Code className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-zinc-900">JSON</div>
                                    <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                                        Raw data format with complete metadata. Use for API integrations or custom processing.
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-zinc-100">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="flex-1"
                        disabled={isExporting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleExport}
                        className="flex-1 bg-zinc-900 hover:bg-zinc-800"
                        disabled={isExporting}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {isExporting ? 'Exporting...' : 'Export'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
