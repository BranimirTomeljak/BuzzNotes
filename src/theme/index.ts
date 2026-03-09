export const colors = {
  primary: '#B8860B',
  primaryLight: '#D4A530',
  background: '#FAFAF7',
  surface: '#F3F1EC',
  card: '#FFFFFF',
  text: '#1C1B1F',
  textSecondary: '#5F6368',
  textLight: '#9AA0A6',
  border: '#E0DDD7',
  white: '#FFFFFF',
  black: '#000000',

  priorityHigh: '#EF5350',
  priorityHighBg: '#FFEBEE',
  priorityHighTint: '#FFECEC',
  priorityMedium: '#F9A825',
  priorityMediumBg: '#FEF7CD',
  priorityMediumTint: '#FFF8E0',
  priorityLow: '#5C9CE6',
  priorityLowBg: '#EBF3FE',
  priorityLowTint: '#ECF2FF',
  solved: '#4CAF50',
  solvedBg: '#E8F5E9',

  fab: '#D4A530',
  danger: '#D32F2F',
  dangerBg: '#FFEBEE',

  tabBar: '#FFFFFF',
  tabActive: '#B8860B',
  tabInactive: '#9AA0A6',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: colors.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text,
  },
  body: {
    fontSize: 18,
    fontWeight: '400' as const,
    color: colors.text,
  },
  bodySmall: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.textLight,
  },
  button: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  fab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
};
