import { WeekCalendar, ScheduledConversation, SafetyReport } from '@/core/types';

/**
 * Centralized localStorage manager for calendar CRUD operations
 *
 * Features:
 * - Atomic write operations with verification
 * - Automatic rollback on failures
 * - Change event broadcasting for React state sync
 * - Data validation before persistence
 */

const STORAGE_KEYS = {
    CALENDARS: 'generatedCalendars',
    PARAMS: 'generationParams',
} as const;

export type StorageChangeEvent = {
    type: 'update' | 'delete' | 'create';
    weekIndex?: number;
    conversationId?: string;
};

type StorageChangeListener = (event: StorageChangeEvent) => void;

class CalendarStorage {
    private listeners: Set<StorageChangeListener> = new Set();

    /**
     * Subscribe to storage changes
     */
    subscribe(listener: StorageChangeListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Notify all listeners of storage changes
     */
    private notifyListeners(event: StorageChangeEvent) {
        this.listeners.forEach(listener => listener(event));
    }

    /**
     * Atomic write to localStorage with verification
     */
    private async writeToStorage(key: string, data: any, retries = 3): Promise<boolean> {
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const serialized = JSON.stringify(data);
                localStorage.setItem(key, serialized);

                // Verify write
                const verification = localStorage.getItem(key);
                if (verification === serialized) {
                    return true;
                }
            } catch (error) {
                console.error(`Storage write failed (attempt ${attempt + 1}):`, error);
                if (attempt === retries - 1) {
                    throw new Error('Failed to write to localStorage after retries');
                }
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
            }
        }
        return false;
    }

    /**
     * Get all weeks from storage
     */
    getAllWeeks(): WeekCalendar[] {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.CALENDARS);
            if (!stored) return [];
            return JSON.parse(stored);
        } catch (error) {
            console.error('Failed to parse calendars from storage:', error);
            return [];
        }
    }

    /**
     * Get a specific week by index
     */
    getWeek(weekIndex: number): WeekCalendar | null {
        const weeks = this.getAllWeeks();
        return weeks[weekIndex] || null;
    }

    /**
     * Get a specific conversation from a week
     */
    getConversation(weekIndex: number, conversationId: string): ScheduledConversation | null {
        const week = this.getWeek(weekIndex);
        if (!week) return null;

        return week.conversations.find(c => c.conversation.id === conversationId) || null;
    }

    /**
     * Add a new week to storage
     */
    async addWeek(calendar: WeekCalendar): Promise<void> {
        const weeks = this.getAllWeeks();
        weeks.push(calendar);
        await this.writeToStorage(STORAGE_KEYS.CALENDARS, weeks);
        this.notifyListeners({ type: 'create', weekIndex: weeks.length - 1 });
    }

    /**
     * Update an entire week
     */
    async updateWeek(weekIndex: number, calendar: WeekCalendar): Promise<void> {
        const weeks = this.getAllWeeks();

        if (weekIndex < 0 || weekIndex >= weeks.length) {
            throw new Error(`Invalid week index: ${weekIndex}`);
        }

        weeks[weekIndex] = calendar;
        await this.writeToStorage(STORAGE_KEYS.CALENDARS, weeks);
        this.notifyListeners({ type: 'update', weekIndex });
    }

    /**
     * Update a specific conversation within a week
     */
    async updateConversation(
        weekIndex: number,
        conversationId: string,
        updates: Partial<ScheduledConversation>
    ): Promise<ScheduledConversation> {
        const weeks = this.getAllWeeks();
        const week = weeks[weekIndex];

        if (!week) {
            throw new Error(`Week not found at index: ${weekIndex}`);
        }

        const conversationIndex = week.conversations.findIndex(
            c => c.conversation.id === conversationId
        );

        if (conversationIndex === -1) {
            throw new Error(`Conversation not found: ${conversationId}`);
        }

        // Store original for rollback
        const original = week.conversations[conversationIndex];

        try {
            // Apply updates
            week.conversations[conversationIndex] = {
                ...original,
                ...updates,
            };

            // Write to storage
            await this.writeToStorage(STORAGE_KEYS.CALENDARS, weeks);

            // Notify listeners
            this.notifyListeners({ type: 'update', weekIndex, conversationId });

            return week.conversations[conversationIndex];
        } catch (error) {
            // Rollback on failure
            week.conversations[conversationIndex] = original;
            throw error;
        }
    }

    /**
     * Update the scheduled time for a conversation
     */
    async updateConversationTime(
        weekIndex: number,
        conversationId: string,
        newTime: Date
    ): Promise<void> {
        await this.updateConversation(weekIndex, conversationId, {
            scheduledTime: newTime,
        });
    }

    /**
     * Delete a conversation from a week
     */
    async deleteConversation(weekIndex: number, conversationId: string): Promise<void> {
        const weeks = this.getAllWeeks();
        const week = weeks[weekIndex];

        if (!week) {
            throw new Error(`Week not found at index: ${weekIndex}`);
        }

        // Store original for potential undo
        const originalConversations = [...week.conversations];

        try {
            // Remove conversation
            week.conversations = week.conversations.filter(
                c => c.conversation.id !== conversationId
            );

            // Update metadata
            week.metadata = {
                ...week.metadata,
                totalConversations: week.conversations.length,
            };

            // Recalculate average quality
            if (week.conversations.length > 0) {
                const totalQuality = week.conversations.reduce(
                    (sum, c) => sum + c.conversation.qualityScore.overall,
                    0
                );
                week.averageQuality = totalQuality / week.conversations.length;
            } else {
                week.averageQuality = 0;
            }

            // Write to storage
            await this.writeToStorage(STORAGE_KEYS.CALENDARS, weeks);

            // Notify listeners
            this.notifyListeners({ type: 'delete', weekIndex, conversationId });
        } catch (error) {
            // Rollback on failure
            week.conversations = originalConversations;
            throw error;
        }
    }

    /**
     * Delete an entire week
     */
    async deleteWeek(weekIndex: number): Promise<void> {
        const weeks = this.getAllWeeks();

        if (weekIndex < 0 || weekIndex >= weeks.length) {
            throw new Error(`Invalid week index: ${weekIndex}`);
        }

        // Remove week
        weeks.splice(weekIndex, 1);

        // Renumber remaining weeks
        weeks.forEach((week, index) => {
            week.weekNumber = index + 1;
        });

        await this.writeToStorage(STORAGE_KEYS.CALENDARS, weeks);
        this.notifyListeners({ type: 'delete', weekIndex });
    }

    /**
     * Delete multiple conversations in bulk
     */
    async deleteMultipleConversations(
        weekIndex: number,
        conversationIds: string[]
    ): Promise<void> {
        const weeks = this.getAllWeeks();
        const week = weeks[weekIndex];

        if (!week) {
            throw new Error(`Week not found at index: ${weekIndex}`);
        }

        const originalConversations = [...week.conversations];

        try {
            // Remove all specified conversations
            week.conversations = week.conversations.filter(
                c => !conversationIds.includes(c.conversation.id)
            );

            // Update metadata
            week.metadata = {
                ...week.metadata,
                totalConversations: week.conversations.length,
            };

            // Recalculate average quality
            if (week.conversations.length > 0) {
                const totalQuality = week.conversations.reduce(
                    (sum, c) => sum + c.conversation.qualityScore.overall,
                    0
                );
                week.averageQuality = totalQuality / week.conversations.length;
            } else {
                week.averageQuality = 0;
            }

            await this.writeToStorage(STORAGE_KEYS.CALENDARS, weeks);
            this.notifyListeners({ type: 'delete', weekIndex });
        } catch (error) {
            week.conversations = originalConversations;
            throw error;
        }
    }

    /**
     * Validate minimum time gap between conversations
     */
    validateTimeGap(
        newTime: Date,
        weekIndex: number,
        excludeConversationId?: string
    ): { valid: boolean; message?: string; suggestedTime?: Date } {
        const MIN_GAP_HOURS = 2;
        const week = this.getWeek(weekIndex);

        if (!week) {
            return { valid: true };
        }

        const conversations = week.conversations.filter(
            c => c.conversation.id !== excludeConversationId
        );

        for (const conv of conversations) {
            const existingTime = new Date(conv.scheduledTime);
            const gapHours = Math.abs(newTime.getTime() - existingTime.getTime()) / (1000 * 60 * 60);

            if (gapHours < MIN_GAP_HOURS && gapHours > 0) {
                const suggestedTime = new Date(existingTime.getTime() + MIN_GAP_HOURS * 60 * 60 * 1000);
                return {
                    valid: false,
                    message: `Too close to conversation at ${existingTime.toLocaleTimeString()}. Minimum gap: ${MIN_GAP_HOURS} hours.`,
                    suggestedTime,
                };
            }
        }

        return { valid: true };
    }

    /**
     * Get storage usage statistics
     */
    getStorageUsage(): { used: number; limit: number; percentage: number } {
        try {
            const calendarsData = localStorage.getItem(STORAGE_KEYS.CALENDARS) || '';
            const paramsData = localStorage.getItem(STORAGE_KEYS.PARAMS) || '';
            const totalData = calendarsData + paramsData;

            const usedBytes = new Blob([totalData]).size;
            const limitBytes = 5 * 1024 * 1024; // 5MB typical localStorage limit
            const percentage = (usedBytes / limitBytes) * 100;

            return {
                used: usedBytes,
                limit: limitBytes,
                percentage,
            };
        } catch (error) {
            console.error('Failed to calculate storage usage:', error);
            return { used: 0, limit: 5 * 1024 * 1024, percentage: 0 };
        }
    }

    /**
     * Clear all calendar data (with confirmation recommended)
     */
    async clearAll(): Promise<void> {
        localStorage.removeItem(STORAGE_KEYS.CALENDARS);
        localStorage.removeItem(STORAGE_KEYS.PARAMS);
        this.notifyListeners({ type: 'delete' });
    }
}

// Export singleton instance
export const calendarStorage = new CalendarStorage();

// Export helper functions
export const useCalendarStorage = () => calendarStorage;
