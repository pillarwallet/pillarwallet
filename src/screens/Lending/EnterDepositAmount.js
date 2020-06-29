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
import isEmpty from 'lodash.isempty';
import type { NavigationScreenProp } from 'react-navigation';

// actions
import { calculateLendingDepositTransactionEstimateAction, fetchAssetsToDepositAction } from 'actions/lendingActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { BaseText, TextLink } from 'components/Typography';
import FeeLabelToggle from 'components/FeeLabelToggle';
import Button from 'components/Button';
import { ValueSelectorCard } from 'components/ValueSelectorCard';
import Spinner from 'components/Spinner';

// constants
import { ETH } from 'constants/assetsConstants';
import { LENDING_DEPOSIT_TRANSACTION_CONFIRM } from 'constants/navigationConstants';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { useGasTokenSelector } from 'selectors/smartWallet';

// utils
import { formatAmountDisplay } from 'utils/common';
import { fontStyles, spacing } from 'utils/variables';
import { isEnoughBalanceForTransactionFee } from 'utils/assets';
import { buildTxFeeInfo } from 'utils/smartWallet';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { AssetToDeposit, Balances, Rates } from 'models/Asset';


type Props = {
  assetsToDeposit: AssetToDeposit[],
  baseFiatCurrency: ?string,
  rates: Rates,
  balances: Balances,
  navigation: NavigationScreenProp<*>,
  isCalculatingDepositTransactionEstimate: boolean,
  depositTransactionEstimate: ?Object,
  calculateLendingDepositTransactionEstimate: (amount: number, asset: AssetToDeposit) => void,
  useGasToken: boolean,
  isFetchingAssetsToDeposit: boolean,
  fetchAssetsToDeposit: () => void,
};

const CurrentInterestRate = styled.View`
  flex-direction: row;
  margin: ${spacing.large}px ${spacing.large}px ${spacing.large}px;
  justify-content: center;
  align-items: center;
`;

const FeeInfo = styled.View`
  align-items: center;
  margin-bottom: ${spacing.large}px;
`;

const InterestRate = styled(TextLink)`
  ${fontStyles.regular};
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

const EnterDepositAmount = ({
  navigation,
  balances,
  assetsToDeposit,
  baseFiatCurrency,
  rates,
  depositTransactionEstimate,
  isCalculatingDepositTransactionEstimate,
  calculateLendingDepositTransactionEstimate,
  useGasToken,
  fetchAssetsToDeposit,
  isFetchingAssetsToDeposit,
}: Props) => {
  const preselectedAssetSymbol: string = navigation.getParam('symbol');
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState(preselectedAssetSymbol);
  const [depositAmount, setDepositAmount] = useState(null);

  const assetToDeposit = assetsToDeposit.find(({ symbol }) => symbol === selectedAssetSymbol);

  useEffect(() => {
    if (!isEmpty(assetsToDeposit) || isFetchingAssetsToDeposit) return;
    fetchAssetsToDeposit();
  }, [assetsToDeposit]);

  useEffect(() => {
    if (!depositAmount) return;
    calculateLendingDepositTransactionEstimate(depositAmount, assetToDeposit);
  }, [depositAmount, selectedAssetSymbol]);

  const txFeeInfo = buildTxFeeInfo(depositTransactionEstimate || {}, useGasToken);
  const gasTokenSymbol = get(txFeeInfo?.gasToken, 'symbol', ETH);
  const showTxFee = !!depositAmount && (!!txFeeInfo?.fee || isCalculatingDepositTransactionEstimate);
  const isEnoughForFee = !!txFeeInfo?.fee && isEnoughBalanceForTransactionFee(balances, {
    txFeeInWei: txFeeInfo.fee,
    amount: depositAmount,
    decimals: assetToDeposit?.decimals,
    symbol: selectedAssetSymbol,
    gasToken: txFeeInfo.gasToken,
  });

  const showNextButton = depositAmount !== null; // only if amount input touched
  const isNextButtonDisabled = !!isCalculatingDepositTransactionEstimate
    || !depositAmount
    || !isEnoughForFee
    || (!!txFeeInfo?.fee && !txFeeInfo.fee.gt(0));
  const nextButtonTitle = isCalculatingDepositTransactionEstimate ? 'Getting fee..' : 'Next';
  const onNextButtonPress = () => navigation.navigate(
    LENDING_DEPOSIT_TRANSACTION_CONFIRM,
    { amount: depositAmount, asset: assetToDeposit },
  );

  const assetSelectOptions = assetsToDeposit.reduce((assetsObject, asset) => ({
    ...assetsObject,
    [asset.symbol]: asset,
  }), {});

  const onValueChanged = (value) => {
    if (!value) {
      if (depositAmount) setDepositAmount(0);
      return;
    }

    const { symbol: selectedValueSymbol, input: newAmount } = value;
    if (selectedValueSymbol && selectedValueSymbol !== selectedAssetSymbol) {
      setSelectedAssetSymbol(selectedValueSymbol);
    }

    if (newAmount !== depositAmount) {
      setDepositAmount(Number(newAmount));
    } else if (!newAmount && depositAmount) {
      setDepositAmount(0);
    }
  };

  return (
    <ContainerWithHeader
      navigation={navigation}
      headerProps={{ centerItems: [{ title: 'Add deposit' }] }}
      footer={(
        <FooterInner>
          {showTxFee && (
            <FeeInfo alignItems="center">
              <FeeLabelToggle
                labelText="Fee"
                txFeeInWei={txFeeInfo?.fee}
                gasToken={txFeeInfo?.gasToken}
                isLoading={isCalculatingDepositTransactionEstimate}
                showFiatDefault
              />
              {!isCalculatingDepositTransactionEstimate && !isEnoughForFee && (
                <NotEnoughFee negative>Not enough {gasTokenSymbol} for transaction fee</NotEnoughFee>
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
      minAvoidHeight={200}
    >
      {isFetchingAssetsToDeposit && <Spinner style={{ marginTop: spacing.large, alignSelf: 'center' }} />}
      {!isFetchingAssetsToDeposit && (
        <ValueSelectorCard
          preselectedAsset={preselectedAssetSymbol}
          assets={assetSelectOptions}
          balances={balances}
          baseFiatCurrency={baseFiatCurrency}
          rates={rates}
          maxLabel="Use max"
          getFormValue={onValueChanged}
        />
      )}
      {!isFetchingAssetsToDeposit && (
        <CurrentInterestRate>
          <BaseText secondary>Current APY</BaseText>
          <InterestRate>&nbsp;{formatAmountDisplay(assetToDeposit?.earnInterestRate)}%</InterestRate>
        </CurrentInterestRate>
      )}
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  lending: {
    assetsToDeposit,
    isCalculatingDepositTransactionEstimate,
    depositTransactionEstimate,
    isFetchingAssetsToDeposit,
  },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
}: RootReducerState): $Shape<Props> => ({
  assetsToDeposit,
  rates,
  baseFiatCurrency,
  isCalculatingDepositTransactionEstimate,
  depositTransactionEstimate,
  isFetchingAssetsToDeposit,
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
  calculateLendingDepositTransactionEstimate: (
    amount: number,
    asset: AssetToDeposit,
  ) => dispatch(calculateLendingDepositTransactionEstimateAction(amount, asset)),
  fetchAssetsToDeposit: () => dispatch(fetchAssetsToDepositAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(EnterDepositAmount);
