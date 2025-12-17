import { getSubredditProfile, SUBREDDIT_PROFILES } from '../profiles';

describe('Subreddit Profiler', () => {

  test('returns correct profile for known subreddit', () => {
    const profile = getSubredditProfile('r/productivity');

    expect(profile.name).toBe('r/productivity');
    expect(profile.culture).toBeDefined();
    expect(profile.formalityLevel).toBeGreaterThanOrEqual(0);
    expect(profile.formalityLevel).toBeLessThanOrEqual(1);
    expect(Array.isArray(profile.acceptableMarkers)).toBe(true);
  });

  test('returns default profile for unknown subreddit', () => {
    const profile = getSubredditProfile('r/unknownsubreddit');

    expect(profile.name).toBe('r/unknownsubreddit');
    expect(profile.culture).toBeDefined();
    expect(profile.formalityLevel).toBeGreaterThanOrEqual(0);
    expect(profile.formalityLevel).toBeLessThanOrEqual(1);
  });

  test('all profiles have required fields', () => {
    Object.values(SUBREDDIT_PROFILES).forEach(profile => {
      expect(profile.name).toBeDefined();
      expect(profile.culture).toBeDefined();
      expect(profile.formalityLevel).toBeGreaterThanOrEqual(0);
      expect(profile.formalityLevel).toBeLessThanOrEqual(1);
      expect(Array.isArray(profile.acceptableMarkers)).toBe(true);
      expect(Array.isArray(profile.avoidMarkers)).toBe(true);
      expect(profile.moderationLevel).toBeDefined();
      expect(Array.isArray(profile.commonTopics)).toBe(true);
      expect(profile.promotionTolerance).toBeDefined();
    });
  });

  test('formality levels vary across subreddits', () => {
    const profiles = Object.values(SUBREDDIT_PROFILES);
    const formalityLevels = profiles.map(p => p.formalityLevel);

    // Check that we have variety in formality levels
    const uniqueLevels = new Set(formalityLevels);
    expect(uniqueLevels.size).toBeGreaterThan(1);

    // Check that all levels are in valid range
    formalityLevels.forEach(level => {
      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThanOrEqual(1);
    });
  });

  test('acceptable markers appropriate for culture', () => {
    const profiles = Object.values(SUBREDDIT_PROFILES);

    profiles.forEach(profile => {
      if (profile.culture === 'casual') {
        // Casual subs should allow casual markers
        const hasCasualMarkers = profile.acceptableMarkers.some(marker =>
          ['lol', 'lmao', 'tbh', 'ngl'].includes(marker.toLowerCase())
        );
        expect(hasCasualMarkers).toBe(true);
      }

      if (profile.formalityLevel > 0.7) {
        // Professional subs should avoid casual markers
        const hasCasualMarkers = profile.acceptableMarkers.some(marker =>
          ['lol', 'lmao'].includes(marker.toLowerCase())
        );
        expect(hasCasualMarkers).toBe(false);
      }
    });
  });

  test('moderation levels are valid', () => {
    const validLevels = ['low', 'relaxed', 'moderate', 'medium', 'high', 'very_high'];

    Object.values(SUBREDDIT_PROFILES).forEach(profile => {
      expect(validLevels).toContain(profile.moderationLevel);
    });
  });

  test('promotion tolerance is valid', () => {
    const validTolerance = ['zero', 'low', 'moderate', 'medium', 'high'];

    Object.values(SUBREDDIT_PROFILES).forEach(profile => {
      expect(validTolerance).toContain(profile.promotionTolerance);
    });
  });

  test('common topics are not empty for each subreddit', () => {
    Object.values(SUBREDDIT_PROFILES).forEach(profile => {
      expect(profile.commonTopics.length).toBeGreaterThan(0);
    });
  });
});
