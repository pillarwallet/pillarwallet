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

import React from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
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
import { fetchSmartWalletTransactionsAction } from 'actions/historyActions';
import { setWbtcPendingTxsAction } from 'actions/exchangeActions';

// utils, services
import { baseColors } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { getValidPendingTransactions, getWbtcCafeTransactions, mapPendingToTransactions } from 'services/wbtcCafe';
import { getTransactionsFromHistory } from 'utils/history';
import { getSmartWalletAddress } from 'utils/accounts';

// types
import type { Theme } from 'models/Theme';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Transaction } from 'models/Transaction';
import type { PendingWBTCTransaction } from 'models/WBTC';
import type { Accounts } from 'models/Account';

// selectors
import { combinedHistorySelector } from 'selectors/history';

// constants
import { LIGHT_THEME } from 'constants/appSettingsConstants';
import { WBTC, BTC } from 'constants/assetsConstants';
import { EXCHANGE } from 'constants/exchangeConstants';

import WBTCCafeIntro from './WBTCCafeIntro';

interface Props {
  navigation: NavigationScreenProp;
  hasSeenWbtcCafeIntro: boolean;
  updateHasSeenIntro: () => void;
  theme: Theme;
  history: Transaction[];
  pendingWbtcTransactions: PendingWBTCTransaction[];
  accounts: Accounts;
  fetchSmartWalletTransactions: () => void;
  setWbtcPendingTxs: (txs: PendingWBTCTransaction[]) => void;
}

interface State {
  showIntro: boolean;
}

const Logo = styled.Image`
  width: 64px;
  height: 64px;
  margin-vertical: 32px;
  align-self: center;
`;

const logo = require('assets/images/exchangeProviders/wbtcLogo.png');

const getBackgroundColor = (theme: Theme) =>
  theme.current === LIGHT_THEME ? baseColors.snowWhite : themedColors.iconBackground;

class WBTCCafe extends React.Component<Props, State> {
  state: State = { showIntro: !this.props.hasSeenWbtcCafeIntro };

  handleButtonPress = () => {
    const { updateHasSeenIntro, hasSeenWbtcCafeIntro } = this.props;
    if (!hasSeenWbtcCafeIntro) updateHasSeenIntro();
    this.toggleIntro();
  };

  toggleIntro = () => {
    LayoutAnimation.easeInEaseOut();
    this.setState({ showIntro: !this.state.showIntro });
  };

  getFeedData = () => {
    const { history, accounts, pendingWbtcTransactions } = this.props;
    const mappedTxs = getTransactionsFromHistory(history, accounts);
    const wbtcCafeTxs = getWbtcCafeTransactions(mappedTxs);
    const pendingTxs =
      mapPendingToTransactions(getValidPendingTransactions(pendingWbtcTransactions), getSmartWalletAddress(accounts));
    return [...pendingTxs, ...wbtcCafeTxs];
  };

  handleRefresh = () => {
    const { setWbtcPendingTxs, fetchSmartWalletTransactions, pendingWbtcTransactions } = this.props;
    fetchSmartWalletTransactions();
    setWbtcPendingTxs(getValidPendingTransactions(pendingWbtcTransactions));
  };

  renderContent = () => (
    <ScrollWrapper refreshControl={<RefreshControl refreshing={false} onRefresh={this.handleRefresh} />}>
      <Logo source={logo} />
      <CircleButton
        label={t('button.exchange')}
        fontIcon="exchange"
        onPress={() => this.props.navigation.navigate(EXCHANGE, { fromAssetCode: BTC, toAssetCode: WBTC })}
      />
      <ActivityFeed
        feedTitle={t('title.mainActivityFeed')}
        navigation={this.props.navigation}
        feedData={this.getFeedData()}
        isAssetView
      />
    </ScrollWrapper>
  );

  render() {
    const { theme, hasSeenWbtcCafeIntro } = this.props;
    const { showIntro } = this.state;
    const backgroundColor = getBackgroundColor(theme);

    return (
      <ContainerWithHeader headerProps={{
        noBottomBorder: true,
        centerItems: [{ title: t('wbtcCafe.cafe') }],
        wrapperStyle: { backgroundColor },
        rightItems: [hasSeenWbtcCafeIntro && { icon: 'info-circle-inverse', onPress: this.toggleIntro }],
      }}
      >
        {showIntro
          ? <WBTCCafeIntro onButtonPress={this.handleButtonPress} backgroundColor={backgroundColor} />
          : this.renderContent()}
      </ContainerWithHeader>
    );
  }
}

const structuredSelector = createStructuredSelector({
  history: combinedHistorySelector,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  updateHasSeenIntro: () => dispatch(hasSeenWbtcCafeIntroAction()),
  fetchSmartWalletTransactions: () => dispatch(fetchSmartWalletTransactionsAction()),
  setWbtcPendingTxs: (txs: PendingWBTCTransaction[]) => dispatch(setWbtcPendingTxsAction(txs)),
});

const mapStateToProps = ({
  appSettings: { data: { hasSeenWbtcCafeIntro } },
  exchange: { data: { pendingWbtcTransactions } },
  accounts: { data: accounts },
}: RootReducerState): $Shape<Props> => ({
  hasSeenWbtcCafeIntro,
  pendingWbtcTransactions,
  accounts,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(WBTCCafe));

