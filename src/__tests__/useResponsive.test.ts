import { getResponsiveValues } from '../hooks/useResponsive';

describe('getResponsiveValues', () => {
  it('returns phone values for width < 600', () => {
    const result = getResponsiveValues(400);
    expect(result.isTablet).toBe(false);
    expect(result.columns).toBe(1);
    expect(result.photoColumns).toBe(2);
    expect(result.scale).toBe(1);
    expect(result.contentMaxWidth).toBeUndefined();
  });

  it('returns tablet values for width >= 600', () => {
    const result = getResponsiveValues(1000);
    expect(result.isTablet).toBe(true);
    expect(result.columns).toBe(2);
    expect(result.photoColumns).toBe(3);
    expect(result.scale).toBe(1.15);
    expect(result.contentMaxWidth).toBe(800);
  });

  it('returns tablet values at exactly 600', () => {
    const result = getResponsiveValues(600);
    expect(result.isTablet).toBe(true);
    expect(result.columns).toBe(2);
  });
});
