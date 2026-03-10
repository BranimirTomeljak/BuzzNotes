import { useWindowDimensions } from 'react-native';

const TABLET_BREAKPOINT = 600;

export interface ResponsiveValues {
  isTablet: boolean;
  columns: number;
  photoColumns: number;
  scale: number;
  contentMaxWidth: number | undefined;
}

export function getResponsiveValues(width: number): ResponsiveValues {
  const isTablet = width >= TABLET_BREAKPOINT;
  return {
    isTablet,
    columns: isTablet ? 2 : 1,
    photoColumns: isTablet ? 3 : 2,
    scale: isTablet ? 1.15 : 1,
    contentMaxWidth: isTablet ? 800 : undefined,
  };
}

export function useResponsive(): ResponsiveValues {
  const { width } = useWindowDimensions();
  return getResponsiveValues(width);
}
