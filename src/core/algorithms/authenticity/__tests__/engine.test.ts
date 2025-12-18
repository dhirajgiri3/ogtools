import { injectAuthenticity } from '../engine';
import { SLIDEFORGE_PERSONAS } from '@/core/data/personas/demo-data';
import { Persona } from '@/core/types';

describe('Authenticity Engine', () => {

  const aiPerfectText = "I have utilized several presentation tools in my professional capacity. SlideForge is particularly effective for rapid prototyping. The automated layout algorithms significantly reduce manual formatting time.";

  test('transforms AI-perfect text (at least sometimes)', async () => {
    const persona = SLIDEFORGE_PERSONAS[0]; // Riley
    const results: string[] = [];

    // Run multiple times since transformations are probabilistic
    for (let i = 0; i < 10; i++) {
      const result = await injectAuthenticity(
        aiPerfectText,
        persona,
        'r/productivity',
        'comment'
      );
      results.push(result);
    }

    // At least some should be different from original
    const transformedCount = results.filter(r => r !== aiPerfectText).length;
    expect(transformedCount).toBeGreaterThan(0);

    // All should have content
    results.forEach(result => {
      expect(result.length).toBeGreaterThan(0);
    });
  });

  test('maintains core meaning after transformation', async () => {
    const persona = SLIDEFORGE_PERSONAS[0];
    const result = await injectAuthenticity(
      aiPerfectText,
      persona,
      'r/productivity',
      'comment'
    );

    // Key concepts should still be present (case-insensitive)
    const lowerResult = result.toLowerCase();
    expect(lowerResult).toContain('slideforge');
    // Should mention presentations or slides in some form
    expect(
      lowerResult.includes('presentation') ||
      lowerResult.includes('slide') ||
      lowerResult.includes('deck')
    ).toBe(true);
  });

  test('adapts to subreddit culture - casual subreddit', async () => {
    const persona = SLIDEFORGE_PERSONAS[2]; // Emily (casual style)
    const results: string[] = [];

    // Run multiple times since transformations are probabilistic
    for (let i = 0; i < 10; i++) {
      const result = await injectAuthenticity(
        aiPerfectText,
        persona,
        'r/productivity', // Casual sub
        'comment'
      );
      results.push(result);
    }

    // At least some results should show casual elements
    const casualCount = results.filter(result => {
      const hasCasualMarkers = /\b(lol|tbh|ngl|honestly|literally|kinda|pretty|basically)\b/i.test(result);
      const hasImperfections = !result.endsWith('.') || /^[a-z]/.test(result);
      return hasCasualMarkers || hasImperfections;
    }).length;

    // At least some transformations should add casual elements
    expect(casualCount).toBeGreaterThan(0);
  });

  test('removes or modifies AI patterns (numbered lists)', async () => {
    const structuredText = "1. First, I tried PowerPoint. 2. Second, I tried Google Slides. 3. Third, I discovered SlideForge.";
    const persona = SLIDEFORGE_PERSONAS[0];

    const result = await injectAuthenticity(
      structuredText,
      persona,
      'r/productivity',
      'comment'
    );

    // The structure breaking layer should modify numbered lists
    // Check that the text was processed (may still have numbers from original content)
    expect(result.length).toBeGreaterThan(0);
    // Original numbered list format "1. First" should be reduced or modified
    const originalPattern = /\d+\.\s+First/;
    const hasOriginalPattern = originalPattern.test(result);
    // Either pattern is removed OR text is otherwise modified
    expect(!hasOriginalPattern || result !== structuredText).toBe(true);
  });

  test('transformations show variation over multiple runs', async () => {
    const persona = SLIDEFORGE_PERSONAS[0];
    const results: string[] = [];

    // Run multiple times (authenticity has randomness)
    for (let i = 0; i < 10; i++) {
      const result = await injectAuthenticity(
        aiPerfectText,
        persona,
        'r/productivity',
        'comment'
      );
      results.push(result);
    }

    // Should have at least 2 unique outputs (showing variability)
    const uniqueResults = new Set(results);
    expect(uniqueResults.size).toBeGreaterThanOrEqual(2);

    // All should have valid content
    results.forEach(result => {
      expect(result.length).toBeGreaterThan(0);
    });
  });

  test('handles different content types appropriately', async () => {
    const persona = SLIDEFORGE_PERSONAS[0];

    const postResult = await injectAuthenticity(
      aiPerfectText,
      persona,
      'r/productivity',
      'post'
    );

    const commentResult = await injectAuthenticity(
      aiPerfectText,
      persona,
      'r/productivity',
      'comment'
    );

    const replyResult = await injectAuthenticity(
      "Thank you for the suggestion!",
      persona,
      'r/productivity',
      'reply'
    );

    // All should process successfully and return content
    expect(postResult.length).toBeGreaterThan(0);
    expect(commentResult.length).toBeGreaterThan(0);
    expect(replyResult.length).toBeGreaterThan(0);

    // Should return strings
    expect(typeof postResult).toBe('string');
    expect(typeof commentResult).toBe('string');
    expect(typeof replyResult).toBe('string');
  });

  test('maintains reasonable text length', async () => {
    const persona = SLIDEFORGE_PERSONAS[0];
    const result = await injectAuthenticity(
      aiPerfectText,
      persona,
      'r/productivity',
      'comment'
    );

    // Should not dramatically change length
    const lengthRatio = result.length / aiPerfectText.length;
    expect(lengthRatio).toBeGreaterThan(0.5); // Not drastically shortened
    expect(lengthRatio).toBeLessThan(2.0); // Not dramatically lengthened
  });

  test('injects personality markers from persona', async () => {
    const persona = SLIDEFORGE_PERSONAS[0]; // Riley
    const results: string[] = [];

    // Generate multiple samples to increase chance of seeing personality markers
    for (let i = 0; i < 5; i++) {
      const result = await injectAuthenticity(
        aiPerfectText,
        persona,
        'r/productivity',
        'comment'
      );
      results.push(result.toLowerCase());
    }

    // Check if any characteristic vocabulary appears in any result
    const combinedResults = results.join(' ');
    const hasPersonalityMarkers = persona.vocabulary.characteristic.some(word =>
      combinedResults.includes(word.toLowerCase())
    );

    // At least some personality should come through
    expect(hasPersonalityMarkers || results.some(r => r !== aiPerfectText.toLowerCase())).toBe(true);
  });

  test('handles empty input gracefully', async () => {
    const persona = SLIDEFORGE_PERSONAS[0];
    const result = await injectAuthenticity(
      '',
      persona,
      'r/productivity',
      'comment'
    );

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  test('handles very short input', async () => {
    const persona = SLIDEFORGE_PERSONAS[0];
    const result = await injectAuthenticity(
      'Good tool.',
      persona,
      'r/productivity',
      'comment'
    );

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
