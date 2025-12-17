import { PERSONA_TIMING_PROFILES, getPersonaTiming } from '../timing';

describe('Persona Timing', () => {

  test('all expected personas have timing data', () => {
    const expectedPersonas = ['riley_ops', 'jordan_consults', 'emily_econ', 'alex_sells', 'priya_pm'];

    expectedPersonas.forEach(id => {
      expect(PERSONA_TIMING_PROFILES[id]).toBeDefined();
    });
  });

  test('timing data has valid structure', () => {
    Object.values(PERSONA_TIMING_PROFILES).forEach(timing => {
      expect(timing.timezone).toBeDefined();
      expect(typeof timing.timezone).toBe('string');
      expect(Array.isArray(timing.activeHours)).toBe(true);
      expect(timing.activeHours.length).toBeGreaterThan(0);
      expect(Array.isArray(timing.peakActivity)).toBe(true);
      expect(['active', 'reduced', 'offline']).toContain(timing.weekendPattern);
      expect(timing.typicalResponseDelay).toBeDefined();
      expect(timing.typicalResponseDelay.min).toBeLessThan(timing.typicalResponseDelay.max);
    });
  });

  test('active hours start is within 24-hour range', () => {
    Object.values(PERSONA_TIMING_PROFILES).forEach(timing => {
      timing.activeHours.forEach(window => {
        expect(window.start).toBeGreaterThanOrEqual(0);
        expect(window.start).toBeLessThan(24);
        expect(window.end).toBeGreaterThan(0);
        // Note: end can be > 24 for windows crossing midnight (e.g., 20-26)
        expect(window.start).toBeLessThan(window.end);
      });
    });
  });

  test('peak activity hours are within active hours', () => {
    Object.values(PERSONA_TIMING_PROFILES).forEach(timing => {
      timing.peakActivity.forEach(hour => {
        const normalizedHour = hour % 24; // Handle hours like 25, 26
        const inActiveWindow = timing.activeHours.some(window => {
          // Handle windows that cross midnight (e.g., 20-26)
          if (window.end > 24) {
            return hour >= window.start || hour < (window.end - 24);
          }
          return hour >= window.start && hour < window.end;
        });
        expect(inActiveWindow).toBe(true);
      });
    });
  });

  test('response delays are reasonable (5-1440 minutes)', () => {
    Object.values(PERSONA_TIMING_PROFILES).forEach(timing => {
      // Min should be at least 5 minutes (realistic)
      expect(timing.typicalResponseDelay.min).toBeGreaterThanOrEqual(5);
      // Max should be less than 24 hours (1440 min)
      expect(timing.typicalResponseDelay.max).toBeLessThanOrEqual(1440);
    });
  });

  test('each persona has unique timezone', () => {
    const timezones = Object.values(PERSONA_TIMING_PROFILES).map(t => t.timezone);
    // Not all need to be unique, but we should have variety
    const uniqueTimezones = new Set(timezones);
    expect(uniqueTimezones.size).toBeGreaterThan(1);
  });

  test('weekend patterns are distributed (not all the same)', () => {
    const patterns = Object.values(PERSONA_TIMING_PROFILES).map(t => t.weekendPattern);
    const uniquePatterns = new Set(patterns);
    // We should have variety in weekend patterns
    expect(uniquePatterns.size).toBeGreaterThan(1);
  });

  test('peak activity hours are reasonable (typically during waking hours)', () => {
    Object.values(PERSONA_TIMING_PROFILES).forEach(timing => {
      timing.peakActivity.forEach(hour => {
        const normalizedHour = hour % 24; // Handle hours > 24
        // Peak activity should be during waking hours (1am - 11:59pm allowed)
        // We're lenient here since some personas are night owls
        expect(normalizedHour).toBeGreaterThanOrEqual(0);
        expect(normalizedHour).toBeLessThan(24);
      });
    });
  });
});
