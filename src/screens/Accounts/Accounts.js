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
import { FlatList } from 'react-native';
import isEqual from 'lodash.isequal';
import { connect } from 'react-redux';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ListCard } from 'components/ListItem/ListCard';

// utils
import { baseColors } from 'utils/variables';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { Assets, Balances, Rates } from 'models/Asset';

// constants
import { PILLAR_NETWORK_INTRO, ASSETS, WALLETS_LIST } from 'constants/navigationConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';

import { setActiveBNetworkAction } from 'actions/blockchainNetworkActions';

import { formatMoney, getCurrencySymbol } from 'utils/common';
import { calculatePortfolioBalance } from 'utils/assets';

type Props = {
  navigation: NavigationScreenProp<*>,
  setActiveBNetwork: Function,
  blockchainNetworks: Object[],
  balances: Balances,
  rates: Rates,
  assets: Assets,
  baseFiatCurrency: string,
}

const ppnInitButton = {
  id: 'INIT_PPN',
  title: 'Pillar Network',
  isNotConnected: true,
};

const genericToken = require('assets/images/tokens/genericToken.png');

class AccountsScreen extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqual(this.props, nextProps);
    return !isEq;
  }

  setActiveNetwork = (id) => {
    const { setActiveBNetwork, navigation } = this.props;
    setActiveBNetwork(id);
    navigation.navigate(ASSETS);
  };

  renderNetworks = ({ item: network }: Object) => {
    const {
      navigation,
      baseFiatCurrency,
      balances,
      rates,
      assets,
    } = this.props;
    const { id } = network;

    const ppnNote = {
      note: 'Instant, free and private transactions',
      emoji: 'sunglasses',
    };

    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const allBalances = Object.keys(balances).map((account) => {
      const portfolioBalance = calculatePortfolioBalance(assets, rates, balances[account]);
      return Object.keys(portfolioBalance).length ? portfolioBalance[fiatCurrency] : 0;
    });

    const combinedBalance = allBalances.reduce((a, b) => a + b, 0);
    const combinedFormattedBalance = formatMoney(combinedBalance || 0);

    const currencySymbol = getCurrencySymbol(fiatCurrency);

    switch (id) {
      case BLOCKCHAIN_NETWORK_TYPES.ETHEREUM:
        return (
          <ListCard
            {...network}
            action={() => navigation.navigate(WALLETS_LIST)}
            subtitle={`Balance: ${currencySymbol} ${combinedFormattedBalance}`}
            fallbackIcon={genericToken}
          />
        );
      case 'INIT_PPN':
        return (
          <ListCard
            {...network}
            action={() => navigation.navigate(PILLAR_NETWORK_INTRO)}
            note={ppnNote}
            fallbackIcon={genericToken}
          />
        );
      case BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK:
        return (
          <ListCard
            {...network}
            subtitle="Balance: 0"
            action={() => this.setActiveNetwork(BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK)}
            note={ppnNote}
            fallbackIcon={genericToken}
          />
        );
      default:
        return null;
    }
  };

  render() {
    const { blockchainNetworks } = this.props;
    const PillarNetwork = blockchainNetworks
      .find(({ id: bnetworkId }) => bnetworkId === BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK) || {};

    const networksListData = Object.keys(PillarNetwork).length
      ? blockchainNetworks
      : [...blockchainNetworks, ppnInitButton];

    return (
      <ContainerWithHeader
        headerProps={{
          leftItems: [
            { userIcon: true },
            {
              title: 'Accounts',
              color: baseColors.aluminium,
            },
          ],
          rightItems: [{ close: true, dismiss: true }],
        }}
      >
        <FlatList
          data={networksListData}
          keyExtractor={(item) => item.id}
          style={{ width: '100%' }}
          contentContainerStyle={{ width: '100%', padding: 20 }}
          renderItem={this.renderNetworks}
        />
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  blockchainNetwork: { data: blockchainNetworks },
  balances: { data: balances },
  assets: { data: assets },
  rates: { data: rates },
}) => ({
  blockchainNetworks,
  balances,
  assets,
  rates,
});

const mapDispatchToProps = (dispatch: Function) => ({
  setActiveBNetwork: (id: string) => dispatch(setActiveBNetworkAction(id)),
});

export default connect(mapStateToProps, mapDispatchToProps)(AccountsScreen);
