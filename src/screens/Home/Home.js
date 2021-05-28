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
import { useNavigation } from 'react-navigation-hooks';
import { RefreshControl } from 'react-native';
import { useDispatch } from 'react-redux';

// Actions
import { fetchAllAccountsTotalBalancesAction } from 'actions/assetsActions';

// Components
import { Container, Content } from 'components/modern/Layout';
import FloatingButtons from 'components/FloatingButtons';
import HeaderBlock from 'components/HeaderBlock';
import Stories from 'components/Stories';
import UserNameAndImage from 'components/UserNameAndImage';
import WalletConnectRequests from 'screens/WalletConnect/Requests';

// Constants
import { MENU, HOME_HISTORY } from 'constants/navigationConstants';

// Selectors
import { useUser } from 'selectors/user';
import { useRootSelector } from 'selectors';

// Utils
import { sumRecord } from 'utils/bigNumber';
import { calculateTotalBalancePerCategory, calculateTotalBalancePerChain } from 'utils/totalBalances';
import { useThemeColors } from 'utils/themes';

// Local
import BalanceSection from './BalanceSection';
import ChartsSection from './ChartsSection';
import AssetsSection from './AssetsSection';
import FloatingActions from './FloatingActions';
import {
  useAccountTotalBalances,
  useCollectibleCountPerChain,
} from './utils';

function Home() {
  const navigation = useNavigation();
  const colors = useThemeColors();

  const accountTotalBalances = useAccountTotalBalances();
  const collectibleCountPerChain = useCollectibleCountPerChain();
  const user = useUser();
  const dispatch = useDispatch();

  const balancePerCategory = calculateTotalBalancePerCategory(accountTotalBalances);
  const balancePerChain = calculateTotalBalancePerChain(accountTotalBalances);
  const totalBalance = sumRecord(balancePerCategory);

  const isRefreshing = useRootSelector(({ totalBalances }) => !!totalBalances.isFetching);
  const onRefresh = () => dispatch(fetchAllAccountsTotalBalancesAction());

  return (
    <Container>
      <HeaderBlock
        leftItems={[{ svgIcon: 'menu', color: colors.basic020, onPress: () => navigation.navigate(MENU) }]}
        centerItems={[{ custom: <UserNameAndImage user={user} /> }]}
        rightItems={[{ svgIcon: 'history', color: colors.basic020, onPress: () => navigation.navigate(HOME_HISTORY) }]}
        navigation={navigation}
        noPaddingTop
      />

      <Content
        contentContainerStyle={{ paddingBottom: FloatingButtons.SCROLL_VIEW_BOTTOM_INSET }}
        paddingHorizontal={0}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        <Stories />

        <BalanceSection balanceInFiat={totalBalance} />

        <WalletConnectRequests />

        <ChartsSection categoryBalances={balancePerCategory} chainBalances={balancePerChain} />

        <AssetsSection
          categoryBalances={balancePerCategory}
          categoryBalancesPerChain={accountTotalBalances}
          collectibleCountPerChain={collectibleCountPerChain}
        />
      </Content>

      <FloatingActions />
    </Container>
  );
}

export default Home;

