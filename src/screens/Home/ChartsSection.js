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
import { View } from 'react-native';
import PagerView from 'react-native-pager-view';

// Types
import type { CategoryBalance, ChainBalance } from 'models/Home';

// Local
import AssetPieChart from './components/AssetPieChart';
import ChainPieChart from './components/ChainPieChart';

type Props = {|
  categoryBalances: CategoryBalance,
  chainBalances: ChainBalance,
|};

function ChartsSection({ categoryBalances, chainBalances }: Props) {
  return (
    <PagerView style={styles.pageView} initialPage={0}>
      <View key="1">
        <AssetPieChart categoryBalances={categoryBalances} />
      </View>
      <View key="2">
        <ChainPieChart chainBalances={chainBalances} />
      </View>
    </PagerView>
  );
}

export default ChartsSection;

const styles = {
  pageView: {
    height: 300,
  },
};