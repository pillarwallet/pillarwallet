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
import { RefreshControl, FlatList, ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { SDK_PROVIDER } from 'react-native-dotenv';
import { createStructuredSelector } from 'reselect';
import { withNavigation } from 'react-navigation';
import type { NavigationScreenProp } from 'react-navigation';

import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import { BaseText, BoldText, MediumText } from 'components/Typography';
import Tabs from 'components/Tabs';
import { Insight } from 'components/Insight';
import { Wrapper } from 'components/Layout';

import { getBalance, getRate } from 'utils/assets';
import { formatMoney, getCurrencySymbol } from 'utils/common';
import { baseColors, fontSizes, spacing } from 'utils/variables';

import { COLLECTIBLES, defaultFiatCurrency, TOKENS } from 'constants/assetsConstants';

import { activeAccountSelector } from 'selectors';
import { paymentNetworkAccountBalancesSelector } from 'selectors/paymentNetwork';
import { accountBalancesSelector } from 'selectors/balances';
import { accountCollectiblesSelector } from 'selectors/collectibles';

import type { Assets, Balances } from 'models/Asset';
import type { Collectible } from 'models/Collectible';
import type { Badges } from 'models/Badge';

import CollectiblesList from './CollectiblesList';
import Spinner from './Assets';

type Props = {
  baseFiatCurrency: string,
  assets: Assets,
  rates: Object,
  balances: Balances,
  paymentNetworkBalances: Balances,
  collectibles: Collectible[],
  badges: Badges,
  navigation: NavigationScreenProp<*>,
  tabs: Object[],
  activeTab: string,
  showInsight: boolean,
  blockAssetsView?: boolean,
  sendingBlockedMessage: Object,
  hideInsight: Function,
  insightList: Object[],
  insightsTitle: string,
}

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

const MessageTitle = styled(BoldText)`
  font-size: ${fontSizes.large}px;
  text-align: center;
`;

const Message = styled(BaseText)`
  padding-top: 20px;
  font-size: ${fontSizes.extraSmall}px;
  color: ${baseColors.darkGray};
  text-align: center;
`;

class WalletView extends React.Component<Props> {
  renderAsset = ({ item: asset }) => {
    const { baseFiatCurrency } = this.props;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const currencySymbol = getCurrencySymbol(fiatCurrency);

    const {
      name,
      symbol,
      iconUrl,
      balance,
      balanceInFiat,
    } = asset;

    const fullIconUrl = iconUrl ? `${SDK_PROVIDER}/${iconUrl}?size=3` : '';

    return (
      <ListItemWithImage
        onPress={() => {}}
        label={name}
        avatarUrl={fullIconUrl}
        balance={{
          balance: formatMoney(balance),
          value: formatMoney(balanceInFiat, 2),
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
      </ListHeaderWrapper>
    );
  };

  render() {
    const {
      assets,
      baseFiatCurrency,
      rates,
      balances,
      collectibles,
      badges,
      navigation,
      tabs,
      activeTab,
      showInsight,
      blockAssetsView,
      sendingBlockedMessage = {},
      hideInsight,
      insightList = [],
      insightsTitle,
    } = this.props;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    const sortedAssets = Object.keys(assets)
      .map(id => assets[id])
      .map(({ symbol, balance, ...rest }) => ({
        symbol,
        balance: getBalance(balances, symbol),
        ...rest,
      }))
      .map(({ balance, symbol, paymentNetworkBalance, ...rest }) => ({ // eslint-disable-line
        balance,
        symbol,
        balanceInFiat: balance * getRate(rates, symbol, fiatCurrency),
        ...rest,
      }))
      .sort((a, b) => b.balanceInFiat - a.balanceInFiat);

    return (
      <ScrollView
        stickyHeaderIndices={[1]}
        style={{ backgroundColor: baseColors.white }}
      >
        <Insight
          isVisible={showInsight}
          title={insightsTitle}
          insightList={insightList}
          onClose={hideInsight}
        />
        <Tabs
          initialActiveTab={activeTab}
          tabs={tabs}
          style={{ marginTop: 10 }}
        />
        {(blockAssetsView &&
          <Wrapper flex={1} regularPadding center>
            <MessageTitle>{ sendingBlockedMessage.title }</MessageTitle>
            <Message>{ sendingBlockedMessage.message }</Message>
            <Wrapper style={{ marginTop: 20, width: '100%', alignItems: 'center' }}>
              <Spinner />
            </Wrapper>
          </Wrapper>
        ) || (
          <React.Fragment>
            {activeTab === TOKENS && (
              <FlatList
                data={sortedAssets}
                keyExtractor={(item) => item.id}
                renderItem={this.renderAsset}
                initialNumToRender={5}
                maxToRenderPerBatch={5}
                onEndReachedThreshold={0.5}
                style={{ width: '100%', height: '100%' }}
                ListHeaderComponent={this.renderHeader}
                refreshControl={
                  <RefreshControl
                    refreshing={false}
                    onRefresh={() => {}}
                  />
                }
              />
            )}
            {activeTab === COLLECTIBLES && (
              <CollectiblesList
                collectibles={collectibles}
                badges={badges}
                navigation={navigation}
              />)}
          </React.Fragment>)}
      </ScrollView>
    );
  }
}

const mapStateToProps = ({
  assets: { data: assets },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency, appearanceSettings: { assetsLayout } } },
  badges: { data: badges },
}) => ({
  assets,
  rates,
  baseFiatCurrency,
  assetsLayout,
  badges,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  collectibles: accountCollectiblesSelector,
  paymentNetworkBalances: paymentNetworkAccountBalancesSelector,
  activeAccount: activeAccountSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default withNavigation(connect(combinedMapStateToProps)(WalletView));
