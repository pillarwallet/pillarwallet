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
import get from 'lodash.get';
import debounce from 'lodash.debounce';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// actions
import { calculateLendingWithdrawTransactionEstimateAction } from 'actions/lendingActions';

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
import { useGasTokenSelector } from 'selectors/smartWallet';
import { accountBalancesSelector } from 'selectors/balances';

// utils
import { spacing } from 'utils/variables';
import { isEnoughBalanceForTransactionFee } from 'utils/assets';
import { buildTxFeeInfo } from 'utils/smartWallet';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Balances, DepositedAsset } from 'models/Asset';


type Props = {
  depositedAssets: DepositedAsset[],
  navigation: NavigationScreenProp<*>,
  isCalculatingWithdrawTransactionEstimate: boolean,
  withdrawTransactionEstimate: ?Object,
  calculateLendingWithdrawTransactionEstimate: (amount: number, asset: DepositedAsset) => void,
  useGasToken: boolean,
  balances: Balances,
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

const NotEnoughFee = styled(BaseText)`
  margin-top: ${spacing.medium}px;
`;

const InputWrapper = styled.View`
  padding: 24px 40px 0;
`;

const EnterWithdrawAmount = ({
  navigation,
  depositedAssets,
  withdrawTransactionEstimate,
  isCalculatingWithdrawTransactionEstimate,
  calculateLendingWithdrawTransactionEstimate,
  useGasToken,
  balances,
}: Props) => {
  const preselectedAssetSymbol: string = navigation.getParam('symbol');
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState(preselectedAssetSymbol);
  const [depositAmount, setDepositAmount] = useState('');

  const depositedAsset = depositedAssets.find(({ symbol }) => symbol === selectedAssetSymbol);

  useEffect(() => {
    if (!depositAmount || !depositedAsset) return;
    calculateLendingWithdrawTransactionEstimate(depositAmount, depositedAsset);
  }, [depositAmount, depositedAsset]);

  const txFeeInfo = buildTxFeeInfo(withdrawTransactionEstimate, useGasToken);
  const gasTokenSymbol = get(txFeeInfo?.gasToken, 'symbol', ETH);
  const showTxFee = !!depositAmount && (!!txFeeInfo?.fee || isCalculatingWithdrawTransactionEstimate);
  const isEnoughForFee = !!txFeeInfo?.fee && isEnoughBalanceForTransactionFee(balances, {
    txFeeInWei: txFeeInfo.fee,
    amount: depositAmount,
    decimals: depositedAsset?.decimals,
    symbol: selectedAssetSymbol,
    gasToken: txFeeInfo.gasToken,
  });

  const showNextButton = depositAmount !== null; // only if amount input touched
  const isNextButtonDisabled = !!isCalculatingWithdrawTransactionEstimate
    || !depositAmount
    || !isEnoughForFee
    || (!!txFeeInfo?.fee && !txFeeInfo.fee.gt(0));
  const nextButtonTitle = isCalculatingWithdrawTransactionEstimate ? t('label.gettingFee') : t('button.next');
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
          {showTxFee && (
            <FeeInfo alignItems="center">
              <FeeLabelToggle
                labelText={t('label.fee')}
                txFeeInWei={txFeeInfo?.fee}
                gasToken={txFeeInfo?.gasToken}
                isLoading={isCalculatingWithdrawTransactionEstimate}
                hasError={!isCalculatingWithdrawTransactionEstimate && !isEnoughForFee}
                showFiatDefault
              />
              {!isCalculatingWithdrawTransactionEstimate && !isEnoughForFee && (
                <NotEnoughFee negative>
                  {t('error.notEnoughTokenForFee', { token: gasTokenSymbol })}
                </NotEnoughFee>
              )}
            </FeeInfo>
          )}
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
  lending: { depositedAssets, isCalculatingWithdrawTransactionEstimate, withdrawTransactionEstimate },
}: RootReducerState): $Shape<Props> => ({
  depositedAssets,
  isCalculatingWithdrawTransactionEstimate,
  withdrawTransactionEstimate,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  useGasToken: useGasTokenSelector,
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
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(EnterWithdrawAmount);
