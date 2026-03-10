import { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SceneRendererProps, NavigationState } from 'react-native-tab-view';
import { colors, spacing } from '../theme';

type Route = { key: string; title: string };

export function useDetailTabBar() {
  const renderTabBar = useCallback(
    (props: SceneRendererProps & { navigationState: NavigationState<Route> }) => {
      const { navigationState, jumpTo } = props;
      return (
        <View style={pillStyles.container}>
          {navigationState.routes.map((route, i) => {
            const isActive = navigationState.index === i;
            return (
              <TouchableOpacity
                key={route.key}
                style={[pillStyles.pill, isActive && pillStyles.pillActive]}
                onPress={() => jumpTo(route.key)}
                activeOpacity={0.7}
              >
                <Text style={[pillStyles.label, isActive && pillStyles.labelActive]}>
                  {route.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    },
    [],
  );

  return { renderTabBar };
}

const pillStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  pillActive: {
    backgroundColor: colors.primaryTint,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.tabInactive,
  },
  labelActive: {
    color: colors.primaryDark,
  },
});
