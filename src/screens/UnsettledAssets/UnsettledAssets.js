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
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import get from 'lodash.get';
import t from 'translations/translate';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Button from 'components/Button';

// utils
import { getRate } from 'utils/assets';
import { formatTokenAmount, formatFiat } from 'utils/common';
import { spacing } from 'utils/variables';

// constants
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { SETTLE_BALANCE } from 'constants/navigationConstants';
import { CHAIN } from 'constants/chainConstants';

// selectors
import {
  paymentNetworkAccountBalancesSelector,
  paymentNetworkNonZeroBalancesSelector,
} from 'selectors/paymentNetwork';
import { accountEthereumAssetsSelector } from 'selectors/assets';

// types
import type { AssetsBySymbol } from 'models/Asset';
import type { NavigationScreenProp } from 'react-navigation';
import type { WalletAssetsBalances } from 'models/Balances';
import type { Currency, RatesPerChain } from 'models/Rates';


type Props = {
  baseFiatCurrency: Currency,
  assets: AssetsBySymbol,
  ratesPerChain: RatesPerChain,
  paymentNetworkBalances: WalletAssetsBalances,
  navigation: NavigationScreenProp<*>,
  assetsOnNetwork: Object,
};

const FloatingButtonView = styled.View`
  position: absolute;
  bottom: ${spacing.rhythm}px;
  alignItems: center;
  justify-content: center;
  width: 100%;
`;

class UnsettledAssets extends React.Component<Props> {
  renderAsset = ({ item }) => {
    const {
      baseFiatCurrency,
      assets,
      ratesPerChain,
    } = this.props;

    const tokenSymbol = get(item, 'symbol', '');
    const tokenBalance = get(item, 'balance', '0');
    const paymentNetworkBalanceFormatted = formatTokenAmount(tokenBalance, tokenSymbol);
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const ethereumRates = ratesPerChain[CHAIN.ETHEREUM] ?? {};
    const totalInFiat = tokenBalance * getRate(ethereumRates, tokenSymbol, fiatCurrency);
    const formattedAmountInFiat = formatFiat(totalInFiat, baseFiatCurrency);
    const thisAsset = assets[tokenSymbol] || {};
    const { symbol, name } = thisAsset;

    return (
      <ListItemWithImage
        label={name || symbol}
        balance={{
          balance: paymentNetworkBalanceFormatted,
          value: formattedAmountInFiat,
          token: symbol,
        }}
      />
    );
  };

  render() {
    const { assetsOnNetwork, navigation } = this.props;
    const assetsOnNetworkArray = Object.keys(assetsOnNetwork).map((asset) => assetsOnNetwork[asset]);

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: t('ppnContent.title.unsettledAssetsScreen') }] }}
        inset={{ bottom: 0 }}
      >
        <FlatList
          data={assetsOnNetworkArray}
          keyExtractor={({ symbol }) => symbol}
          renderItem={this.renderAsset}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          onEndReachedThreshold={0.5}
          style={{ width: '100%', height: '100%', flex: 1 }}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 56 + spacing.rhythm }}
        />
        <FloatingButtonView>
          <Button
            style={{ paddingLeft: spacing.rhythm, paddingRight: spacing.rhythm }}
            block={false}
            title={t('ppnContent.button.settleTransactions')}
            onPress={() => navigation.navigate(SETTLE_BALANCE)}
          />
        </FloatingButtonView>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  rates: { data: ratesPerChain },
  appSettings: { data: { baseFiatCurrency } },
}) => ({
  ratesPerChain,
  baseFiatCurrency,
});

const structuredSelector = createStructuredSelector({
  paymentNetworkBalances: paymentNetworkAccountBalancesSelector,
  assetsOnNetwork: paymentNetworkNonZeroBalancesSelector,
  assets: accountEthereumAssetsSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(UnsettledAssets);
