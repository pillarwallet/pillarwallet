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

import type { BitcoinBalance } from 'models/Bitcoin';
import type { RootReducerState } from 'reducers/rootReducer';
import type {
  Balances,
  Rates,
} from 'models/Asset';

import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';

import BalanceView from 'components/PortfolioBalance/BalanceView';
import { calculateBalanceInFiat } from 'utils/assets';
import { calculateBitcoinBalanceInFiat } from 'utils/bitcoin';
import { accountBalancesSelector } from 'selectors/balances';
import { accountAssetsSelector } from 'selectors/assets';

type Props = {
  rates: Rates,
  balances: Balances,
  bitcoinBalances: BitcoinBalance,
  fiatCurrency: string,
  label?: string,
  style: Object,
  blockchainNetwork: ?string,
};

const networkBalance = (props: Props): number => {
  const {
    balances,
    fiatCurrency,
    rates,
    blockchainNetwork,
    bitcoinBalances,
  } = props;

  switch (blockchainNetwork) {
    case BLOCKCHAIN_NETWORK_TYPES.BITCOIN:
      return calculateBitcoinBalanceInFiat(rates, bitcoinBalances, fiatCurrency);

    case BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK:
    default:
      return calculateBalanceInFiat(rates, balances, fiatCurrency);
  }
};

class PortfolioBalance extends React.PureComponent<Props> {
  render() {
    const {
      style,
      label,
      fiatCurrency,
    } = this.props;

    const balance = networkBalance(this.props);

    return (
      <BalanceView
        style={style}
        label={label}
        fiatCurrency={fiatCurrency}
        balance={balance}
      />
    );
  }
}

const mapStateToProps = ({
  rates: { data: rates },
  bitcoin: { data: { balances: bitcoinBalances } },
  appSettings: { data: { blockchainNetwork } },
}: RootReducerState): $Shape<Props> => ({
  rates,
  bitcoinBalances,
  blockchainNetwork,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  assets: accountAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(PortfolioBalance);
