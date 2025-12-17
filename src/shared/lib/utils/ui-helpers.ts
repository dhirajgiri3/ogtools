/**
 * UI Helper Utilities
 * 
 * Functions for consistent styling across components.
 */

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type QualityGrade = 'excellent' | 'good' | 'fair' | 'poor';

/**
 * Get color classes for risk level
 */
export function getRiskColor(risk: RiskLevel): string {
    const colors: Record<RiskLevel, string> = {
        low: 'text-green-600 bg-green-50 border-green-200',
        medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        high: 'text-orange-600 bg-orange-50 border-orange-200',
        critical: 'text-red-600 bg-red-50 border-red-200',
    };
    return colors[risk];
}

/**
 * Get risk icon
 */
export function getRiskIcon(risk: RiskLevel): string {
    const icons: Record<RiskLevel, string> = {
        low: '🟢',
        medium: '🟡',
        high: '🟠',
        critical: '🔴',
    };
    return icons[risk];
}

/**
 * Get quality grade from score
 */
export function getQualityGrade(score: number): QualityGrade {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
}

/**
 * Get badge style for quality grade
 */
export function getGradeBadgeStyle(grade: QualityGrade): string {
    const styles: Record<QualityGrade, string> = {
        excellent: 'bg-green-100 text-green-800 border-green-200',
        good: 'bg-blue-100 text-blue-800 border-blue-200',
        fair: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        poor: 'bg-red-100 text-red-800 border-red-200',
    };
    return styles[grade];
}

/**
 * Get grade icon
 */
export function getGradeIcon(grade: QualityGrade): string {
    const icons: Record<QualityGrade, string> = {
        excellent: '⭐',
        good: '✓',
        fair: '⚠',
        poor: '✗',
    };
    return icons[grade];
}

/**
 * Format quality score for display
 */
export function formatQualityScore(score: number): string {
    return `${score.toFixed(0)}/100`;
}

/**
 * Get color for progress bar based on percentage
 */
export function getProgressColor(percentage: number): string {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format relative time (e.g., "5 min ago")
 */
export function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format scheduled time
 */
export function formatScheduledTime(date: Date): string {
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Get subreddit display name (without r/)
 */
export function getSubredditDisplayName(subreddit: string): string {
    return subreddit.replace(/^r\//, '');
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Generate random pastel color for avatars
 */
export function getAvatarColor(name: string): string {
    const colors = [
        'bg-blue-200 text-blue-800',
        'bg-green-200 text-green-800',
        'bg-purple-200 text-purple-800',
        'bg-pink-200 text-pink-800',
        'bg-yellow-200 text-yellow-800',
        'bg-indigo-200 text-indigo-800',
        'bg-teal-200 text-teal-800',
        'bg-orange-200 text-orange-800',
    ];

    // Use name hash to get consistent color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
}

/**
 * Format count with abbreviation (e.g., 1.2k)
 */
export function formatCount(count: number): string {
    if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
}

/**
 * Get arc type display name
 */
export function getArcTypeDisplayName(arcType: string): string {
    const names: Record<string, string> = {
        discovery: 'Discovery',
        comparison: 'Comparison',
        problemSolver: 'Problem Solver',
    };
    return names[arcType] || arcType;
}

/**
 * Get arc type color
 */
export function getArcTypeColor(arcType: string): string {
    const colors: Record<string, string> = {
        discovery: 'bg-purple-100 text-purple-800',
        comparison: 'bg-blue-100 text-blue-800',
        problemSolver: 'bg-orange-100 text-orange-800',
    };
    return colors[arcType] || 'bg-gray-100 text-gray-800';
}
