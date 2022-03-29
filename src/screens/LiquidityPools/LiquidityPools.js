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
import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { FlatList, View, TouchableOpacity } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// components
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import Table, { TableRow, TableLabel } from 'components/legacy/Table';
import Image from 'components/Image';
import { Spacing, ScrollWrapper } from 'components/legacy/Layout';
import { BaseText } from 'components/legacy/Typography';
import Tabs from 'components/legacy/Tabs';
import ListItemWithImage from 'components/legacy/ListItem/ListItemWithImage';
import RefreshControl from 'components/RefreshControl';
import RetryGraphQueryBox from 'components/RetryGraphQueryBox';

// utils
import { formatFiat, formatBigFiatAmount, formatBigAmount, formatTokenAmount } from 'utils/common';
import { getPoolStats, supportedLiquidityPools } from 'utils/liquidityPools';
import { getThemeColors } from 'utils/themes';

// constants
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { LIQUIDITY_POOL_DASHBOARD, LIQUIDITY_POOLS_INFO } from 'constants/navigationConstants';
import { CHAIN } from 'constants/chainConstants';

// actions
import { fetchLiquidityPoolsDataAction } from 'actions/liquidityPoolsActions';

// selectors
import { useChainSupportedAssets, useUsdToFiatRate } from 'selectors';

import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { LiquidityPoolsReducerState } from 'reducers/liquidityPoolsReducer';
import type { LiquidityPool } from 'models/LiquidityPools';
import type { Theme } from 'models/Theme';


type Props = {
  fetchLiquidityPoolsData: (pools: LiquidityPool[]) => void,
  baseFiatCurrency: ?string,
  isFetchingLiquidityPoolsData: boolean,
  liquidityPoolsReducer: LiquidityPoolsReducerState,
  navigation: NavigationScreenProp<*>,
  poolDataGraphQueryFailed: boolean,
  theme: Theme,
};

const TABS = {
  AVAILABLE: 'AVAILABLE',
  PURCHASED: 'PURCHASED',
  STAKED: 'STAKED',
};

const LiquidityPoolsScreen = ({
  fetchLiquidityPoolsData,
  baseFiatCurrency,
  isFetchingLiquidityPoolsData,
  liquidityPoolsReducer,
  navigation,
  poolDataGraphQueryFailed,
  theme,
}) => {
  const ethereumSupportedAssets = useChainSupportedAssets(CHAIN.ETHEREUM);
  const usdToFiatRate = useUsdToFiatRate();

  const [activeTab, setActiveTab] = useState(TABS.AVAILABLE);

  const supportedPools = useMemo(() => supportedLiquidityPools(ethereumSupportedAssets), [ethereumSupportedAssets]);
  const poolsStats = supportedPools.map((pool) => getPoolStats(pool, liquidityPoolsReducer));

  useEffect(() => {
    fetchLiquidityPoolsData(supportedPools);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (!poolStats) return null;

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
          itemImageUrl={pool.iconUrl}
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
                {formatBigFiatAmount(
                  usdToFiatRate * poolStats.currentPrice,
                  fiatCurrency,
                )}
              </BaseText>
              <BaseText small secondary>
                {t('liquidityPoolsContent.label.price')}
              </BaseText>
            </CardColumn>
            <VerticalDivider />
            <CardColumn>
              <BaseText big>
                {formatBigFiatAmount(
                  usdToFiatRate * poolStats.volume,
                  fiatCurrency,
                )}
              </BaseText>
              <BaseText small secondary>
                {t('liquidityPoolsContent.label.volume')}
              </BaseText>
            </CardColumn>
          </Row>
          {pool.rewardsEnabled && (
            <>
              <HorizontalDivider />
              <Row>
                <BaseText small secondary>
                  {t('liquidityPoolsContent.label.weeklyRewards')}
                </BaseText>
                <Spacing w={16} />
                <Rewards>
                  {pool.rewards?.map((reward) => {
                    const asset = ethereumSupportedAssets.find(
                      ({ symbol }) => symbol === reward.symbol,
                    );
                    return (
                      <Reward key={reward.symbol}>
                        {asset && (
                          <>
                            <RewardIcon source={{ uri: asset.iconUrl }} />
                            <Spacing w={6} />
                          </>
                        )}
                        <BaseText regular>
                          {t('tokenValue', {
                            value: formatBigAmount(reward.amount),
                            token: reward.symbol,
                          })}
                        </BaseText>
                      </Reward>
                    );
                  })}
                </Rewards>
              </Row>
            </>
          )}
        </Card>
        <Spacing h={38} />
      </TouchableOpacity>
    );
  };

  const renderPoolListItem = (pool: LiquidityPool, balance: number, balanceInFiat: string) => {
    return (
      <TouchableOpacity onPress={() => goToPoolDashboard(pool)}>
        <ListItemWithImage
          label={pool.name}
          subtext={t('tokenValue', { token: pool.symbol, value: formatTokenAmount(balance, pool.symbol) })}
          itemImageUrl={pool.iconUrl}
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

  const renderPurchasedPool = ({ item: pool, index }) => {
    const poolStats = poolsStats[index];
    if (!poolStats) return null;


    const balance = poolStats.userLiquidityTokenBalance.toNumber();

    const { currentPrice } = poolStats;
    const balanceInFiat = formatFiat(
      usdToFiatRate * currentPrice * balance,
      fiatCurrency,
    );

    return renderPoolListItem(pool, balance, balanceInFiat);
  };

  const renderStakedPool = ({ item: pool, index }) => {
    const poolStats = poolsStats[index];
    if (!poolStats) return null;

    const { currentPrice } = poolStats;
    const stakedAmountInFiat = usdToFiatRate * currentPrice * poolStats.stakedAmount.toNumber();
    const formattedStakedAmount = formatFiat(stakedAmountInFiat, fiatCurrency);
    const tokenSymbol = pool.rewards?.[0].symbol;

    return (
      <TouchableOpacity onPress={() => goToPoolDashboard(pool)}>
        {renderPoolListItem(pool, poolStats.stakedAmount.toNumber(), formattedStakedAmount)}
        <Table>
          <TableRow>
            <TableLabel>{t('liquidityPoolsContent.label.availableRewards')}</TableLabel>
            <BaseText>
              {t(
                'tokenValue',
                { value: formatTokenAmount(poolStats.rewardsToClaim, tokenSymbol), token: tokenSymbol },
              )}
            </BaseText>
          </TableRow>
        </Table>
      </TouchableOpacity>
    );
  };

  const isPurchasedPool = (pool: LiquidityPool, index: number) => {
    const poolStats = poolsStats[index];
    return poolStats && poolStats.userLiquidityTokenBalance.gt(0);
  };

  const isStakedPool = (pool: LiquidityPool, index: number) => {
    const poolStats = poolsStats[index];
    return poolStats && poolStats.stakedAmount.gt(0);
  };

  const areThereNotAvailablePools = () => {
    return supportedPools.some(isPurchasedPool) || supportedPools.some(isStakedPool);
  };

  const renderTab = () => {
    let renderFunction;
    let items;
    if (activeTab === TABS.AVAILABLE) {
      renderFunction = renderAvailablePool;
      items = supportedPools;
    } else if (activeTab === TABS.PURCHASED) {
      renderFunction = renderPurchasedPool;
      items = supportedPools.filter(isPurchasedPool);
    } else {
      renderFunction = renderStakedPool;
      items = supportedPools.filter(isStakedPool);
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
            onRefresh={() => fetchLiquidityPoolsData(supportedPools)}
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
        onRetry={() => fetchLiquidityPoolsData(supportedPools)}
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
}: RootReducerState): $Shape<Props> => ({
  isFetchingLiquidityPoolsData,
  poolDataGraphQueryFailed,
  baseFiatCurrency,
  liquidityPoolsReducer,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchLiquidityPoolsData: (pools: LiquidityPool[]) => dispatch(fetchLiquidityPoolsDataAction(pools)),
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(LiquidityPoolsScreen));


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

const RewardIcon = styled(Image)`
  width: 20px;
  height: 20px;
`;

const Reward = styled.View`
  flex-direction: row;
  align-items: center;
  margin: 0 24px 8px 0;
`;
