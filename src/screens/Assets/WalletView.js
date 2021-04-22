// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

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

// Components
import TabView from 'components/modern/TabView';

const FirstRoute = () => <View style={{ flex: 1, backgroundColor: '#ff4081' }} />;

const SecondRoute = () => <View style={{ flex: 1, backgroundColor: '#673ab7' }} />;


type Props = { };

function WalletView(props: Props) {
  const [tabIndex, setTabIndex] = React.useState(0);

  const items = [
    { key: 'wallet', title: 'Wallet', component: FirstRoute },
    { key: 'deposits', title: 'Deposits', component: SecondRoute },
    { key: 'investments', title: 'Investments', component: FirstRoute },
    { key: 'liquidityPools', title: 'Liquidity Pools', component: SecondRoute },
    { key: 'collectibles', title: 'Collectibles', component: FirstRoute },
    { key: 'rewards', title: 'Rewards', component: SecondRoute },
    { key: 'datasets', title: 'Datasets', component: FirstRoute },
  ];

  return <TabView items={items} tabIndex={tabIndex} onTabIndexChange={setTabIndex} scrollEnabled />;
}

export default WalletView;
