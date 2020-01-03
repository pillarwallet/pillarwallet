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

// constants
import { BTC, defaultFiatCurrency } from 'constants/assetsConstants';

// components
import SendETHTokens from 'components/SendTokens/ETHTokens';
import SendBTCAmount from 'components/SendTokens/BTCAmount';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { Balances, Rates, AssetData } from 'models/Asset';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { Account } from 'models/Account';
import type { SessionData } from 'models/Session';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import {
  activeAccountAddressSelector,
  activeAccountSelector,
} from 'selectors';

// actions
import { updateAppSettingsAction } from 'actions/appSettingsActions';

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
};

class SendTokenAmount extends React.Component<Props> {
  assetData: AssetData;
  receiver: string;
  source: string;

  constructor(props: Props) {
    super(props);
    const { navigation } = this.props;

    // TODO: this screen should fail if any of these are empty
    this.assetData = navigation.getParam('assetData', {});
    this.receiver = navigation.getParam('receiver', '');
    this.source = navigation.getParam('source', '');
  }

  updateTransactionSpeed = (speed: string) => {
    this.props.updateAppSettings('transactionSpeed', speed);
  }

  selectAmountComponent(token: string) {
    if (token === BTC) {
      return SendBTCAmount;
    }

    return SendETHTokens;
  }

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
    } = this.props;
    const { token } = this.assetData;
    const AmountComponent = this.selectAmountComponent(token);

    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    return (
      <AmountComponent
        navigation={navigation}
        assetData={this.assetData}
        receiver={this.receiver}
        source={this.source}
        balances={balances}
        activeAccount={activeAccount}
        rates={rates}
        session={session}
        fiatCurrency={fiatCurrency}
        transactionSpeed={transactionSpeed}
        activeAccountAddress={activeAccountAddress}
        onUpdateTransactionSpeed={this.updateTransactionSpeed}
      />
    );
  }
}

const mapStateToProps = ({
  session: { data: session },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency, transactionSpeed } },
}: RootReducerState): $Shape<Props> => ({
  rates,
  session,
  baseFiatCurrency,
  transactionSpeed,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  activeAccount: activeAccountSelector,
  activeAccountAddress: activeAccountAddressSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  updateAppSettings: (path: string, value: any) => dispatch(updateAppSettingsAction(path, value)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SendTokenAmount);
