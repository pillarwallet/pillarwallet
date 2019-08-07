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
import { RefreshControl, ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { SDK_PROVIDER } from 'react-native-dotenv';
import { createStructuredSelector } from 'reselect';
import { withNavigation } from 'react-navigation';

import TankBar from 'components/TankBar';
import CircleButton from 'components/CircleButton';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import { MediumText } from 'components/Typography';

import { getBalance, getRate } from 'utils/assets';
import { formatMoney, getCurrencySymbol } from 'utils/common';
import { baseColors, fontSizes, spacing } from 'utils/variables';
import { getAccountAddress } from 'utils/accounts';

import { defaultFiatCurrency, TOKENS } from 'constants/assetsConstants';
import { ASSET } from 'constants/navigationConstants';

import { activeAccountSelector } from 'selectors';
import { paymentNetworkAccountBalancesSelector } from 'selectors/paymentNetwork';
import { accountBalancesSelector } from 'selectors/balances';
import type { Assets, Balances } from 'models/Asset';
import type { NavigationScreenProp } from 'react-navigation';

type Props = {
  baseFiatCurrency: string,
  assets: Assets,
  rates: Object,
  balances: Balances,
  paymentNetworkBalances: Balances,
  activeAccount: Object,
  navigation: NavigationScreenProp<*>,
}

const AssetButtonsWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  padding: 20px 20px 40px;
  margin: 0;
`;

const ListHeaderWrapper = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: ${spacing.large}px;
`;

const HeaderTitle = styled(MediumText)`
  font-size: ${fontSizes.extraSmall}px;
  color: ${baseColors.blueYonder};
`;

const HeaderButton = styled.TouchableOpacity`
  background-color: ${baseColors.electricBlue};
  border-radius: 3px;
  padding: 6px 12px;
`;

const ButtonText = styled(MediumText)`
  font-size: ${fontSizes.extraExtraSmall}px;
  color: ${baseColors.white};
`;

const StyledFlatList = styled.FlatList`
  background-color: ${baseColors.white};
  border-top-color: ${baseColors.mediumLightGray};
  border-top-width: 1px;
`;

const iconRequest = require('assets/icons/icon_receive.png');
const iconSend = require('assets/icons/icon_send.png');

class PPNView extends React.Component<Props> {
  renderAsset = ({ item: asset }) => {
    const { baseFiatCurrency, activeAccount, navigation } = this.props;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const currencySymbol = getCurrencySymbol(fiatCurrency);
    const {
      name,
      symbol,
      iconUrl,
      paymentNetworkBalance,
      paymentNetworkBalanceInFiat,
      balance,
      patternUrl,
      iconMonoUrl,
      balanceInFiat,
      decimals,
    } = asset;

    const fullIconMonoUrl = iconMonoUrl ? `${SDK_PROVIDER}/${iconMonoUrl}?size=2` : '';
    const fullIconUrl = iconUrl ? `${SDK_PROVIDER}/${iconUrl}?size=3` : '';
    const patternIcon = patternUrl ? `${SDK_PROVIDER}/${patternUrl}?size=3` : fullIconUrl;
    const formattedBalanceInFiat = formatMoney(balanceInFiat);
    const displayAmount = formatMoney(balance, 4);

    const assetData = {
      name: name || symbol,
      token: symbol,
      amount: displayAmount,
      contractAddress: asset.address,
      description: asset.description,
      balance,
      balanceInFiat: { amount: formattedBalanceInFiat, currency: fiatCurrency },
      address: getAccountAddress(activeAccount),
      icon: fullIconMonoUrl,
      iconColor: fullIconUrl,
      decimals,
      patternIcon,
    };

    return (
      <ListItemWithImage
        onPress={() => {
          navigation.navigate(ASSET,
            {
              assetData: {
                ...assetData,
                tokenType: TOKENS,
              },
            },
          );
        }}
        label={name}
        avatarUrl={fullIconUrl}
        balance={{
          syntheticBalance: formatMoney(paymentNetworkBalance),
          value: formatMoney(paymentNetworkBalanceInFiat, 4),
          currency: currencySymbol,
          token: symbol,
        }}
      />
    );
  };

  renderHeader = () => {
    return (
      <ListHeaderWrapper>
        <HeaderTitle>Wallet balance £168.71</HeaderTitle>
        <HeaderButton onPress={() => {}}>
          <ButtonText>Settle</ButtonText>
        </HeaderButton>
      </ListHeaderWrapper>
    );
  };

  render() {
    const {
      assets,
      baseFiatCurrency,
      rates,
      balances,
      paymentNetworkBalances,
    } = this.props;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    const sortedAssets = Object.keys(assets)
      .map(id => assets[id])
      .map(({ symbol, balance, ...rest }) => ({
        symbol,
        balance: getBalance(balances, symbol),
        paymentNetworkBalance: getBalance(paymentNetworkBalances, symbol),
        ...rest,
      }))
      .map(({ balance, symbol, paymentNetworkBalance, ...rest }) => ({ // eslint-disable-line
        balance,
        symbol,
        balanceInFiat: balance * getRate(rates, symbol, fiatCurrency),
        paymentNetworkBalance,
        paymentNetworkBalanceInFiat: paymentNetworkBalance * getRate(rates, symbol, fiatCurrency),
        ...rest,
      }))
      .sort((a, b) => b.balanceInFiat - a.balanceInFiat);

    return (
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {}}
          />
        }
      >
        <TankBar
          maxValue={1000}
          currentValue={678}
        />
        <AssetButtonsWrapper>
          <CircleButton
            label="Request"
            icon={iconRequest}
            onPress={() => {}}
          />
          <CircleButton
            label="Send"
            icon={iconSend}
            onPress={() => {}}
          />
        </AssetButtonsWrapper>
        <StyledFlatList
          data={sortedAssets}
          keyExtractor={(item) => item.id}
          renderItem={this.renderAsset}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          onEndReachedThreshold={0.5}
          style={{ width: '100%', height: '100%' }}
          ListHeaderComponent={this.renderHeader}
        />
      </ScrollView>
    );
  }
}

const mapStateToProps = ({
  assets: { data: assets },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency, appearanceSettings: { assetsLayout } } },
}) => ({
  assets,
  rates,
  baseFiatCurrency,
  assetsLayout,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  paymentNetworkBalances: paymentNetworkAccountBalancesSelector,
  activeAccount: activeAccountSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default withNavigation(connect(combinedMapStateToProps)(PPNView));
