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
import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { FlatList, View, TouchableOpacity, RefreshControl } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { createStructuredSelector } from 'reselect';
import { CachedImage } from 'react-native-cached-image';
import { getEnv } from 'configs/envConfig';
import t from 'translations/translate';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Table, { TableRow, TableLabel } from 'components/Table';
import { Spacing, ScrollWrapper } from 'components/Layout';
import { BaseText } from 'components/Typography';
import Tabs from 'components/Tabs';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import RetryGraphQueryBox from 'components/RetryGraphQueryBox';

import { formatAmount, formatFiat } from 'utils/common';
import { getBalance, convertUSDToFiat } from 'utils/assets';
import { getPoolStats } from 'utils/liquidityPools';
import { getThemeColors } from 'utils/themes';

import { defaultFiatCurrency } from 'constants/assetsConstants';
import { LIQUIDITY_POOL_DASHBOARD, LIQUIDITY_POOLS_INFO } from 'constants/navigationConstants';
import { LIQUIDITY_POOLS } from 'constants/liquidityPoolsConstants';

import { accountBalancesSelector } from 'selectors/balances';

import { fetchLiquidityPoolsDataAction } from 'actions/liquidityPoolsActions';

import type { Rates, Asset, Balances } from 'models/Asset';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { LiquidityPoolsReducerState } from 'reducers/liquidityPoolsReducer';
import type { LiquidityPool } from 'models/LiquidityPools';
import type { Theme } from 'models/Theme';


type Props = {
  fetchLiquidityPoolsData: (pools: LiquidityPool[]) => void,
  baseFiatCurrency: ?string,
  supportedAssets: Asset[],
  balances: Balances,
  isFetchingLiquidityPoolsData: boolean,
  liquidityPoolsReducer: LiquidityPoolsReducerState,
  navigation: NavigationScreenProp<*>,
  rates: Rates,
  poolDataGraphQueryFailed: boolean,
  theme: Theme,
};

const TABS = {
  AVAILABLE: 'AVAILABLE',
  PURCHASED: 'PURCHASED',
  STAKED: 'STAKED',
};

const Row = styled.View`
  flex-direction: row;
`;

const Card = styled.View`
  background-color: ${({ theme }) => theme.colors.basic050};
  border-radius: 6px;
  padding: 12px 20px;
`;

const HorizontalDivider = styled.View`
  height: 1px;
  background-color: ${({ theme }) => theme.colors.basic060};
  margin: 12px 0;
`;

const VerticalDivider = styled.View`
  width: 1px;
  background-color: ${({ theme }) => theme.colors.basic060};
`;

const MainContainer = styled.View`
  padding: 24px 20px;
  flex: 1;
`;

const CardColumn = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const Rewards = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  flex: 1;
  margin-bottom: -8px;
`;

const RewardIcon = styled(CachedImage)`
  width: 20px;
  height: 20px;
`;

const Reward = styled.View`
  flex-direction: row;
  align-items: center;
  margin: 0 24px 8px 0;
`;

const LiquidityPoolsScreen = ({
  fetchLiquidityPoolsData,
  baseFiatCurrency,
  supportedAssets,
  balances,
  isFetchingLiquidityPoolsData,
  liquidityPoolsReducer,
  navigation,
  rates,
  poolDataGraphQueryFailed,
  theme,
}) => {
  const [activeTab, setActiveTab] = useState(TABS.AVAILABLE);

  useEffect(() => {
    fetchLiquidityPoolsData(LIQUIDITY_POOLS());
  }, []);

  const poolsStats = LIQUIDITY_POOLS().map(pool => getPoolStats(pool, liquidityPoolsReducer));

  const tabs = [
    {
      id: TABS.AVAILABLE,
      name: t('liquidityPoolsContent.tabs.active'),
      onPress: () => setActiveTab(TABS.AVAILABLE),
    },
    {
      id: TABS.PURCHASED,
      name: t('liquidityPoolsContent.tabs.purchased'),
      onPress: () => setActiveTab(TABS.PURCHASED),
    },
    {
      id: TABS.STAKED,
      name: t('liquidityPoolsContent.tabs.staked'),
      onPress: () => setActiveTab(TABS.STAKED),
    },
  ];

  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

  const goToPoolDashboard = (pool: LiquidityPool) => {
    navigation.navigate(LIQUIDITY_POOL_DASHBOARD, { pool });
  };

  const renderAvailablePool = ({ item: pool, index }) => {
    const poolStats = poolsStats[index];
    const renderPercent = (percent: number) => {
      if (percent > 0) {
        return <BaseText small positive>{t('positivePercentValue', { value: percent.toFixed(2) })}</BaseText>;
      } else if (percent < 0) {
        return <BaseText small negative>{t('negativePercentValue', { value: (-percent).toFixed(2) })}</BaseText>;
      }
      return null;
    };

    const poolProportionsString = pool.tokensProportions.map(token => {
      return t('liquidityPoolsContent.label.tokenPercent', {
        token: token.symbol,
        value: token.proportion * 100,
      });
    }).join(' + ');

    return (
      <TouchableOpacity onPress={() => goToPoolDashboard(pool)}>
        <ListItemWithImage
          label={pool.name}
          subtext={poolProportionsString}
          itemImageUrl={`${getEnv().SDK_PROVIDER}/${pool.iconUrl}?size=3`}
        />
        <Spacing h={8} />
        <Card>
          <Row>
            <CardColumn>
              <Row>
                <View>
                  <BaseText small>{t('liquidityPoolsContent.label.24h')}</BaseText>
                  <BaseText small>{t('liquidityPoolsContent.label.1w')}</BaseText>
                  <BaseText small>{t('liquidityPoolsContent.label.1m')}</BaseText>
                </View>
                <Spacing w={10} />
                <View>
                  {renderPercent(poolStats.dayPriceChange)}
                  {renderPercent(poolStats.weekPriceChange)}
                  {renderPercent(poolStats.monthPriceChange)}
                </View>
              </Row>
            </CardColumn>
            <VerticalDivider />
            <CardColumn>
              <BaseText big>
                {formatFiat(convertUSDToFiat(poolStats.currentPrice, rates, fiatCurrency), fiatCurrency)}
              </BaseText>
              <BaseText small secondary>{t('liquidityPoolsContent.label.price')}</BaseText>
            </CardColumn>
            <VerticalDivider />
            <CardColumn>
              <BaseText big>
                {formatFiat(convertUSDToFiat(poolStats.volume, rates, fiatCurrency), fiatCurrency)}
              </BaseText>
              <BaseText small secondary>{t('liquidityPoolsContent.label.volume')}</BaseText>
            </CardColumn>
          </Row>
          <HorizontalDivider />
          <Row>
            <BaseText small secondary>{t('liquidityPoolsContent.label.weeklyRewards')}</BaseText>
            <Spacing w={16} />
            <Rewards>
              {pool.rewards.map(reward => {
                const asset = supportedAssets.find(({ symbol }) => symbol === reward.symbol);
                const iconUri = `${getEnv().SDK_PROVIDER}/${asset.iconUrl}?size=3`;
                return (
                  <Reward>
                    <RewardIcon source={{ uri: iconUri }} />
                    <Spacing w={6} />
                    <BaseText regular>{t('tokenValue', { value: reward.amount, token: reward.symbol })}</BaseText>
                  </Reward>
                );
              })}
            </Rewards>
          </Row>
        </Card>
        <Spacing h={38} />
      </TouchableOpacity>
    );
  };

  const renderPurchasedPool = ({ item: pool, index }) => {
    const poolStats = poolsStats[index];
    const poolToken = supportedAssets.find(({ symbol }) => symbol === pool.symbol);
    if (!poolToken) return null;
    const balance = getBalance(balances, poolToken.symbol);

    const { tokenPrice } = poolStats;
    const balanceInFiat = formatFiat(tokenPrice * balance, fiatCurrency);

    return (
      <TouchableOpacity onPress={() => goToPoolDashboard(pool)}>
        <ListItemWithImage
          label={pool.name}
          subtext={t('tokenValue', { token: poolToken.symbol, value: balance })}
          itemImageUrl={`${getEnv().SDK_PROVIDER}/${pool.iconUrl}?size=3`}
          customAddon={(
            <View style={{ alignItems: 'flex-end' }}>
              <BaseText big>{balanceInFiat}</BaseText>
            </View>
           )}
          padding="14px 0"
        />
      </TouchableOpacity>
    );
  };

  const renderStakedPool = ({ item: pool, index }) => {
    const poolStats = poolsStats[index];
    return (
      <TouchableOpacity onPress={() => goToPoolDashboard(pool)}>
        {renderPurchasedPool({ item: pool, index })}
        <Table>
          <TableRow>
            <TableLabel>{t('liquidityPoolsContent.label.availableRewards')}</TableLabel>
            <BaseText>
              {t('tokenValue', { value: formatAmount(poolStats.rewardsToClaim), token: pool.rewards[0].symbol })}
            </BaseText>
          </TableRow>
        </Table>
      </TouchableOpacity>
    );
  };

  const isAvailablePool = (pool: LiquidityPool, index: number) => {
    const poolStats = poolsStats[index];
    return poolStats && getBalance(balances, pool.symbol) === 0 && poolStats.stakedAmount === 0;
  };

  const isPurchasedPool = (pool: LiquidityPool, index: number) => {
    const poolStats = poolsStats[index];
    return poolStats && getBalance(balances, pool.symbol) > 0 && poolStats.stakedAmount === 0;
  };

  const isStakedPool = (pool: LiquidityPool, index: number) => {
    const poolStats = poolsStats[index];
    return poolStats && poolStats.stakedAmount > 0;
  };

  const areThereNotAvailablePools = () => {
    return LIQUIDITY_POOLS().some(isPurchasedPool) || LIQUIDITY_POOLS().some(isStakedPool);
  };

  const renderTab = () => {
    let renderFunction;
    let items;
    if (activeTab === TABS.AVAILABLE) {
      renderFunction = renderAvailablePool;
      items = LIQUIDITY_POOLS().filter(isAvailablePool);
    } else if (activeTab === TABS.PURCHASED) {
      renderFunction = renderPurchasedPool;
      items = LIQUIDITY_POOLS().filter(isPurchasedPool);
    } else {
      renderFunction = renderStakedPool;
      items = LIQUIDITY_POOLS().filter(isStakedPool);
    }
    return (
      <FlatList
        data={items}
        renderItem={renderFunction}
        keyExtractor={pool => pool.name}
      />
    );
  };

  const colors = getThemeColors(theme);

  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [{ title: t('liquidityPoolsContent.title.liquidityPools') }],
        rightItems: [
          {
            icon: 'info-circle-inverse',
            color: colors.basic020,
            onPress: () => navigation.navigate(LIQUIDITY_POOLS_INFO),
          },
        ],
     }}
    >
      <ScrollWrapper
        refreshControl={
          <RefreshControl
            refreshing={isFetchingLiquidityPoolsData}
            onRefresh={() => fetchLiquidityPoolsData(LIQUIDITY_POOLS())}
          />
        }
      >
        <MainContainer>
          {areThereNotAvailablePools() && (
            <>
              <Tabs
                activeTab={activeTab}
                tabs={tabs}
              />
              <Spacing h={26} />
            </>
          )}
          {renderTab()}
        </MainContainer>
      </ScrollWrapper>
      <RetryGraphQueryBox
        message={t('error.theGraphQueryFailed.liquidityPools')}
        hasFailed={poolDataGraphQueryFailed}
        isFetching={isFetchingLiquidityPoolsData}
        onRetry={() => fetchLiquidityPoolsData(LIQUIDITY_POOLS())}
      />
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  liquidityPools: {
    isFetchingLiquidityPoolsData,
    poolDataGraphQueryFailed,
  },
  liquidityPools: liquidityPoolsReducer,
  appSettings: { data: { baseFiatCurrency } },
  assets: { supportedAssets },
  rates: { data: rates },
}: RootReducerState): $Shape<Props> => ({
  isFetchingLiquidityPoolsData,
  poolDataGraphQueryFailed,
  baseFiatCurrency,
  supportedAssets,
  liquidityPoolsReducer,
  rates,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});


const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchLiquidityPoolsData: (pools: LiquidityPool[]) => dispatch(fetchLiquidityPoolsDataAction(pools)),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(LiquidityPoolsScreen));
