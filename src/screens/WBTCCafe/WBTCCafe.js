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

import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { LayoutAnimation, RefreshControl } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import CircleButton from 'components/CircleButton';
import ActivityFeed from 'components/ActivityFeed';
import { ScrollWrapper } from 'components/Layout';

// actions
import { hasSeenWbtcCafeIntroAction } from 'actions/appSettingsActions';
import { updateWBTCCafeTransactionsAction } from 'actions/exchangeActions';

// utils, services
import { getValidPendingTransactions, mapPendingToTransactions } from 'services/wbtcCafe';
import { getSmartWalletAddress } from 'utils/accounts';
import { getDeviceHeight } from 'utils/common';

// types
import type { Theme } from 'models/Theme';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Transaction } from 'models/Transaction';
import type { PendingWBTCTransaction } from 'models/WBTC';
import type { Accounts } from 'models/Account';

// constants
import { WBTC, BTC } from 'constants/assetsConstants';
import { EXCHANGE } from 'constants/exchangeConstants';

import WBTCCafeIntro from './WBTCCafeIntro';

type Props = {
  navigation: NavigationScreenProp,
  hasSeenWbtcCafeIntro: boolean,
  updateHasSeenIntro: () => void,
  theme: Theme,
  history: Transaction[],
  pendingWbtcTransactions: PendingWBTCTransaction[],
  accounts: Accounts,
  updateWBTCCafeTransactions: () => void,
  settledWbtcTransactions: Transaction[]
};

const Logo = styled.Image`
  width: 64px;
  height: 64px;
  margin-vertical: 32px;
  align-self: center;
`;

const FeedWrapper = styled.ScrollView`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: ${getDeviceHeight() / 2.5};
`;

const logo = require('assets/images/exchangeProviders/wbtcLogo.png');

const getBackgroundColor = (theme: Theme) => theme.colors.basic070;

const WBTCCafe = ({
  theme,
  hasSeenWbtcCafeIntro,
  updateHasSeenIntro,
  accounts,
  pendingWbtcTransactions,
  navigation,
  updateWBTCCafeTransactions,
  settledWbtcTransactions,
}: Props) => {
  const [showIntro, setShowIntro] = React.useState<boolean>(!hasSeenWbtcCafeIntro);

  useEffect(() => { updateWBTCCafeTransactions(); }, []);

  const toggleIntro = () => {
    LayoutAnimation.easeInEaseOut();
    setShowIntro(!showIntro);
  };

  const handleButtonPress = () => {
    if (!hasSeenWbtcCafeIntro) updateHasSeenIntro();
    toggleIntro();
  };

  const getFeedData = () => {
    const pendingTxs =
      mapPendingToTransactions(getValidPendingTransactions(pendingWbtcTransactions), getSmartWalletAddress(accounts));
    return [...pendingTxs, ...settledWbtcTransactions];
  };

  const renderContent = () => {
    const feedData = getFeedData();
    return (
      <ScrollWrapper
        refreshControl={<RefreshControl refreshing={false} onRefresh={updateWBTCCafeTransactions} />}
        contentContainerStyle={{ flex: 1 }}
      >
        <Logo source={logo} />
        <CircleButton
          label={t('button.exchange')}
          fontIcon="exchange"
          onPress={() => navigation.navigate(EXCHANGE, { fromAssetCode: BTC, toAssetCode: WBTC })}
        />
        {!!feedData.length && (
          <FeedWrapper>
            <ActivityFeed
              cardHeaderTitle={t('title.mainActivityFeed')}
              navigation={navigation}
              feedData={feedData}
              isAssetView
              card
            />
          </FeedWrapper>
        )}
      </ScrollWrapper>
    );
  };

  const backgroundColor = getBackgroundColor(theme);

  return (
    <ContainerWithHeader
      headerProps={{
        noBottomBorder: true,
        centerItems: [{ title: t('wbtcCafe.cafe') }],
        wrapperStyle: { backgroundColor, width: '100%' },
        rightItems: [hasSeenWbtcCafeIntro && { icon: 'info-circle-inverse', onPress: toggleIntro }],
      }}
      inset={{ bottom: 0 }}
    >
      {showIntro
        ? <WBTCCafeIntro onButtonPress={handleButtonPress} backgroundColor={backgroundColor} />
        : renderContent()}
    </ContainerWithHeader>
  );
};

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  updateHasSeenIntro: () => dispatch(hasSeenWbtcCafeIntroAction()),
  updateWBTCCafeTransactions: () => dispatch(updateWBTCCafeTransactionsAction()),
});

const mapStateToProps = ({
  appSettings: { data: { hasSeenWbtcCafeIntro } },
  exchange: { data: { pendingWbtcTransactions, settledWbtcTransactions } },
  accounts: { data: accounts },
}: RootReducerState): $Shape<Props> => ({
  hasSeenWbtcCafeIntro,
  pendingWbtcTransactions,
  accounts,
  settledWbtcTransactions,
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(WBTCCafe));

