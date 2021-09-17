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
import { LIQUIDITY_POOLS_UNSTAKE_REVIEW } from 'constants/navigationConstants';

// models
import { LIQUIDITY_POOL_TYPES } from 'models/LiquidityPools';

// utils
import { findAssetByAddress } from 'utils/assets';
import { getPoolStats } from 'utils/liquidityPools';
import { addressAsKey } from 'utils/common';

// actions
import { resetEstimateTransactionAction } from 'actions/transactionEstimateActions';
import { calculateUnstakeTransactionEstimateAction } from 'actions/liquidityPoolsActions';

// selectors
import { useChainSupportedAssets } from 'selectors';

// types
import type { TransactionFeeInfo } from 'models/Transaction';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { LiquidityPoolsReducerState } from 'reducers/liquidityPoolsReducer';
import type { UnipoolLiquidityPool } from 'models/LiquidityPools';


type Props = {
  navigation: NavigationScreenProp<*>,
  isEstimating: boolean,
  feeInfo: ?TransactionFeeInfo,
  estimateErrorMessage: ?string,
  resetEstimateTransaction: () => void,
  calculateUnstakeTransactionEstimate: (pool: UnipoolLiquidityPool, tokenAmount: string) => void,
  liquidityPoolsReducer: LiquidityPoolsReducerState,
};

type NavigationParams = {|
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

const UnstakeTokensScreen = ({
  navigation,
  feeInfo,
  isEstimating,
  estimateErrorMessage,
  resetEstimateTransaction,
  calculateUnstakeTransactionEstimate,
  liquidityPoolsReducer,
}: Props) => {
  const ethereumSupportedAssets = useChainSupportedAssets(CHAIN.ETHEREUM);

  useEffect(() => {
    resetEstimateTransaction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { pool }: NavigationParams = navigation.state.params;
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
    if (!parseFloat(assetValue) || !isValid) return;
    calculateUnstakeTransactionEstimate(pool, (assetValue));
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
    LIQUIDITY_POOLS_UNSTAKE_REVIEW,
    { amount: assetValue, poolToken: assetData, pool },
  );

  const customBalances = assetData != null ? {
    [addressAsKey(assetData.address)]: {
      balance: poolStats?.stakedAmount.toFixed(),
      symbol: assetData.symbol,
      address: assetData.address,
    },
  } : 0;

  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: t('liquidityPoolsContent.title.unstakeTokens') }] }}
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
          customBalances={customBalances}
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
  calculateUnstakeTransactionEstimate: debounce((
    pool: UnipoolLiquidityPool,
    tokenAmount: string,
  ) => dispatch(calculateUnstakeTransactionEstimateAction(pool, tokenAmount)), 500),
});


export default connect(mapStateToProps, mapDispatchToProps)(UnstakeTokensScreen);
