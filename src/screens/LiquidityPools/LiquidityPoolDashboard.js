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
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { View, RefreshControl } from 'react-native';
import { CachedImage } from 'react-native-cached-image';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import type { NavigationScreenProp } from 'react-navigation';
import { getEnv } from 'configs/envConfig';
import t from 'translations/translate';
import { BigNumber as EthersBigNumber } from 'ethers';

// actions
import { fetchUnipoolUserDataAction, fetchUniswapPoolDataAction } from 'actions/liquidityPoolsActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper, Spacing } from 'components/Layout';
import { BaseText, MediumText } from 'components/Typography';
import CircleButton from 'components/CircleButton';
import AssetPattern from 'components/AssetPattern';
import Button from 'components/Button';
import RetryGraphQueryBox from 'components/RetryGraphQueryBox';

// constants
import { defaultFiatCurrency } from 'constants/assetsConstants';
import {
  LIQUIDITY_POOLS_ADD_LIQUIDITY,
  LIQUIDITY_POOLS_STAKE,
  LIQUIDITY_POOLS_UNSTAKE,
  LIQUIDITY_POOLS_REMOVE_LIQUIDITY,
} from 'constants/navigationConstants';

// utils
import { formatMoney, formatAmount, formatUnits } from 'utils/common';
import { getFormattedRate, getBalance } from 'utils/assets';

// selectors
import { accountBalancesSelector } from 'selectors/balances';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Balances, Rates } from 'models/Asset';

type Props = {
  navigation: NavigationScreenProp<*>,
  balances: Balances,
  baseFiatCurrency: ?string,
  rates: Rates,
  fetchUnipoolUserData: () => void,
  isFetchingUnipoolData: boolean,
  unipoolStakedAmount: EthersBigNumber,
  unipoolEarnedAmount: EthersBigNumber,
  isFetchingUniswapPoolData: boolean,
  poolDataGraphQueryFailed: boolean,
  poolsData: { [string]: Object },
  fetchUniswapPoolData: (poolAddress: string) => void,
};

const MainContainter = styled.View`
  align-items: center;
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

const CardIcon = styled(CachedImage)`
  width: 48px;
  height: 48px;
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

const LiquidityPoolDashboard = ({
  navigation,
  balances,
  baseFiatCurrency,
  rates,
  fetchUnipoolUserData,
  isFetchingUnipoolData,
  isFetchingUniswapPoolData,
  unipoolStakedAmount,
  unipoolEarnedAmount,
  fetchUniswapPoolData,
  poolDataGraphQueryFailed,
  poolsData,
}: Props) => {
  // a temporary hardcode, we'll get this from navigation
  /* eslint-disable i18next/no-literal-string */
  const assetData = {
    name: 'ETH-PLR Uniswap v.2 LP',
    token: 'UNI-V2',
    iconUrl: 'asset/images/tokens/icons/ethplruniColor.png',
    decimals: 18,
  };

  const rewardAssetData = {
    name: 'Pillar',
    token: 'PLR',
    iconUrl: 'asset/images/tokens/icons/plrColor.png',
    decimals: 18,
  };

  const poolAddress = '0xae2d4004241254aed3f93873604d39883c8259f0';
  /* eslint-enable i18next/no-literal-string */

  useEffect(() => {
    fetchUnipoolUserData();
    fetchUniswapPoolData(poolAddress);
  }, []);

  const balance = getBalance(balances, assetData.token);
  const formattedBalance = formatMoney(balance, 4);
  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  const fiatBalance = getFormattedRate(rates, balance, assetData.token, fiatCurrency);

  const onAddLiquidity = () => {
    navigation.navigate(LIQUIDITY_POOLS_ADD_LIQUIDITY, { poolAddress });
  };

  const onRemoveLiquidity = () => {
    navigation.navigate(LIQUIDITY_POOLS_REMOVE_LIQUIDITY, { poolAddress });
  };

  return (
    <ContainerWithHeader
      navigation={navigation}
      headerProps={{ centerItems: [{ title: assetData.name }] }}
      inset={{ bottom: 0 }}
    >
      <ScrollWrapper
        refreshControl={
          <RefreshControl
            refreshing={isFetchingUnipoolData || isFetchingUniswapPoolData}
            onRefresh={() => fetchUnipoolUserData()}
          />
        }
      >
        <MainContainter>
          <AssetPattern
            token="PLR"
            icon={`${getEnv().SDK_PROVIDER}/${assetData.iconUrl}?size=3`}
            isListed
          />
          <MediumText giant>{formattedBalance}{' '}
            <MediumText secondary fontSize={20}>{assetData.token}</MediumText>
          </MediumText>
          <BaseText regular secondary>{fiatBalance}</BaseText>
          <HorizontalPadding>
            <Spacing h={16} />
            {balance > 0 ? (
              <ButtonsRow>
                <CircleButton
                  label={t('liquidityPoolsContent.button.addLiquidity')}
                  fontIcon="plus"
                  onPress={onAddLiquidity}
                  disabled={!poolsData[poolAddress]}
                />
                <CircleButton
                  label={t('liquidityPoolsContent.button.removeLiquidity')}
                  fontIcon="up-arrow"
                  disabled={!poolsData[poolAddress]}
                  onPress={onRemoveLiquidity}
                />
              </ButtonsRow>
            ) : (
              <Button
                title={t('liquidityPoolsContent.button.addLiquidity')}
                onPress={onAddLiquidity}
                disabled={!poolsData[poolAddress]}
              />
            )}
            <Spacing h={32} />
            <MediumText big >{t('liquidityPoolsContent.label.staked')}</MediumText>
            <Spacing h={6} />
            <Card>
              <Row>
                <CardIcon source={{ uri: `${getEnv().SDK_PROVIDER}/${assetData.iconUrl}?size=3` }} />
                <Spacing w={12} />
                <MediumText fontSize={20}>{formatAmount(formatUnits(unipoolStakedAmount, assetData.decimals))}{' '}
                  <MediumText secondary regular>{assetData.token}</MediumText>
                </MediumText>
              </Row>
              <Spacing h={20} />
              <Row>
                <ButtonWrapper>
                  <Button
                    title={t('liquidityPoolsContent.button.stake')}
                    onPress={() => navigation.navigate(LIQUIDITY_POOLS_STAKE)}
                  />
                </ButtonWrapper>
                <Spacing w={7} />
                <ButtonWrapper>
                  <Button
                    title={t('liquidityPoolsContent.button.unstake')}
                    secondary
                    onPress={() => navigation.navigate(LIQUIDITY_POOLS_UNSTAKE)}
                  />
                </ButtonWrapper>
              </Row>
              {balance === 0 && (
                <>
                  <Overlay />
                  <AbsolutePositioning>
                    <BaseText medium secondary>{t('liquidityPoolsContent.label.addLiquidityToStartEarning')}</BaseText>
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
                  <BaseText fontSize={20}>{formatAmount(formatUnits(unipoolEarnedAmount, assetData.decimals))}{' '}
                    <BaseText secondary regular>{assetData.token}</BaseText>
                  </BaseText>
                  <BaseText regular secondary>
                    {t('liquidityPoolsContent.label.claimedSoFar', { value: 0, token: 'PLR' })}
                  </BaseText>
                </View>
              </Row>
              <Spacing h={20} />
              <Button
                title={t('liquidityPoolsContent.button.claimRewards')}
                primarySecond
              />
              {unipoolStakedAmount.isZero() && (
                <>
                  <Overlay />
                  <AbsolutePositioning>
                    <BaseText medium secondary>{t('liquidityPoolsContent.label.stakeLiquidityToGetRewards')}</BaseText>
                  </AbsolutePositioning>
                </>
              )}
            </Card>
          </HorizontalPadding>
        </MainContainter>
      </ScrollWrapper>
      <RetryGraphQueryBox
        message={t('error.theGraphQueryFailed.liquidityPools')}
        hasFailed={poolDataGraphQueryFailed}
        isFetching={isFetchingUniswapPoolData}
        onRetry={() => fetchUniswapPoolData(poolAddress)}
      />
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  liquidityPools: {
    isFetchingUnipoolData,
    isFetchingUniswapPoolData,
    unipool: {
      stakedAmount,
      earnedAmount,
    },
    poolDataGraphQueryFailed,
    poolsData,
  },
}: RootReducerState): $Shape<Props> => ({
  isFetchingUnipoolData,
  isFetchingUniswapPoolData,
  unipoolStakedAmount: stakedAmount,
  unipoolEarnedAmount: earnedAmount,
  poolDataGraphQueryFailed,
  poolsData,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchUnipoolUserData: () => dispatch(fetchUnipoolUserDataAction()),
  fetchUniswapPoolData: (poolAddress: string) => dispatch(fetchUniswapPoolDataAction(poolAddress)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(LiquidityPoolDashboard);
