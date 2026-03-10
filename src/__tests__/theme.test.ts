import { colors, borderRadius, shadows } from '../theme';

describe('theme', () => {
  it('has Organic Soft color palette', () => {
    expect(colors.background).toBe('#FAF7F0');
    expect(colors.surface).toBe('#F0EBE0');
    expect(colors.text).toBe('#3D3521');
    expect(colors.textSecondary).toBe('#6B5F4E');
    expect(colors.textLight).toBe('#A09780');
    expect(colors.border).toBe('#E8E2D6');
    expect(colors.tabActive).toBe('#8B6914');
    expect(colors.tabInactive).toBe('#A09780');
  });

  it('has new primaryTint and primaryDark tokens', () => {
    expect(colors.primaryTint).toBe('rgba(184,134,11,0.12)');
    expect(colors.primaryDark).toBe('#8B6914');
  });

  it('has xl border radius for cards', () => {
    expect(borderRadius.xl).toBe(20);
    expect(borderRadius.lg).toBe(16);
  });

  it('has warm card shadow', () => {
    expect(shadows.card.shadowColor).toBe('#8B6914');
    expect(shadows.card.shadowOpacity).toBe(0.08);
  });
});
