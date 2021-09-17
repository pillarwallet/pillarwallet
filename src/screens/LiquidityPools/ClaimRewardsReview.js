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
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';

import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import TokenReviewSummary from 'components/ReviewSummary/TokenReviewSummary';
import Table, { TableRow, TableLabel, TableAmount, TableTotal, TableFee } from 'components/legacy/Table';
import { Spacing } from 'components/legacy/Layout';
import Button from 'components/legacy/Button';
import Toast from 'components/Toast';
import { BaseText } from 'components/legacy/Typography';

import { isEnoughBalanceForTransactionFee } from 'utils/assets';
import { getPoolStats, getClaimRewardsTransaction } from 'utils/liquidityPools';

import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { ETH } from 'constants/assetsConstants';
import { CHAIN } from 'constants/chainConstants';

import { activeAccountAddressSelector } from 'selectors';
import { accountEthereumWalletAssetsBalancesSelector } from 'selectors/balances';

import { resetEstimateTransactionAction } from 'actions/transactionEstimateActions';
import { calculateClaimRewardsTransactionEstimateAction } from 'actions/liquidityPoolsActions';

import type { TransactionFeeInfo } from 'models/Transaction';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { LiquidityPoolsReducerState } from 'reducers/liquidityPoolsReducer';
import type { UnipoolLiquidityPool } from 'models/LiquidityPools';
import type { WalletAssetsBalances } from 'models/Balances';


type Props = {
  navigation: NavigationScreenProp<*>,
  feeInfo: ?TransactionFeeInfo,
  accountAddress: string,
  balances: WalletAssetsBalances,
  resetEstimateTransaction: () => void,
  calculateClaimRewardsTransactionEstimate: (pool: UnipoolLiquidityPool, amountToClaim: number) => void,
  isEstimating: boolean,
  estimateErrorMessage: ?string,
  liquidityPoolsReducer: LiquidityPoolsReducerState,
};

type NavigationParams = {|
  pool: UnipoolLiquidityPool,
|};

const MainWrapper = styled.View`
  padding: 32px 20px;
`;

const ClaimRewardReviewScreen = ({
  navigation,
  feeInfo,
  accountAddress,
  resetEstimateTransaction,
  calculateClaimRewardsTransactionEstimate,
  isEstimating,
  estimateErrorMessage,
  balances,
  liquidityPoolsReducer,
}: Props) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { pool }: NavigationParams = navigation.state.params;
  const poolStats = getPoolStats(pool, liquidityPoolsReducer);

  const rewardsToClaim = poolStats?.rewardsToClaim || 0;

  useEffect(() => {
    resetEstimateTransaction();
    calculateClaimRewardsTransactionEstimate(pool, rewardsToClaim);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onNextButtonPress = async () => {
    if (isSubmitted) return;
    setIsSubmitted(true);

    if (!feeInfo?.fee) {
      Toast.show({
        message: t('toast.cannotClaimReward'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });
      return;
    }

    let transactionPayload = getClaimRewardsTransaction(pool, accountAddress, rewardsToClaim, feeInfo?.fee);

    if (feeInfo?.gasToken) transactionPayload = { ...transactionPayload, gasToken: feeInfo?.gasToken };

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, { transactionPayload });
    setIsSubmitted(false);
  };


  let notEnoughForFee;
  if (feeInfo) {
    const balanceCheckTransaction = {
      txFeeInWei: feeInfo.fee,
      amount: 0,
      decimals: 18,
      symbol: ETH,
      gasToken: feeInfo.gasToken,
    };
    notEnoughForFee = !isEnoughBalanceForTransactionFee(balances, balanceCheckTransaction, CHAIN.ETHEREUM);
  }

  const errorMessage = notEnoughForFee
    ? t('error.notEnoughTokenForFee', { token: feeInfo?.gasToken?.symbol || ETH })
    : estimateErrorMessage;

  const nextButtonTitle = isEstimating ? t('label.gettingFee') : t('liquidityPoolsContent.button.claimRewards');
  const isNextButtonDisabled = !!isEstimating || !!errorMessage || !feeInfo;

  return (
    <ContainerWithHeader
      navigation={navigation}
      headerProps={{ centerItems: [{ title: t('liquidityPoolsContent.title.claimRewardsReview') }] }}
      putContentInScrollView
    >
      <MainWrapper>
        <TokenReviewSummary
          assetSymbol={pool.rewards?.[0]?.symbol ?? ''}
          text={t('liquidityPoolsContent.label.youAreClaiming')}
          amount={rewardsToClaim}
          chain={CHAIN.ETHEREUM}
        />
        <Spacing h={26} />
        <Table>
          <TableRow>
            <TableLabel>{t('transactions.label.ethFee')}</TableLabel>
            <TableFee txFeeInWei={feeInfo?.fee} gasToken={feeInfo?.gasToken} chain={CHAIN.ETHEREUM} />
          </TableRow>
          <TableRow>
            <TableLabel>{t('transactions.label.pillarFee')}</TableLabel>
            <TableAmount amount={0} chain={CHAIN.ETHEREUM} />
          </TableRow>
          <TableRow>
            <TableTotal>{t('transactions.label.totalFee')}</TableTotal>
            <TableFee txFeeInWei={feeInfo?.fee} gasToken={feeInfo?.gasToken} chain={CHAIN.ETHEREUM} />
          </TableRow>
        </Table>
        <Spacing h={48} />
        {!!errorMessage && (
          <>
            <BaseText negative center>
              {errorMessage}
            </BaseText>
            <Spacing h={20} />
          </>
        )}
        <Button
          title={nextButtonTitle}
          onPress={onNextButtonPress}
          disabled={isNextButtonDisabled}
        />
      </MainWrapper>
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

const structuredSelector = createStructuredSelector({
  accountAddress: activeAccountAddressSelector,
  balances: accountEthereumWalletAssetsBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  resetEstimateTransaction: () => dispatch(resetEstimateTransactionAction()),
  calculateClaimRewardsTransactionEstimate: (pool: UnipoolLiquidityPool, amountToClaim: number) =>
    dispatch(calculateClaimRewardsTransactionEstimateAction(pool, amountToClaim)),
});


export default connect(combinedMapStateToProps, mapDispatchToProps)(ClaimRewardReviewScreen);
