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
import { TabBar as RNTabBar } from 'react-native-tab-view';
import styled from 'styled-components/native';

// Components
import Text from 'components/modern/Text';

// Utils
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

export type TabViewItem = {|
  key: string,
  title: string,
|};

type Props = {|
  items: TabViewItem[],
  tabIndex: number,
  onTabIndexChange: (index: number) => mixed,
  scrollEnabled?: boolean,
|};

function TabBar({ items, tabIndex, onTabIndexChange, scrollEnabled }: Props) {
  const colors = useThemeColors();

  const tabBarStyle = { backgroundColor: colors.background, shadowColor: 'transparent' };
  const tabStyle = [scrollEnabled && styles.tabStyleScrollEnabled];

  return (
    <RNTabBar
      navigationState={{ index: tabIndex, routes: items }}
      onTabPress={(scene) => console.log('AAA', scene)}
      scrollEnabled={scrollEnabled}
      style={tabBarStyle}
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
}

export default TabBar;

const styles = {
  tabStyleScrollEnabled: {
    width: 'auto',
  },
};

const TabLabelWrapper = styled.View`
  padding: 0 ${spacing.medium / 2}px;
`;

const TabIndicator = styled.View`
  margin-top: 3px;
  border-top-width: 6px;
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
  border-color: ${({ theme }) => theme.colors.primaryAccent130};
`;
