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
import { createStructuredSelector } from 'reselect';
import isEmpty from 'lodash.isempty';
import { GAS_TOKEN_ADDRESS } from 'react-native-dotenv';

// actions
import { updateAppSettingsAction } from 'actions/appSettingsActions';

// constants
import { BTC, defaultFiatCurrency } from 'constants/assetsConstants';

// components
import SendETHTokens from 'components/SendTokens/ETHTokens';
import SendBTCAmount from 'components/SendTokens/BTCAmount';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type {
  Balances,
  Rates,
  AssetData,
  Asset,
  Assets,
} from 'models/Asset';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { Account } from 'models/Account';
import type { SessionData } from 'models/Session';
import type { Transaction } from 'models/Transaction';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import {
  activeAccountAddressSelector,
  activeAccountSelector,
} from 'selectors';
import { accountAssetsSelector } from 'selectors/assets';
import { accountHistorySelector } from 'selectors/history';
import { isGasTokenSupportedSelector } from 'selectors/smartWallet';

// utils
import { getAssetDataByAddress, getAssetsAsList } from 'utils/assets';
import { checkIfSmartWalletAccount } from 'utils/accounts';


type Props = {
  navigation: NavigationScreenProp<*>,
  balances: Balances,
  session: SessionData,
  rates: Rates,
  baseFiatCurrency: ?string,
  transactionSpeed: ?string,
  activeAccountAddress: string,
  activeAccount: ?Account,
  updateAppSettings: (path: string, value: any) => void,
  accountAssets: Assets,
  supportedAssets: Asset[],
  isGasTokenSupported: ?boolean,
  accountHistory: Transaction[],
};

class SendTokenAmount extends React.Component<Props> {
  assetData: AssetData;
  receiver: string;
  source: string;
  receiverEnsName: string;

  constructor(props: Props) {
    super(props);
    const { navigation } = this.props;

    // TODO: this screen should fail if any of these are empty
    this.assetData = navigation.getParam('assetData', {});
    this.receiver = navigation.getParam('receiver', '');
    this.source = navigation.getParam('source', '');
    this.receiverEnsName = navigation.getParam('receiverEnsName');
  }

  updateTransactionSpeed = (speed: string) => {
    this.props.updateAppSettings('transactionSpeed', speed);
  };

  selectAmountComponent = (token: string) => {
    if (token === BTC) {
      return SendBTCAmount;
    }
    return SendETHTokens;
  };

  render() {
    const {
      session,
      balances,
      rates,
      baseFiatCurrency,
      activeAccount,
      activeAccountAddress,
      transactionSpeed,
      navigation,
      accountAssets,
      supportedAssets,
      isGasTokenSupported,
      accountHistory,
    } = this.props;
    const { token } = this.assetData;
    const AmountComponent = this.selectAmountComponent(token);

    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    let gasToken;
    const gasTokenData = getAssetDataByAddress(getAssetsAsList(accountAssets), supportedAssets, GAS_TOKEN_ADDRESS);
    const isSmartAccount = activeAccount && checkIfSmartWalletAccount(activeAccount);
    if (isSmartAccount
      && isGasTokenSupported
      && !isEmpty(gasTokenData)) {
      const { decimals, address, symbol } = gasTokenData;
      gasToken = { decimals, address, symbol };
    }

    return (
      <AmountComponent
        navigation={navigation}
        assetData={this.assetData}
        receiver={this.receiver}
        receiverEnsName={this.receiverEnsName}
        source={this.source}
        balances={balances}
        activeAccount={activeAccount}
        rates={rates}
        session={session}
        fiatCurrency={fiatCurrency}
        transactionSpeed={transactionSpeed}
        activeAccountAddress={activeAccountAddress}
        onUpdateTransactionSpeed={this.updateTransactionSpeed}
        accountAssets={accountAssets}
        accountHistory={accountHistory}
        gasToken={gasToken}
      />
    );
  }
}

const mapStateToProps = ({
  session: { data: session },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency, transactionSpeed } },
  assets: { supportedAssets },
}: RootReducerState): $Shape<Props> => ({
  rates,
  session,
  baseFiatCurrency,
  transactionSpeed,
  supportedAssets,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  activeAccount: activeAccountSelector,
  activeAccountAddress: activeAccountAddressSelector,
  accountAssets: accountAssetsSelector,
  accountHistory: accountHistorySelector,
  isGasTokenSupported: isGasTokenSupportedSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  updateAppSettings: (path: string, value: any) => dispatch(updateAppSettingsAction(path, value)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SendTokenAmount);
