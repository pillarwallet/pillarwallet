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
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Spacing } from 'components/Layout';
import { BaseText } from 'components/Typography';
import Button from 'components/Button';
import ValueInput from 'components/ValueInput';
import FeeLabelToggle from 'components/FeeLabelToggle';

// constants
import { LIQUIDITY_POOLS_UNSTAKE_REVIEW } from 'constants/navigationConstants';

// utils
import { getPoolStats } from 'utils/liquidityPools';

// actions
import { resetEstimateTransactionAction } from 'actions/transactionEstimateActions';
import { calculateUnstakeTransactionEstimateAction } from 'actions/liquidityPoolsActions';

// types
import type { Asset } from 'models/Asset';
import type { TransactionFeeInfo } from 'models/Transaction';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { LiquidityPoolsReducerState } from 'reducers/liquidityPoolsReducer';
import type { LiquidityPool } from 'models/LiquidityPools';


type Props = {
  navigation: NavigationScreenProp<*>,
  supportedAssets: Asset[],
  isEstimating: boolean,
  feeInfo: ?TransactionFeeInfo,
  estimateErrorMessage: ?string,
  resetEstimateTransaction: () => void,
  calculateUnstakeTransactionEstimate: (pool: LiquidityPool, tokenAmount: number) => void,
  liquidityPoolsReducer: LiquidityPoolsReducerState,
};

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
  supportedAssets,
  feeInfo,
  isEstimating,
  estimateErrorMessage,
  resetEstimateTransaction,
  calculateUnstakeTransactionEstimate,
  liquidityPoolsReducer,
}: Props) => {
  useEffect(() => {
    resetEstimateTransaction();
  }, []);

  const { pool } = navigation.state.params;
  const poolStats = getPoolStats(pool, liquidityPoolsReducer);
  const assetData = supportedAssets.find(asset => asset.symbol === pool.symbol);
  const [assetValue, setAssetValue] = useState('');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (!parseFloat(assetValue) || !isValid) return;
    calculateUnstakeTransactionEstimate(pool, parseFloat(assetValue));
  }, [assetValue, isValid]);

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

  const customBalances = assetData && {
    [assetData.symbol]: {
      balance: poolStats?.stakedAmount,
      symbol: assetData.symbol,
    },
  };

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
                isLoading={isEstimating}
                hasError={!!estimateErrorMessage}
                showFiatDefault
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
  assets: { supportedAssets },
  transactionEstimate: { feeInfo, isEstimating, errorMessage: estimateErrorMessage },
  liquidityPools: liquidityPoolsReducer,
}: RootReducerState): $Shape<Props> => ({
  supportedAssets,
  isEstimating,
  feeInfo,
  estimateErrorMessage,
  liquidityPoolsReducer,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  resetEstimateTransaction: () => dispatch(resetEstimateTransactionAction()),
  calculateUnstakeTransactionEstimate: debounce((
    pool: LiquidityPool,
    tokenAmount: number,
  ) => dispatch(calculateUnstakeTransactionEstimateAction(pool, tokenAmount)), 500),
});


export default connect(mapStateToProps, mapDispatchToProps)(UnstakeTokensScreen);
