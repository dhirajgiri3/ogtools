/**
 * Text Similarity Utilities
 * 
 * Functions for comparing text similarity using various algorithms.
 * Used by Quality Predictor and Safety Validator.
 */

/**
 * Calculate Jaccard similarity between two texts
 * Returns value between 0 (completely different) and 1 (identical)
 */
export function calculateJaccardSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    if (union.size === 0) return 0;

    return intersection.size / union.size;
}

/**
 * Extract n-grams from text
 */
export function getNGrams(text: string, n: number = 2): Set<string> {
    const words = text.toLowerCase().split(/\s+/);
    const ngrams = new Set<string>();

    for (let i = 0; i <= words.length - n; i++) {
        const ngram = words.slice(i, i + n).join(' ');
        ngrams.add(ngram);
    }

    return ngrams;
}

/**
 * Calculate n-gram similarity
 */
export function calculateNGramSimilarity(
    text1: string,
    text2: string,
    n: number = 2
): number {
    const ngrams1 = getNGrams(text1, n);
    const ngrams2 = getNGrams(text2, n);

    if (ngrams1.size === 0 && ngrams2.size === 0) return 1;
    if (ngrams1.size === 0 || ngrams2.size === 0) return 0;

    const intersection = new Set([...ngrams1].filter(x => ngrams2.has(x)));
    const union = new Set([...ngrams1, ...ngrams2]);

    return intersection.size / union.size;
}

/**
 * Calculate cosine similarity between two texts
 */
export function calculateCosineSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);

    // Create word frequency vectors
    const allWords = new Set([...words1, ...words2]);
    const vector1: number[] = [];
    const vector2: number[] = [];

    allWords.forEach(word => {
        vector1.push(words1.filter(w => w === word).length);
        vector2.push(words2.filter(w => w === word).length);
    });

    // Calculate dot product
    const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);

    // Calculate magnitudes
    const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));

    if (magnitude1 === 0 || magnitude2 === 0) return 0;

    return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Calculate overall text similarity (combines multiple methods)
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
    const jaccard = calculateJaccardSimilarity(text1, text2);
    const ngram = calculateNGramSimilarity(text1, text2, 2);
    const cosine = calculateCosineSimilarity(text1, text2);

    // Weighted average (Jaccard: 30%, N-gram: 40%, Cosine: 30%)
    return jaccard * 0.3 + ngram * 0.4 + cosine * 0.3;
}

/**
 * Detect repeated phrases across multiple texts
 */
export function findRepeatedPhrases(
    texts: string[],
    minLength: number = 3
): Map<string, number> {
    const phraseCounts = new Map<string, number>();

    texts.forEach(text => {
        const ngrams = getNGrams(text, minLength);
        ngrams.forEach(phrase => {
            phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
        });
    });

    // Filter to only repeated phrases (appearing in 2+ texts)
    const repeated = new Map<string, number>();
    phraseCounts.forEach((count, phrase) => {
        if (count > 1) {
            repeated.set(phrase, count);
        }
    });

    return repeated;
}

/**
 * Calculate style variance across multiple texts
 * Returns coefficient of variation (higher = more variance = good)
 */
export function calculateStyleVariance(texts: string[]): number {
    if (texts.length < 2) return 1;

    const lengths = texts.map(t => t.split(/\s+/).length);
    const mean = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);

    // Coefficient of variation
    return mean === 0 ? 0 : stdDev / mean;
}
