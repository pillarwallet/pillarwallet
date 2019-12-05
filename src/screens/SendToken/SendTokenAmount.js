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

// components
import SendETHTokens from 'components/SendTokens/ETHTokens';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { Balances, Rates } from 'models/Asset';
import type { RootReducerState } from 'reducers/rootReducer';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import {
  activeAccountAddressSelector,
  activeAccountSelector,
} from 'selectors';
import type { Account } from 'models/Account';

type Props = {
  navigation: NavigationScreenProp<*>,
  balances: Balances,
  session: Object,
  rates: Rates,
  baseFiatCurrency: ?string,
  transactionSpeed: ?string,
  activeAccountAddress: string,
  activeAccount: ?Account,
};

class SendTokenAmount extends React.Component<Props> {
  assetData: Object;
  receiver: string;
  source: string;

  constructor(props: Props) {
    super(props);
    this.assetData = this.props.navigation.getParam('assetData', {});
    this.receiver = this.props.navigation.getParam('receiver', '');
    this.source = this.props.navigation.getParam('source', '');
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

    return (
      <SendETHTokens
        navigation={navigation}
        assetData={this.assetData}
        receiver={this.receiver}
        source={this.source}
        balances={balances}
        activeAccount={activeAccount}
        rates={rates}
        session={session}
        baseFiatCurrency={baseFiatCurrency}
        transactionSpeed={transactionSpeed}
        activeAccountAddress={activeAccountAddress}
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

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(SendTokenAmount);
