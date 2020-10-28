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
import { createStructuredSelector } from 'reselect';
import styled from 'styled-components/native';
import debounce from 'lodash.debounce';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// actions
import { calculateLendingWithdrawTransactionEstimateAction } from 'actions/lendingActions';
import { resetEstimateTransactionAction } from 'actions/transactionEstimateActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { BaseText } from 'components/Typography';
import FeeLabelToggle from 'components/FeeLabelToggle';
import Button from 'components/Button';
import ValueInput from 'components/ValueInput';

// constants
import { ETH } from 'constants/assetsConstants';
import { LENDING_WITHDRAW_TRANSACTION_CONFIRM } from 'constants/navigationConstants';

// selectors
import { accountBalancesSelector } from 'selectors/balances';

// utils
import { spacing } from 'utils/variables';
import { isEnoughBalanceForTransactionFee } from 'utils/assets';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Balances, DepositedAsset } from 'models/Asset';
import type { TransactionFeeInfo } from 'models/Transaction';


type Props = {
  depositedAssets: DepositedAsset[],
  navigation: NavigationScreenProp<*>,
  isEstimating: boolean,
  feeInfo: ?TransactionFeeInfo,
  calculateLendingWithdrawTransactionEstimate: (amount: number, asset: DepositedAsset) => void,
  balances: Balances,
  estimateErrorMessage: ?string,
  resetEstimateTransaction: () => void,
};

const FeeInfo = styled.View`
  align-items: center;
  margin-bottom: ${spacing.large}px;
`;

const FooterInner = styled.View`
  padding: ${spacing.large}px;
  width: 100%;
  justify-content: center;
  align-items: center;
`;

const InputWrapper = styled.View`
  padding: 24px 40px 0;
`;

const EnterWithdrawAmount = ({
  navigation,
  depositedAssets,
  feeInfo,
  isEstimating,
  calculateLendingWithdrawTransactionEstimate,
  balances,
  estimateErrorMessage,
  resetEstimateTransaction,
}: Props) => {
  useEffect(() => {
    resetEstimateTransaction();
  }, []);

  const preselectedAssetSymbol: string = navigation.getParam('symbol');
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState(preselectedAssetSymbol);
  const [depositAmount, setDepositAmount] = useState('');

  const depositedAsset = depositedAssets.find(({ symbol }) => symbol === selectedAssetSymbol);

  useEffect(() => {
    if (!depositAmount || !depositedAsset) return;
    calculateLendingWithdrawTransactionEstimate(depositAmount, depositedAsset);
  }, [depositAmount, depositedAsset]);

  let notEnoughForFee;
  if (feeInfo) {
    notEnoughForFee = !isEnoughBalanceForTransactionFee(balances, {
      txFeeInWei: feeInfo.fee,
      amount: depositAmount,
      decimals: depositedAsset?.decimals,
      symbol: selectedAssetSymbol,
      gasToken: feeInfo.gasToken,
    });
  }

  const errorMessage = notEnoughForFee
    ? t('error.notEnoughTokenForFee', { token: feeInfo?.gasToken?.symbol || ETH })
    : estimateErrorMessage;

  const showNextButton = depositAmount !== null; // only if amount input touched
  const isNextButtonDisabled = !!isEstimating
    || !depositAmount
    || !!errorMessage
    || !feeInfo;
  const nextButtonTitle = isEstimating ? t('label.gettingFee') : t('button.next');
  const onNextButtonPress = () => navigation.navigate(
    LENDING_WITHDRAW_TRANSACTION_CONFIRM,
    { amount: depositAmount, asset: depositedAsset },
  );

  const depositedAssetsBalances: Balances = depositedAssets.reduce(
    (balancesObj, { currentBalance: balance, symbol }) => ({ ...balancesObj, [symbol]: { symbol, balance } }),
    {},
  );

  return (
    <ContainerWithHeader
      navigation={navigation}
      headerProps={{ centerItems: [{ title: t('aaveContent.title.withdrawAmountScreen') }] }}
      footer={(
        <FooterInner>
          <FeeInfo alignItems="center">
            {!!feeInfo && (
              <FeeLabelToggle
                labelText={t('label.fee')}
                txFeeInWei={feeInfo?.fee}
                gasToken={feeInfo?.gasToken}
                isLoading={isEstimating}
                hasError={!!errorMessage}
                showFiatDefault
              />
            )}
            {!!errorMessage && (
              <BaseText negative style={{ marginTop: spacing.medium }}>
                {errorMessage}
              </BaseText>
            )}
          </FeeInfo>
          {showNextButton && (
            <Button
              regularText
              block
              disabled={isNextButtonDisabled}
              title={nextButtonTitle}
              onPress={onNextButtonPress}
            />
          )}
        </FooterInner>
      )}
      minAvoidHeight={600}
    >
      <InputWrapper>
        <ValueInput
          value={depositAmount}
          onValueChange={setDepositAmount}
          assetData={depositedAsset}
          onAssetDataChange={({ symbol }) => setSelectedAssetSymbol(symbol)}
          customAssets={depositedAssets}
          customBalances={depositedAssetsBalances}
        />
      </InputWrapper>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  lending: { depositedAssets },
  transactionEstimate: {
    isEstimating,
    feeInfo,
    errorMessage: estimateErrorMessage,
  },
}: RootReducerState): $Shape<Props> => ({
  depositedAssets,
  isEstimating,
  feeInfo,
  estimateErrorMessage,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  calculateLendingWithdrawTransactionEstimate: debounce((
    amount: number,
    depositedAsset: DepositedAsset,
  ) => dispatch(calculateLendingWithdrawTransactionEstimateAction(amount, depositedAsset)), 500),
  resetEstimateTransaction: () => dispatch(resetEstimateTransactionAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(EnterWithdrawAmount);
