import { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { TabBar, SceneRendererProps, NavigationState } from 'react-native-tab-view';
import { colors } from '../theme';

type Route = { key: string; title: string };

export function useDetailTabBar(routes: Route[]) {
  const tabOptions = useMemo(
    () =>
      Object.fromEntries(
        routes.map((route) => [route.key, { labelStyle: detailTabStyles.tabLabel }]),
      ),
    [routes],
  );

  const renderTabBar = useCallback(
    (props: SceneRendererProps & { navigationState: NavigationState<Route> }) => (
      <TabBar
        {...props}
        style={detailTabStyles.tabBar}
        indicatorStyle={detailTabStyles.tabIndicator}
        activeColor={colors.primary}
        inactiveColor={colors.textLight}
        options={tabOptions}
      />
    ),
    [tabOptions],
  );

  return { tabOptions, renderTabBar };
}

export const detailTabStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  tabIndicator: {
    backgroundColor: colors.primary,
    height: 2,
  },
  tabLabel: {
    fontWeight: '600',
    fontSize: 14,
    textTransform: 'none',
  },
});
