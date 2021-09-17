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
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';
import debounce from 'lodash.debounce';

// components
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import { Container, Spacing } from 'components/legacy/Layout';
import { BaseText } from 'components/legacy/Typography';
import Button from 'components/legacy/Button';
import ValueInput from 'components/legacy/ValueInput';
import FeeLabelToggle from 'components/FeeLabelToggle';

// constants
import { CHAIN } from 'constants/chainConstants';
import { LIQUIDITY_POOLS_STAKE_REVIEW } from 'constants/navigationConstants';

// models
import { LIQUIDITY_POOL_TYPES } from 'models/LiquidityPools';

// actions
import { resetEstimateTransactionAction } from 'actions/transactionEstimateActions';
import { calculateStakeTransactionEstimateAction } from 'actions/liquidityPoolsActions';

// utils
import { findAssetByAddress } from 'utils/assets';
import { getPoolStats } from 'utils/liquidityPools';
import { addressAsKey } from 'utils/common';

// selectors
import { useChainSupportedAssets } from 'selectors';

// types
import type { Asset } from 'models/Asset';
import type { TransactionFeeInfo } from 'models/Transaction';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { UnipoolLiquidityPool } from 'models/LiquidityPools';
import type { LiquidityPoolsReducerState } from 'reducers/liquidityPoolsReducer';
import type { WalletAssetsBalances } from 'models/Balances';


type Props = {
  navigation: NavigationScreenProp<*>,
  isEstimating: boolean,
  feeInfo: ?TransactionFeeInfo,
  estimateErrorMessage: ?string,
  resetEstimateTransaction: () => void,
  calculateStakeTransactionEstimate: (pool: UnipoolLiquidityPool, tokenAmount: string, tokenAsset: Asset) => void,
  liquidityPoolsReducer: LiquidityPoolsReducerState,
};

type NaivgationParams = {|
  pool: UnipoolLiquidityPool,
|};

const MainContainer = styled.View`
  padding: 24px 20px;
`;

const FeeInfo = styled.View`
  align-items: center;
`;

const FooterInner = styled.View`
  width: 100%;
  justify-content: center;
  align-items: center;
  padding: 24px 20px;
`;

const StakeTokensScreen = ({
  navigation,
  feeInfo,
  isEstimating,
  estimateErrorMessage,
  resetEstimateTransaction,
  calculateStakeTransactionEstimate,
  liquidityPoolsReducer,
}: Props) => {
  const ethereumSupportedAssets = useChainSupportedAssets(CHAIN.ETHEREUM);

  useEffect(() => {
    resetEstimateTransaction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { pool }: NaivgationParams = navigation.state.params;
  useEffect(() => {
    if (pool.type !== LIQUIDITY_POOL_TYPES.UNIPOOL) {
      navigation.goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool]);

  const poolStats = getPoolStats(pool, liquidityPoolsReducer);
  const assetData = findAssetByAddress(ethereumSupportedAssets, pool.uniswapPairAddress);
  const [assetValue, setAssetValue] = useState('');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (!parseFloat(assetValue) || !isValid || !assetData) return;
    calculateStakeTransactionEstimate(
      pool,
      assetValue,
      assetData,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetValue, isValid]);

  if (!assetData) {
    return <Container />;
  }

  const nextButtonTitle = isEstimating ? t('label.gettingFee') : t('button.next');
  const isNextButtonDisabled = !!isEstimating
    || !parseFloat(assetValue)
    || !!estimateErrorMessage
    || !isValid
    || !feeInfo;

  const onNextButtonPress = () => navigation.navigate(
    LIQUIDITY_POOLS_STAKE_REVIEW,
    { amount: assetValue, poolToken: assetData, pool },
  );

  const poolTokenCustomBalances: WalletAssetsBalances =
    assetData != null
      ? {
        [addressAsKey(assetData.address)]: {
          balance: poolStats?.userLiquidityTokenBalance.toFixed() ?? '0',
          symbol: assetData?.symbol,
          address: assetData.address,
        },
      }
      : {};

  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: t('liquidityPoolsContent.title.stakeTokens') }] }}
      inset={{ bottom: 0 }}
      footer={(
        <FooterInner>
          <FeeInfo>
            {feeInfo && (
              <FeeLabelToggle
                labelText={t('label.fee')}
                txFeeInWei={feeInfo?.fee}
                gasToken={feeInfo?.gasToken}
                chain={CHAIN.ETHEREUM}
                isLoading={isEstimating}
                hasError={!!estimateErrorMessage}
              />
            )}
            {!!estimateErrorMessage && (
              <BaseText negative center>
                {estimateErrorMessage}
              </BaseText>
            )}
          </FeeInfo>
          <Spacing h={20} />
          <Button
            disabled={isNextButtonDisabled}
            title={nextButtonTitle}
            onPress={onNextButtonPress}
          />
        </FooterInner>
      )}
    >
      <MainContainer>
        <ValueInput
          assetData={assetData}
          customAssets={[assetData]}
          value={assetValue}
          onValueChange={setAssetValue}
          onFormValid={setIsValid}
          customBalances={poolTokenCustomBalances}
        />
      </MainContainer>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  transactionEstimate: { feeInfo, isEstimating, errorMessage: estimateErrorMessage },
  liquidityPools: liquidityPoolsReducer,
}: RootReducerState): $Shape<Props> => ({
  isEstimating,
  feeInfo,
  estimateErrorMessage,
  liquidityPoolsReducer,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  resetEstimateTransaction: () => dispatch(resetEstimateTransactionAction()),
  calculateStakeTransactionEstimate: debounce((
    pool: UnipoolLiquidityPool,
    tokenAmount: string,
    tokenAsset: Asset,
  ) => dispatch(calculateStakeTransactionEstimateAction(pool, tokenAmount, tokenAsset)), 500),
});


export default connect(mapStateToProps, mapDispatchToProps)(StakeTokensScreen);
