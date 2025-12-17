import { WeekCalendar, ScheduledConversation } from '@/core/types';
import { format, parseISO } from 'date-fns';

/**
 * Export Helpers
 *
 * Utilities for exporting calendar data in various formats
 */

/**
 * Safely parse date from string or Date object
 */
function safeParseDate(date: Date | string): Date {
    if (typeof date === 'string') {
        return parseISO(date);
    }
    return date;
}

/**
 * Safely format CSV field by escaping quotes and commas
 */
function escapeCSVField(field: string | number): string {
    if (typeof field === 'number') {
        return String(field);
    }
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
}

/**
 * Export calendar as Markdown
 */
export function exportAsMarkdown(calendars: WeekCalendar[]): string {
    if (!calendars || calendars.length === 0) {
        return '# Reddit Content Calendar Export\n\nNo data available.';
    }

    let markdown = `# Reddit Content Calendar Export\n\n`;
    markdown += `**Exported:** ${format(new Date(), 'PPpp')}\n`;
    markdown += `**Total Weeks:** ${calendars.length}\n`;

    const totalConvs = calendars.reduce((sum, cal) => {
        const count = cal?.conversations?.length || 0;
        return sum + count;
    }, 0);
    markdown += `**Total Conversations:** ${totalConvs}\n\n`;
    markdown += `---\n\n`;

    calendars.forEach((calendar, idx) => {
        if (!calendar?.conversations || !Array.isArray(calendar.conversations)) {
            return;
        }

        markdown += `## Week ${calendar.weekNumber || idx + 1}\n\n`;
        markdown += `- **Conversations:** ${calendar.conversations.length}\n`;
        markdown += `- **Average Quality:** ${(calendar.averageQuality || 0).toFixed(1)}/100\n`;
        markdown += `- **Safety Status:** ${calendar.safetyReport?.passed ? '✅ Passed' : '⚠️ Issues Detected'}\n\n`;

        // Sort by scheduled time
        const sorted = [...calendar.conversations].sort(
            (a, b) => safeParseDate(a.scheduledTime).getTime() - safeParseDate(b.scheduledTime).getTime()
        );

        sorted.forEach((scheduled, convIdx) => {
            markdown += generateConversationMarkdown(scheduled, convIdx + 1);
            markdown += `\n---\n\n`;
        });
    });

    return markdown;
}

/**
 * Generate markdown for a single conversation
 */
function generateConversationMarkdown(scheduled: ScheduledConversation, index: number): string {
    if (!scheduled || !scheduled.conversation) {
        return `### ${index}. Invalid conversation data\n\n`;
    }

    const conv = scheduled.conversation;
    const scheduledDate = safeParseDate(scheduled.scheduledTime);

    let md = `### ${index}. ${format(scheduledDate, 'EEEE, MMM d')} at ${format(scheduledDate, 'h:mm a')}\n\n`;

    // Metadata
    md += `**Subreddit:** r/${conv.subreddit || 'unknown'}  \n`;
    md += `**Quality Score:** ${conv.qualityScore?.overall || 0}/100 (${conv.qualityScore?.grade || 'unknown'})  \n`;
    md += `**Arc Type:** ${conv.arcType || 'unknown'}  \n`;
    md += `**Keywords:** ${conv.post?.keywords?.join(', ') || 'none'}  \n\n`;

    // Original Post
    md += `#### 📝 Original Post\n\n`;
    md += `**Posted by:** u/${conv.post?.persona?.name?.replace(' ', '_').toLowerCase() || 'unknown'} (${conv.post?.persona?.role || 'unknown'})  \n`;
    md += `**Emotion:** ${conv.post?.emotion || 'unknown'}  \n\n`;
    md += `> ${(conv.post?.content || '').split('\n').join('\n> ')}\n\n`;

    // Comments
    if (conv.topLevelComments && conv.topLevelComments.length > 0) {
        md += `#### 💬 Comments (${conv.topLevelComments.length})\n\n`;

        conv.topLevelComments.forEach((comment, idx) => {
            const commentTime = scheduled.commentTimings && scheduled.commentTimings[idx]
                ? safeParseDate(scheduled.commentTimings[idx])
                : scheduledDate;
            const delayMinutes = Math.round((commentTime.getTime() - scheduledDate.getTime()) / (1000 * 60));

            md += `##### Comment ${idx + 1} - ${delayMinutes} minutes later\n\n`;
            md += `**By:** u/${comment.persona?.name?.replace(' ', '_').toLowerCase() || 'unknown'}  \n`;
            md += `**Purpose:** ${comment.purpose || 'unknown'}  \n`;
            if (comment.productMention) {
                md += `**Product Mention:** ✓ Yes  \n`;
            }
            md += `\n`;
            md += `${comment.content || ''}\n\n`;

            // Replies to this comment
            const replies = conv.replies?.filter(r => r.parentCommentId === comment.id) || [];
            if (replies.length > 0) {
                md += `**Replies:**\n\n`;
                replies.forEach(reply => {
                    md += `- *${reply.persona?.name || 'unknown'}${reply.replyType === 'op_followup' ? ' (OP)' : ''}:* ${reply.content || ''}\n`;
                });
                md += `\n`;
            }
        });
    }

    // Quality Breakdown
    if (conv.qualityScore) {
        md += `#### 📊 Quality Analysis\n\n`;
        md += `| Dimension | Score | Max |\n`;
        md += `|-----------|-------|-----|\n`;
        md += `| Subreddit Relevance | ${conv.qualityScore.dimensions?.subredditRelevance || 0} | 20 |\n`;
        md += `| Problem Specificity | ${conv.qualityScore.dimensions?.problemSpecificity || 0} | 20 |\n`;
        md += `| Authenticity | ${conv.qualityScore.dimensions?.authenticity || 0} | 25 |\n`;
        md += `| Value-First | ${conv.qualityScore.dimensions?.valueFirst || 0} | 20 |\n`;
        md += `| Engagement Design | ${conv.qualityScore.dimensions?.engagementDesign || 0} | 15 |\n\n`;

        // Strengths
        if (conv.qualityScore.strengths && conv.qualityScore.strengths.length > 0) {
            md += `**✅ Strengths:**\n`;
            conv.qualityScore.strengths.forEach(strength => {
                md += `- ${strength.message || ''}\n`;
            });
            md += `\n`;
        }

        // Issues
        if (conv.qualityScore.issues && conv.qualityScore.issues.length > 0) {
            md += `**⚠️ Issues:**\n`;
            conv.qualityScore.issues.forEach(issue => {
                md += `- [${(issue.severity || 'unknown').toUpperCase()}] ${issue.message || ''}\n`;
            });
            md += `\n`;
        }
    }

    return md;
}

/**
 * Export calendar as CSV
 */
export function exportAsCSV(calendars: WeekCalendar[]): string {
    if (!calendars || calendars.length === 0) {
        return 'Week,Day,Date,Time,Subreddit,Quality Score,Arc Type,Poster,Post Content,Comments Count,Has Product Mention,Keywords,Safety Passed\n';
    }

    const headers = [
        'Week', 'Day', 'Date', 'Time', 'Subreddit', 'Quality Score', 'Arc Type',
        'Poster', 'Post Content', 'Comments Count', 'Has Product Mention', 'Keywords', 'Safety Passed'
    ];

    let csv = headers.join(',') + '\n';

    calendars.forEach((calendar) => {
        if (!calendar?.conversations || !Array.isArray(calendar.conversations)) {
            return;
        }

        calendar.conversations.forEach((scheduled) => {
            if (!scheduled?.conversation) {
                return;
            }

            const conv = scheduled.conversation;
            const date = safeParseDate(scheduled.scheduledTime);

            const row = [
                calendar.weekNumber || 0,
                format(date, 'EEEE'),
                format(date, 'yyyy-MM-dd'),
                format(date, 'HH:mm'),
                escapeCSVField(`r/${conv.subreddit || 'unknown'}`),
                conv.qualityScore?.overall || 0,
                escapeCSVField(conv.arcType || 'unknown'),
                escapeCSVField(conv.post?.persona?.name || 'unknown'),
                escapeCSVField(conv.post?.content || ''),
                conv.topLevelComments?.length || 0,
                conv.topLevelComments?.some(c => c.productMention) ? 'Yes' : 'No',
                escapeCSVField(conv.post?.keywords?.join(', ') || ''),
                calendar.safetyReport?.passed ? 'Yes' : 'No'
            ];

            csv += row.join(',') + '\n';
        });
    });

    return csv;
}

/**
 * Export full thread as plain text (Reddit-style)
 */
export function exportThreadAsText(scheduled: ScheduledConversation): string {
    if (!scheduled || !scheduled.conversation) {
        return 'Invalid conversation data';
    }

    const conv = scheduled.conversation;
    const scheduledDate = safeParseDate(scheduled.scheduledTime);

    let text = `=================================================================\n`;
    text += `r/${conv.subreddit || 'unknown'} - ${format(scheduledDate, 'EEEE, MMMM d, yyyy \'at\' h:mm a')}\n`;
    text += `Quality: ${conv.qualityScore?.overall || 0}/100 | Arc: ${conv.arcType || 'unknown'}\n`;
    text += `=================================================================\n\n`;

    // Original Post
    text += `[POST] u/${conv.post?.persona?.name?.replace(' ', '_').toLowerCase() || 'unknown'}\n`;
    text += `${conv.post?.content || ''}\n\n`;
    text += `---\n\n`;

    // Comments
    if (conv.topLevelComments && conv.topLevelComments.length > 0) {
        conv.topLevelComments.forEach((comment, idx) => {
            const commentTime = scheduled.commentTimings && scheduled.commentTimings[idx]
                ? safeParseDate(scheduled.commentTimings[idx])
                : scheduledDate;
            const delayMinutes = Math.round((commentTime.getTime() - scheduledDate.getTime()) / (1000 * 60));

            text += `[COMMENT - ${delayMinutes}min later] u/${comment.persona?.name?.replace(' ', '_').toLowerCase() || 'unknown'}`;
            if (comment.productMention) {
                text += ` [PRODUCT MENTION]`;
            }
            text += `\n${comment.content || ''}\n`;

            // Replies
            const replies = conv.replies?.filter(r => r.parentCommentId === comment.id) || [];
            replies.forEach(reply => {
                const isOP = reply.replyType === 'op_followup';
                text += `  ↳ [REPLY] u/${reply.persona?.name?.replace(' ', '_').toLowerCase() || 'unknown'}${isOP ? ' [OP]' : ''}\n`;
                text += `    ${reply.content || ''}\n`;
            });

            text += `\n`;
        });
    }

    return text;
}

/**
 * Download helper - triggers browser download
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
    try {
        const mimeTypeWithCharset = mimeType.includes('charset')
            ? mimeType
            : `${mimeType};charset=utf-8`;

        const blob = new Blob([content], { type: mimeTypeWithCharset });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 500);

    } catch (error) {
        console.error('Download failed:', error);
        alert('Failed to download file. Please try again.');
    }
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix: string, extension: string): string {
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    return `${prefix}-${timestamp}.${extension}`;
}
