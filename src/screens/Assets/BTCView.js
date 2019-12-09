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

import { SEND_TOKEN_FROM_ASSET_FLOW } from 'constants/navigationConstants';

// actions
import {
  refreshBitcoinBalanceAction,
  refreshBTCTransactionsAction,
  refreshBitcoinUnspentTxAction,
} from 'actions/bitcoinActions';

// components
import { BaseText } from 'components/Typography';
import CircleButton from 'components/CircleButton';
import ActivityFeed from 'components/ActivityFeed';
import ReceiveModal from 'screens/Asset/ReceiveModal';
import AssetPattern from 'components/AssetPattern';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { BitcoinAddress, BitcoinUtxo, BitcoinBalance, BTCTransaction } from 'models/Bitcoin';
import type { Rates, Asset, AssetData } from 'models/Asset';

// utils
import { formatFiat, formatMoney } from 'utils/common';
import { baseColors, fontSizes, fontStyles, spacing } from 'utils/variables';
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

const AssetButtonsWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
`;

const TopPartWrapper = styled.View`
  padding: ${spacing.large}px;
  border-bottom-width: 1;
  border-color: ${baseColors.mediumLightGray};
`;

const BTCBalanceWrapper = styled.View`
  padding: 0 ${spacing.large}px ${spacing.large}px;
  align-items: center;
`;

const BTCBalance = styled(BaseText)`
  font-size: ${fontSizes.giant}px;
  color: ${baseColors.slateBlack};
`;

const ValueInFiat = styled(BaseText)`
  ${fontStyles.small};
  text-align: center;
  color: ${baseColors.darkGray};
`;

const iconSend = require('assets/icons/icon_send.png');
const bitcoinNetworkIcon = require('assets/icons/icon_BTC.png');
const iconReceive = require('assets/icons/icon_receive.png');

class BTCView extends React.Component<Props, State> {
  state = {
    showReceive: false,
  };

  componentDidMount(): void {
    this.refreshBalance();
  }

  onPressSend = () => {
    const { supportedAssets } = this.props;
    const btcToken = supportedAssets.find(e => e.symbol === 'BTC');

    if (!btcToken) {
      console.error('BTC token not found');
      return;
    }

    const {
      symbol: token,
      iconUrl: icon,
      decimals,
    } = btcToken;

    const assetData: AssetData = {
      token,
      icon,
      decimals,
    };

    this.props.navigation.navigate(SEND_TOKEN_FROM_ASSET_FLOW, { assetData });
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
    } = this.props;

    // TODO: Select address
    const { address } = addresses[0];

    const addressBalance = balances[address];

    const confirmedBalance = satoshisToBtc(addressBalance ? addressBalance.balance : 0);
    const availableFormattedAmount = formatMoney(confirmedBalance, 4);

    const transactionsHistory = extractBitcoinTransactions(address, transactions);
    const formattedBitcoinBalance = formatFiat(0, baseFiatCurrency); // TODO: calculate balance

    return (
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            backgroundColor: baseColors.snowWhite,
          }}
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
            <BTCBalanceWrapper>
              <BTCBalance>
                {`${availableFormattedAmount} BTC`}
              </BTCBalance>
              <ValueInFiat>{formattedBitcoinBalance}</ValueInFiat>
            </BTCBalanceWrapper>
            <AssetButtonsWrapper>
              <CircleButton label="Receive" icon={iconReceive} onPress={this.showReceive} />
              <CircleButton
                label="Send"
                icon={iconSend}
                onPress={this.onPressSend}
                disabled={confirmedBalance <= 0}
              />
            </AssetButtonsWrapper>
          </TopPartWrapper>
          <ActivityFeed
            backgroundColor={baseColors.white}
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

const mapDispatchToProps = (dispatch: Dispatch) => ({
  refreshBitcoinBalance: () => dispatch(refreshBitcoinBalanceAction(true)),
  refreshBitcoinTransactions: () => dispatch(refreshBTCTransactionsAction(true)),
  refreshBitcoinUnspentTx: () => dispatch(refreshBitcoinUnspentTxAction(true)),
});

export default withNavigation(connect(mapStateToProps, mapDispatchToProps)(BTCView));
