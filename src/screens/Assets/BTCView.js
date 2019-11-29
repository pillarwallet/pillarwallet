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

import { SEND_BITCOIN_FLOW } from 'constants/navigationConstants';

// actions
import {
  refreshBitcoinBalanceAction,
  refreshBTCTransactionsAction,
  refreshBitcoinUnspentTxAction,
} from 'actions/bitcoinActions';

// components
import { BaseText, MediumText } from 'components/Typography';
import CircleButton from 'components/CircleButton';
import ActivityFeed from 'components/ActivityFeed';
import ReceiveModal from 'screens/Asset/ReceiveModal';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { BitcoinAddress, BitcoinUtxo, BitcoinBalance, BTCTransaction } from 'models/Bitcoin';
import type { Rates } from 'models/Asset';

// utils
import { formatMoney } from 'utils/common';
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
  supportedAssets: Object[],
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
  background-color: ${baseColors.snowWhite};
  border-bottom-width: 1;
  border-color: ${baseColors.mediumLightGray};
`;

const SectionTitle = styled(MediumText)`
  ${fontStyles.regular};
  color: ${baseColors.blueYonder};
`;

const TankBalanceWrapper = styled.View`
  padding: ${spacing.large}px 40px;
  align-items: center;
`;

const TankBalance = styled(BaseText)`
  font-size: ${fontSizes.giant}px;
  color: ${baseColors.slateBlack};
`;

const iconSend = require('assets/icons/icon_send.png');

class BTCView extends React.Component<Props, State> {
  state = {
    showReceive: false,
  };

  componentDidMount(): void {
    this.refreshBalance();
  }


  onPressSend = (assetData) => {
    // TODO: Start send flow
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
      supportedAssets,
    } = this.props;

    // TODO: Select address
    const { address } = addresses[0];

    const assetData = supportedAssets.find(e => e.symbol === 'BTC') || {};

    const addressBalance = balances[address];

    const confirmedBalance = satoshisToBtc(addressBalance ? addressBalance.balance : 0);
    const availableFormattedAmount = formatMoney(confirmedBalance, 4);

    const transactionsHistory = extractBitcoinTransactions(address, transactions);

    return (
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={this.refreshBalance} />
          }
        >
          <TopPartWrapper>
            <SectionTitle>Bitcoin balance</SectionTitle>
            <TankBalanceWrapper>
              <TankBalance>
                {`${availableFormattedAmount} BTC`}
              </TankBalance>
            </TankBalanceWrapper>
            <AssetButtonsWrapper>
              <CircleButton label="Receive" onPress={this.showReceive} fontIcon="plus" />
              <CircleButton
                label="Send"
                icon={iconSend}
                onPress={() => this.onPressSend(assetData)}
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
