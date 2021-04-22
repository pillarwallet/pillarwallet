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
import { Dimensions } from 'react-native';
import { TabView as RNTabView, TabBar } from 'react-native-tab-view';

// Components
import Text from 'components/modern/Text';

export type TabViewItem = {|
  key: string,
  title: string,
  component: React.ComponentType<mixed>,
|};

type Props = {|
  items: TabViewItem[],
  tabIndex: number,
  onTabIndexChange: (index: number) => mixed,
  scrollEnabled?: boolean,
  swipeEnabled?: boolean,
|};

function TabView({ items, tabIndex, onTabIndexChange, scrollEnabled, swipeEnabled }: Props) {
  const [internalIndex, setInternalIndex] = React.useState(0);

  const renderScene = ({ route }: { route: TabViewItem }) => {
    return <route.component />;
  };

  const index = tabIndex ?? internalIndex;
  const onIndexChange = onTabIndexChange ?? setInternalIndex;

  const { width } = Dimensions.get('window');

  const renderTabBar = (props: mixed) => (
    <TabBar
      {...props}
      scrollEnabled={scrollEnabled}
      tabStyle={[scrollEnabled && styles.tabStyleScrollEnabled]}
      renderLabel={({ route, focused }) => (
        <Text numberOfLines={1} adjustsFontSizeToFit>
          {route.title}
        </Text>
      )}
    />
  );

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
  tabStyleScrollEnabled: {
    width: 'auto',
  },
};
