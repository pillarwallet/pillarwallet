// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

import * as React from 'react';
import { Platform, Dimensions } from 'react-native';
import { TabView as RNTabView, TabBar } from 'react-native-tab-view';
import styled from 'styled-components/native';

// Components
import Text from 'components/core/Text';

// Utils
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

/**
 * Use `render` prop to pass custom props to tab component.
 * Creating a new function and assigning it to `component` prop will cause mount/unmount of tab component on every
 * render.
 *
 * Use `component` prop only for passing component **type** (functional or class).
 *
 * More details: https://github.com/satya164/react-native-tab-view#renderscene-required
 */
export type TabViewItem = {|
  key: string,
  title: string,
  render?: () => React.Element<any>,
  component?: React.ComponentType<mixed>,
|};

type Props = {|
  items: TabViewItem[],
  tabIndex: number,
  onTabIndexChange: (index: number) => mixed,
  scrollEnabled?: boolean,
  swipeEnabled?: boolean,
  rest?: any,
  isNavigateToHome?: boolean,
|};

function TabView({ items, tabIndex, onTabIndexChange, scrollEnabled, swipeEnabled, ...rest }: Props) {
  const colors = useThemeColors();

  const [internalIndex, setInternalIndex] = React.useState(0);

  const renderScene = ({ route }: { route: TabViewItem }) => {
    if (route.render) {
      return route.render();
    }

    if (route.component) {
      return <route.component {...rest} />;
    }

    return null;
  };

  const index = tabIndex ?? internalIndex;
  const onIndexChange = onTabIndexChange ?? setInternalIndex;

  const { width } = Dimensions.get('window');

  const renderTabBar = (props: mixed) => {
    const tabBarStyle = { backgroundColor: colors.background };
    const tabStyle = [scrollEnabled && styles.tabScrollEnabled];

    return (
      <TabBar
        {...props}
        scrollEnabled={scrollEnabled}
        style={[styles.tabBar, tabBarStyle]}
        tabStyle={tabStyle}
        renderLabel={({ route, focused }) => (
          <TabLabelWrapper>
            <Text color={focused ? colors.text : colors.secondaryText}>{route.title}</Text>
            {focused && <TabIndicator />}
          </TabLabelWrapper>
        )}
        renderIndicator={() => null}
      />
    );
  };

  return (
    <RNTabView
      navigationState={{ index, routes: items }}
      renderScene={renderScene}
      renderTabBar={renderTabBar}
      onIndexChange={onIndexChange}
      initialLayout={{ width }}
      scrollEnabled={scrollEnabled}
      swipeEnabled={swipeEnabled}
      lazy
    />
  );
}

export default TabView;

const styles = {
  tabBar: {
    shadowColor: 'transparent',
    elevation: 0,
  },
  tabScrollEnabled: {
    width: 'auto',
  },
};

const TabLabelWrapper = styled.View`
  padding: 0 ${spacing.medium / 2}px;
`;

const TabIndicator = styled.View`
  margin-top: 3px;
  border-top-width: ${Platform.OS === 'android' ? '3px' : '6px'};
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
  border-color: ${({ theme }) => theme.colors.tabUnderline};
`;
