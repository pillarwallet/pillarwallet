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
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { View, RefreshControl } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { getEnv } from 'configs/envConfig';
import t from 'translations/translate';

// actions
import { fetchLiquidityPoolsDataAction, setShownStakingEnabledModalAction } from 'actions/liquidityPoolsActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper, Spacing } from 'components/Layout';
import { BaseText, MediumText } from 'components/Typography';
import CircleButton from 'components/CircleButton';
import Button from 'components/Button';
import Image from 'components/Image';
import RetryGraphQueryBox from 'components/RetryGraphQueryBox';
import Stats from 'components/Stats';
import Progress from 'components/Progress';
import Loader from 'components/Loader';
import Modal from 'components/Modal';
import ValueOverTimeGraph from 'components/Graph/ValueOverTimeGraph';

// constants
import { defaultFiatCurrency } from 'constants/assetsConstants';
import {
  LIQUIDITY_POOLS_ADD_LIQUIDITY,
  LIQUIDITY_POOLS_STAKE,
  LIQUIDITY_POOLS_UNSTAKE,
  LIQUIDITY_POOLS_REMOVE_LIQUIDITY,
  LIQUIDITY_POOLS_CLAIM_REWARDS_REVIEW,
} from 'constants/navigationConstants';

// utils
import { formatTokenAmount, formatFiat, formatBigFiatAmount, formatBigAmount } from 'utils/common';
import { convertUSDToFiat } from 'utils/assets';
import { getPoolStats, supportedLiquidityPools } from 'utils/liquidityPools';
import { images, getImageUrl } from 'utils/images';
import { getColorByThemeOutsideStyled } from 'utils/themes';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Balances, Rates, Asset } from 'models/Asset';
import type { LiquidityPoolsReducerState } from 'reducers/liquidityPoolsReducer';
import type { LiquidityPool } from 'models/LiquidityPools';

import StakingEnabledModal from './StakingEnabledModal';

type Props = {
  navigation: NavigationScreenProp<*>,
  balances: Balances,
  baseFiatCurrency: ?string,
  rates: Rates,
  poolDataGraphQueryFailed: boolean,
  isFetchingLiquidityPoolsData: boolean,
  fetchLiquidityPoolsData: (pools: LiquidityPool[]) => void,
  supportedAssets: Asset[],
  liquidityPoolsReducer: LiquidityPoolsReducerState,
  shownStakingEnabledModal: {[string]: boolean},
  setShownStakingEnabledModal: string => void,
};

const MainContainter = styled.View`
  padding: 0 0 40px;
`;

const ButtonsRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const Card = styled.View`
  background-color: ${({ theme }) => theme.colors.basic050};
  border-radius: 8px;
  padding: 16px;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
`;

const StretchedRow = styled(Row)`
  justify-content: space-between;
`;

const CardIcon = styled(Image)`
  width: 48px;
  height: 48px;
`;

const AllocationIcon = styled(Image)`
  width: 24px;
  height: 24px;
`;

const HorizontalPadding = styled.View`
  padding: 0 20px;
  width: 100%;
`;

const ButtonWrapper = styled.View`
  flex: 1;
`;

const AbsolutePositioning = styled.View`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  align-items: center;
  justify-content: center;
`;

const Overlay = styled(AbsolutePositioning)`
  background-color: ${({ theme }) => theme.colors.basic070};
  opacity: 0.9;
`;

const AssetIcon = styled(Image)`
  width: 64px;
  height: 64px;
  align-self: center;
  margin: 70px 0 20px 0;
`;

const LiquidityPoolDashboard = ({
  navigation,
  baseFiatCurrency,
  isFetchingLiquidityPoolsData,
  poolDataGraphQueryFailed,
  fetchLiquidityPoolsData,
  supportedAssets,
  liquidityPoolsReducer,
  rates,
  shownStakingEnabledModal,
  setShownStakingEnabledModal,
}: Props) => {
  const { pool } = navigation.state.params;
  const poolStats = getPoolStats(pool, liquidityPoolsReducer);

  const [scrollEnabled, setScrollEnabled] = useState(true);

  useEffect(() => {
    if (!poolStats) {
      fetchLiquidityPoolsData(supportedLiquidityPools(supportedAssets));
    }
  }, []);

  useEffect(() => {
    if (
      poolStats &&
      poolStats.stakedAmount.eq(0) &&
      poolStats.userLiquidityTokenBalance.gt(0) &&
      !shownStakingEnabledModal[pool.name] &&
      pool.rewardsEnabled
    ) {
      Modal.open(() => (
        <StakingEnabledModal
          pool={pool}
          stakeTokens={() => { navigation.navigate(LIQUIDITY_POOLS_STAKE, { pool }); }}
        />
      ));
      setShownStakingEnabledModal(pool.name);
    }
  }, [poolStats]);

  if (!poolStats) return <Loader />;

  const rewardAssetData = pool.rewards?.[0]
    ? supportedAssets.find(({ symbol }) => symbol === pool.rewards?.[0].symbol)
    : undefined;

  const balance = poolStats.userLiquidityTokenBalance.toNumber();
  const formattedBalance = formatTokenAmount(balance, pool.symbol);
  const hasBalance = balance > 0;

  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  const fiatBalance = formatFiat(convertUSDToFiat(balance * poolStats.currentPrice, rates, fiatCurrency), fiatCurrency);
  const stakedAmountInFiat = convertUSDToFiat(
    poolStats.stakedAmount.toNumber() * poolStats.currentPrice,
    rates,
    fiatCurrency,
  );
  const formattedStakedAmountInFiat = formatFiat(stakedAmountInFiat, fiatCurrency);

  const hasStakedTokens = poolStats && poolStats?.stakedAmount.gt(0);
  const showStakeSection = pool.rewardsEnabled || hasStakedTokens;

  const onAddLiquidity = () => {
    navigation.navigate(LIQUIDITY_POOLS_ADD_LIQUIDITY, { pool });
  };

  const onRemoveLiquidity = () => {
    navigation.navigate(LIQUIDITY_POOLS_REMOVE_LIQUIDITY, { pool });
  };

  const onClaimReward = () => {
    navigation.navigate(LIQUIDITY_POOLS_CLAIM_REWARDS_REVIEW, { rewardToken: rewardAssetData, pool });
  };

  const stats = [
    {
      title: t('liquidityPoolsContent.label.24hFees'),
      value: formatBigFiatAmount(convertUSDToFiat(poolStats.dailyFees, rates, fiatCurrency), fiatCurrency),
    },
    {
      title: t('liquidityPoolsContent.label.totalLiquidity'),
      value: formatBigFiatAmount(convertUSDToFiat(poolStats.totalLiquidity, rates, fiatCurrency), fiatCurrency),
    },
    {
      title: t('liquidityPoolsContent.label.24hVolume'),
      value: formatBigFiatAmount(convertUSDToFiat(poolStats.dailyVolume, rates, fiatCurrency), fiatCurrency),
    },
  ];

  pool.tokensProportions.forEach(({ symbol: tokenSymbol }) => {
    const tokenData = supportedAssets.find(({ symbol }) => symbol === tokenSymbol);
    if (!tokenData) return;
    stats.push({
      title: t('liquidityPoolsContent.label.tokenLiquidity', { tokenName: tokenData.name }),
      value: t('tokenValue', { value: formatBigAmount(poolStats.tokensLiquidity[tokenSymbol]), token: tokenSymbol }),
      iconUrl: `${getEnv().SDK_PROVIDER}/${tokenData.iconUrl}?size=3`,
    });
  });

  if (pool.rewardsEnabled && rewardAssetData) {
    stats.push({
      title: t('liquidityPoolsContent.label.weeklyRewards'),
      value: t('tokenValue', { value: formatBigAmount(pool.rewards[0].amount), token: rewardAssetData.symbol }),
      iconUrl: `${getEnv().SDK_PROVIDER}/${rewardAssetData.iconUrl}?size=3`,
    });
  }

  const theme = useTheme();
  const { genericToken } = images(theme);

  return (
    <ContainerWithHeader
      navigation={navigation}
      headerProps={{ centerItems: [{ title: pool.name }] }}
      inset={{ bottom: 0 }}
    >
      <ScrollWrapper
        refreshControl={
          <RefreshControl
            refreshing={isFetchingLiquidityPoolsData}
            onRefresh={() => fetchLiquidityPoolsData([pool])}
          />
        }
        scrollEnabled={scrollEnabled}
      >
        <MainContainter>
          <AssetIcon
            source={{ uri: getImageUrl(pool.iconUrl, 3) }}
            defaultSource={genericToken}
            fallback
          />
          <MediumText giant center>{formattedBalance}{' '}
            <MediumText secondary fontSize={20}>{pool.symbol}</MediumText>
          </MediumText>
          <BaseText regular secondary center>{fiatBalance}</BaseText>
          <ValueOverTimeGraph
            data={poolStats.history}
            fiatCurrency={fiatCurrency}
            onGestureStart={() => setScrollEnabled(false)}
            onGestureEnd={() => setScrollEnabled(true)}
            showXAxisValues={false}
            showYAxisValues={false}
          />
          <HorizontalPadding>
            <Spacing h={16} />
            {balance > 0 ? (
              <ButtonsRow>
                <CircleButton
                  label={t('liquidityPoolsContent.button.addLiquidityWrapped')}
                  fontIcon="plus"
                  onPress={onAddLiquidity}
                />
                <CircleButton
                  label={t('liquidityPoolsContent.button.removeLiquidityWrapped')}
                  fontIcon="up-arrow"
                  onPress={onRemoveLiquidity}
                />
              </ButtonsRow>
            ) : (
              <Button
                title={t('liquidityPoolsContent.button.addLiquidity')}
                onPress={onAddLiquidity}
              />
            )}
            <Spacing h={36} />
            <MediumText big>{t('label.keyFacts')}</MediumText>
          </HorizontalPadding>
          <Spacing h={6} />
          <Stats stats={stats} />
          <Spacing h={32} />

          <HorizontalPadding>
            {showStakeSection && rewardAssetData && (
            <>
              <MediumText big>{t('liquidityPoolsContent.label.staked')}</MediumText>
              <Spacing h={6} />
              <Card>
                <StretchedRow>
                  <Row>
                    <CardIcon source={{ uri: `${getEnv().SDK_PROVIDER}/${pool.iconUrl}?size=3` }} />
                    <Spacing w={12} />
                    <MediumText fontSize={20}>{formatTokenAmount(poolStats.stakedAmount, pool.symbol)}{' '}
                      <MediumText secondary regular>{pool.symbol}</MediumText>
                    </MediumText>
                  </Row>
                  <MediumText big>{formattedStakedAmountInFiat}</MediumText>
                </StretchedRow>
                <Spacing h={20} />
                <Row>
                  {pool.rewardsEnabled && (
                    <>
                      <ButtonWrapper>
                        <Button
                          title={t('liquidityPoolsContent.button.stake')}
                          onPress={() => navigation.navigate(LIQUIDITY_POOLS_STAKE, { pool })}
                        />
                      </ButtonWrapper>
                      <Spacing w={7} />
                    </>
                  )}
                  <ButtonWrapper>
                    <Button
                      title={t('liquidityPoolsContent.button.unstake')}
                      secondary
                      onPress={() => navigation.navigate(LIQUIDITY_POOLS_UNSTAKE, { pool })}
                    />
                  </ButtonWrapper>
                </Row>
                {balance === 0 && poolStats.stakedAmount.eq(0) && (
                  <>
                    <Overlay />
                    <AbsolutePositioning>
                      <BaseText medium secondary>
                        {t('liquidityPoolsContent.label.addLiquidityToStartEarning')}
                      </BaseText>
                    </AbsolutePositioning>
                  </>
                )}
              </Card>
              <Spacing h={28} />

              <MediumText big>{t('liquidityPoolsContent.label.rewards')}</MediumText>
              <Spacing h={6} />
              <Card>
                <Row>
                  <CardIcon source={{ uri: `${getEnv().SDK_PROVIDER}/${rewardAssetData.iconUrl}?size=3` }} />
                  <Spacing w={12} />
                  <View>
                    <BaseText fontSize={20}>
                      {formatTokenAmount(poolStats.rewardsToClaim, rewardAssetData.symbol)}{' '}
                      <BaseText secondary regular>{rewardAssetData.symbol}</BaseText>
                    </BaseText>
                    <BaseText regular secondary>
                      {t('liquidityPoolsContent.label.claimedSoFar', { value: 0, token: rewardAssetData.symbol })}
                    </BaseText>
                  </View>
                </Row>
                <Spacing h={20} />
                <Button
                  title={t('liquidityPoolsContent.button.claimRewards')}
                  primarySecond
                  onPress={onClaimReward}
                />
                {poolStats.stakedAmount.eq(0) && (
                  <>
                    <Overlay />
                    <AbsolutePositioning>
                      <BaseText medium secondary>
                        {t('liquidityPoolsContent.label.stakeLiquidityToGetRewards')}
                      </BaseText>
                    </AbsolutePositioning>
                  </>
                )}
              </Card>
            </>
          )}
            <Spacing h={28} />
            <MediumText big>{hasBalance
              ? t('liquidityPoolsContent.label.yourPoolShareAllocation')
              : t('liquidityPoolsContent.label.poolTokenAllocation')}
            </MediumText>
            <Spacing h={22} />
            {pool.tokensProportions.map(({ symbol: tokenSymbol, proportion, progressBarColor }) => {
              const tokenData = supportedAssets.find(({ symbol }) => symbol === tokenSymbol);
              if (!tokenData) return null;
              const tokenPriceInFiat = convertUSDToFiat(poolStats.tokensPricesUSD[tokenSymbol], rates, fiatCurrency);
              const formattedTokenPrice = formatFiat(tokenPriceInFiat, fiatCurrency);
              const quantity = hasBalance
                  ? poolStats.tokensPerLiquidityToken[tokenSymbol] * balance
                  : poolStats.tokensLiquidity[tokenSymbol];
              const formattedQuantity = formatTokenAmount(quantity, tokenSymbol);

              return (
                <View key={tokenSymbol}>
                  <StretchedRow>
                    <Row>
                      <AllocationIcon
                        source={{ uri: `${getEnv().SDK_PROVIDER}/${tokenData.iconUrl}?size=3` }}
                        fallbackSource={genericToken}
                      />
                      <Spacing w={8} />
                      <MediumText big>{tokenData.name}</MediumText>
                      <Spacing w={8} />
                      <BaseText regular secondary>{t('percentValue', { value: proportion * 100 })}</BaseText>
                    </Row>
                    <MediumText big>{formatFiat(quantity * tokenPriceInFiat, fiatCurrency)}</MediumText>
                  </StretchedRow>
                  <Spacing h={12} />
                  <Progress
                    fullStatusValue={1}
                    currentStatusValue={proportion}
                    height={6}
                    colorStart={progressBarColor}
                    colorEnd={progressBarColor}
                    emptyBarBackgroundColor={
                      getColorByThemeOutsideStyled(theme.current, { lightKey: 'basic080', darkKey: 'basic070' })
                    }
                    barPadding={0}
                  />
                  <Spacing h={24} />
                  <StretchedRow>
                    <BaseText secondary medium>{t('liquidityPoolsContent.label.tokenPrice')}</BaseText>
                    <BaseText medium>
                      {formattedTokenPrice}
                    </BaseText>
                  </StretchedRow>
                  <Spacing h={25} />
                  <StretchedRow>
                    <BaseText secondary medium>{t('liquidityPoolsContent.label.quantity')}</BaseText>
                    <BaseText medium>
                      {t('tokenValue', { value: formattedQuantity, token: tokenSymbol })}
                    </BaseText>
                  </StretchedRow>
                  <Spacing h={34} />
                </View>
              );
          })}
          </HorizontalPadding>
        </MainContainter>
      </ScrollWrapper>
      <RetryGraphQueryBox
        message={t('error.theGraphQueryFailed.liquidityPools')}
        hasFailed={poolDataGraphQueryFailed}
        isFetching={isFetchingLiquidityPoolsData}
        onRetry={() => fetchLiquidityPoolsData([pool])}
      />
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  appSettings: { data: { baseFiatCurrency } },
  liquidityPools: {
    isFetchingLiquidityPoolsData,
    poolDataGraphQueryFailed,
    shownStakingEnabledModal,
  },
  assets: { supportedAssets },
  liquidityPools: liquidityPoolsReducer,
  rates: { data: rates },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
  isFetchingLiquidityPoolsData,
  poolDataGraphQueryFailed,
  supportedAssets,
  liquidityPoolsReducer,
  rates,
  shownStakingEnabledModal,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchLiquidityPoolsData: (pools: LiquidityPool[]) => dispatch(fetchLiquidityPoolsDataAction(pools)),
  setShownStakingEnabledModal: (poolName: string) => dispatch(setShownStakingEnabledModalAction(poolName)),
});

export default connect(mapStateToProps, mapDispatchToProps)(LiquidityPoolDashboard);
