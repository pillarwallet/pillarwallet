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
import { getEnv } from 'configs/envConfig';
import t from 'translations/translate';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';

import { getRate } from 'utils/assets';
import { formatMoney, formatFiat } from 'utils/common';
import { spacing } from 'utils/variables';

import { defaultFiatCurrency } from 'constants/assetsConstants';
import {
  paymentNetworkAccountBalancesSelector,
  paymentNetworkNonZeroBalancesSelector,
} from 'selectors/paymentNetwork';
import { accountAssetsSelector } from 'selectors/assets';

import type { Assets, Balances } from 'models/Asset';
import type { NavigationScreenProp } from 'react-navigation';
import Button from 'components/Button';
import { SETTLE_BALANCE } from 'constants/navigationConstants';

type Props = {
  baseFiatCurrency: string,
  assets: Assets,
  rates: Object,
  paymentNetworkBalances: Balances,
  navigation: NavigationScreenProp<*>,
  assetsOnNetwork: Object,
}

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
      rates,
    } = this.props;

    const tokenSymbol = get(item, 'symbol', '');
    const tokenBalance = get(item, 'balance', '0');
    const paymentNetworkBalanceFormatted = formatMoney(tokenBalance, 4);
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const totalInFiat = tokenBalance * getRate(rates, tokenSymbol, fiatCurrency);
    const formattedAmountInFiat = formatFiat(totalInFiat, baseFiatCurrency);
    const thisAsset = assets[tokenSymbol] || {};
    const { symbol, iconUrl, name } = thisAsset;
    const fullIconUrl = iconUrl ? `${getEnv().SDK_PROVIDER}/${iconUrl}?size=3` : '';

    return (
      <ListItemWithImage
        label={name || symbol}
        avatarUrl={fullIconUrl}
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
            width="auto"
            title={t('ppnContent.button.settleTransactions')}
            onPress={() => navigation.navigate(SETTLE_BALANCE)}
          />
        </FloatingButtonView>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
}) => ({
  rates,
  baseFiatCurrency,
});

const structuredSelector = createStructuredSelector({
  paymentNetworkBalances: paymentNetworkAccountBalancesSelector,
  assetsOnNetwork: paymentNetworkNonZeroBalancesSelector,
  assets: accountAssetsSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(UnsettledAssets);
