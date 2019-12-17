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
import { connect } from 'react-redux';
import { Share, RefreshControl, ScrollView, View } from 'react-native';
import styled from 'styled-components/native';
import { withNavigation } from 'react-navigation';
import type { NavigationScreenProp } from 'react-navigation';

// constants
import { SEND_BITCOIN_FLOW } from 'constants/navigationConstants';
import { defaultFiatCurrency, BTC } from 'constants/assetsConstants';

// actions
import {
  refreshBitcoinBalanceAction,
  refreshBTCTransactionsAction,
  refreshBitcoinUnspentTxAction,
} from 'actions/bitcoinActions';

// components
import AssetButtons from 'components/AssetButtons';
import ActivityFeed from 'components/ActivityFeed';
import ReceiveModal from 'screens/Asset/ReceiveModal';
import AssetPattern from 'components/AssetPattern';
import AssetBalance from 'components/AssetBalance';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { BitcoinAddress, BitcoinUtxo, BitcoinBalance, BTCTransaction } from 'models/Bitcoin';
import type { Rates, Asset, AssetData } from 'models/Asset';

// utils
import { spacing } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { satoshisToBtc, extractBitcoinTransactions } from 'utils/bitcoin';

type Props = {
  baseFiatCurrency: ?string,
  rates: Rates,
  navigation: NavigationScreenProp<*>,
  addresses: BitcoinAddress[],
  unspentTransactions: BitcoinUtxo[],
  refreshBitcoinBalance: () => void,
  balances: BitcoinBalance,
  supportedAssets: Asset[],
  transactions: BTCTransaction[],
  refreshBitcoinTransactions: () => void,
  refreshBitcoinUnspentTx: () => void,
};

type State = {
  showReceive: boolean,
};

const TopPartWrapper = styled.View`
  padding: ${spacing.large}px;
  border-bottom-width: 1;
  border-color: ${themedColors.border};
`;

const bitcoinNetworkIcon = require('assets/icons/icon_BTC.png');

class BTCView extends React.Component<Props, State> {
  state = {
    showReceive: false,
  };

  componentDidMount(): void {
    this.refreshBalance();
  }

  onPressSend = () => {
    const { supportedAssets } = this.props;
    const btcToken = supportedAssets.find(e => e.symbol === BTC);

    if (!btcToken) {
      console.error('BTC token not found'); // eslint-disable-line no-console
      return;
    }

    const {
      symbol: token,
      decimals,
    } = btcToken;

    const assetData: AssetData = {
      token,
      decimals,
    };

    this.props.navigation.navigate(SEND_BITCOIN_FLOW, { assetData });
  };

  showReceive = () => {
    this.setState({ showReceive: true });
  };

  hideReceive = () => {
    this.setState({ showReceive: false });
  };

  refreshBalance = () => {
    this.props.refreshBitcoinBalance();
    this.props.refreshBitcoinTransactions();
    this.props.refreshBitcoinUnspentTx();
  };

  handleOpenShareDialog = (address: string) => {
    Share.share({ title: 'Public address', message: address });
  };

  render() {
    const {
      navigation,
      addresses,
      balances,
      transactions = [],
      baseFiatCurrency,
      rates,
    } = this.props;

    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    // TODO: Select address
    const { address } = addresses[0];

    const addressBalance = balances[address];
    const balance = addressBalance ? satoshisToBtc(addressBalance.balance) : 0;
    const transactionsHistory = extractBitcoinTransactions(address, transactions);

    return (
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={this.refreshBalance} />
          }
        >
          <AssetPattern
            token="BTC"
            iconSource={bitcoinNetworkIcon}
            isListed
            tops={[170, 140, 90, 60]}
            sideIconsLeftDiff={100}
            innerIconsLeftDiff={60}
          />
          <TopPartWrapper>
            <AssetBalance
              isLoading={!addressBalance}
              rates={rates}
              fiatCurrency={fiatCurrency}
              balance={balance}
              token={BTC}
            />
            <AssetButtons
              onPressReceive={this.showReceive}
              onPressSend={this.onPressSend}
              isSendDisabled={balance <= 0}
              showButtons={['send', 'receive']}
            />
          </TopPartWrapper>
          <ActivityFeed
            navigation={navigation}
            feedData={transactionsHistory}
            hideTabs
            initialNumToRender={6}
            wrapperStyle={{ flexGrow: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        </ScrollView>
        <ReceiveModal
          isVisible={this.state.showReceive}
          onModalHide={this.hideReceive}
          address={address}
          token="BTC"
          tokenName="Bitcoin"
          handleOpenShareDialog={this.handleOpenShareDialog}
        />
      </View>
    );
  }
}

const mapStateToProps = ({
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  assets: {
    supportedAssets,
  },
  bitcoin: {
    data: {
      addresses,
      balances,
      transactions,
    },
  },
}: RootReducerState): $Shape<Props> => ({
  rates,
  baseFiatCurrency,
  addresses,
  balances,
  transactions,
  supportedAssets,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  refreshBitcoinBalance: () => dispatch(refreshBitcoinBalanceAction(true)),
  refreshBitcoinTransactions: () => dispatch(refreshBTCTransactionsAction(true)),
  refreshBitcoinUnspentTx: () => dispatch(refreshBitcoinUnspentTxAction(true)),
});

export default withNavigation(connect(mapStateToProps, mapDispatchToProps)(BTCView));
