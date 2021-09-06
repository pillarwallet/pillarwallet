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
import t from 'translations/translate';

// components
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import ListItemWithImage from 'components/legacy/ListItem/ListItemWithImage';
import Button from 'components/legacy/Button';

// utils
import { findAssetByAddress, getAssetsAsList } from 'utils/assets';
import { formatTokenAmount, formatFiat } from 'utils/common';
import { spacing } from 'utils/variables';
import { getAssetRateInFiat } from 'utils/rates';

// constants
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { SETTLE_BALANCE } from 'constants/navigationConstants';
import { CHAIN } from 'constants/chainConstants';

// selectors
import { paymentNetworkNonZeroBalancesSelector } from 'selectors/paymentNetwork';
import { accountEthereumAssetsSelector } from 'selectors/assets';

// types
import type { AssetByAddress } from 'models/Asset';
import type { NavigationScreenProp } from 'react-navigation';
import type { Currency, RatesPerChain } from 'models/Rates';


type Props = {
  baseFiatCurrency: Currency,
  assets: AssetByAddress,
  ratesPerChain: RatesPerChain,
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

    const { address, balance = 0 } = item;
    const { name, symbol } = findAssetByAddress(getAssetsAsList(assets), address) ?? {};

    const paymentNetworkBalanceFormatted = formatTokenAmount(balance, symbol);
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const ethereumRates = ratesPerChain[CHAIN.ETHEREUM] ?? {};
    const totalInFiat = balance * getAssetRateInFiat(ethereumRates, address, fiatCurrency);
    const formattedAmountInFiat = formatFiat(totalInFiat, baseFiatCurrency);

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
  assetsOnNetwork: paymentNetworkNonZeroBalancesSelector,
  assets: accountEthereumAssetsSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(UnsettledAssets);
