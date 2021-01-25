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
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import debounce from 'lodash.debounce';
import { useDebounce } from 'use-debounce';
import t from 'translations/translate';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { BaseText } from 'components/Typography';
import { Spacing } from 'components/Layout';
import ValueInput from 'components/ValueInput';
import Button from 'components/Button';
import FeeLabelToggle from 'components/FeeLabelToggle';
import Toast from 'components/Toast';

import { getRariDepositTransactionsAndExchangeFee } from 'utils/rari';
import { isEnoughBalanceForTransactionFee } from 'utils/assets';
import { reportErrorLog, formatUnits } from 'utils/common';

import { calculateRariDepositTransactionEstimateAction } from 'actions/rariActions';
import { resetEstimateTransactionAction, setEstimatingTransactionAction } from 'actions/transactionEstimateActions';

import { ETH } from 'constants/assetsConstants';
import { RARI_ADD_DEPOSIT_REVIEW } from 'constants/navigationConstants';

import { accountAssetsSelector } from 'selectors/assets';
import { activeAccountAddressSelector } from 'selectors/selectors';
import { accountBalancesSelector } from 'selectors/balances';

import { NotEnoughLiquidityError } from 'services/0x';

import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { NavigationScreenProp } from 'react-navigation';
import type { TransactionFeeInfo } from 'models/Transaction';
import type { Rates, Asset, Balances, Assets } from 'models/Asset';
import type { RariPool } from 'models/RariPool';


type Props = {
  assets: Assets,
  navigation: NavigationScreenProp<*>,
  rariApy: {[RariPool]: number},
  calculateRariDepositTransactionEstimate: (Object[]) => void,
  supportedAssets: Asset[],
  feeInfo: ?TransactionFeeInfo,
  isEstimating: boolean,
  estimateErrorMessage: ?string,
  resetEstimateTransaction: () => void,
  activeAccountAddress: string,
  rates: Rates,
  setEstimatingTransaction: (boolean) => void,
  balances: Balances,
};

const FooterWrapper = styled.View`
  padding: 24px 20px;
  align-items: center;
  width: 100%;
`;

const ValueInputWrapper = styled.View`
  padding: 24px 40px;
  align-items: center;
`;

const RariAddDepositScreen = ({
  assets, navigation, rariApy, calculateRariDepositTransactionEstimate, supportedAssets, feeInfo,
  isEstimating, estimateErrorMessage, resetEstimateTransaction, activeAccountAddress, rates, setEstimatingTransaction,
  balances,
}: Props) => {
  useEffect(() => {
    resetEstimateTransaction();
  }, []);

  const [selectedAsset, setSelectedAsset] = useState(assets[ETH]);
  const [assetValue, setAssetValue] = useState('');
  const [transactionPayload, setTransactionPayload] = useState(null);
  const [exchangeFeeBN, setExchangeFee] = useState(null);
  const [slippage, setSlippage] = useState(null);
  const [inputValid, setInputValid] = useState(false);

  const [debouncedAssetValue] = useDebounce(assetValue, 500);

  const rariPool = navigation.getParam('rariPool');

  let notEnoughForFee = false;
  if (feeInfo && parseFloat(assetValue)) {
    notEnoughForFee = !isEnoughBalanceForTransactionFee(balances, {
      txFeeInWei: feeInfo.fee,
      amount: assetValue,
      decimals: selectedAsset?.decimals,
      symbol: selectedAsset?.symbol,
      gasToken: feeInfo.gasToken,
    });
  }

  const errorMessage = notEnoughForFee
    ? t('error.notEnoughTokenForFee', { token: feeInfo?.gasToken?.symbol || ETH })
    : estimateErrorMessage;

  useEffect(() => {
    if (!assetValue || !parseFloat(assetValue) || !selectedAsset) return;
    setEstimatingTransaction(true);
    getRariDepositTransactionsAndExchangeFee(
      rariPool,
      activeAccountAddress,
      assetValue,
      selectedAsset,
      supportedAssets,
      rates,
    ).then((txsAndExchangeFee) => {
      if (!txsAndExchangeFee) {
        Toast.show({
          message: t('toast.rariServiceFailed'),
          emoji: 'hushed',
        });
        setEstimatingTransaction(false);
        return;
      }
      const { depositTransactions, exchangeFeeBN: _exchangeFeeBN, slippage: _slippage } = txsAndExchangeFee;
      if (selectedAsset.symbol === ETH && parseFloat(formatUnits(_exchangeFeeBN, 18)) > parseFloat(assetValue)) {
        Toast.show({
          message: t('toast.rariNotEnoughEthForExchange'),
          emoji: 'hushed',
        });
        setEstimatingTransaction(false);
        return;
      }
      let _transactionPayload = depositTransactions[0];

      // check if there's approve transaction
      if (depositTransactions.length > 1) {
        _transactionPayload = {
          ..._transactionPayload,
          sequentialSmartWalletTransactions: depositTransactions.slice(1), // take the rest except first,
        };
      }
      setTransactionPayload(_transactionPayload);
      setExchangeFee(_exchangeFeeBN);
      setSlippage(_slippage);
      calculateRariDepositTransactionEstimate(depositTransactions);
    }).catch((error) => {
      if (error instanceof NotEnoughLiquidityError) {
        Toast.show({
          message: t('toast.rariNotEnoughLiquidity'),
          emoji: 'hushed',
        });
      } else {
        reportErrorLog('Rari service failed: Error creating transaction payload', { error });
        Toast.show({
          message: t('toast.rariServiceFailed'),
          emoji: 'hushed',
        });
      }
      setEstimatingTransaction(false);
    });
  }, [debouncedAssetValue, selectedAsset]);

  const onNextButtonPress = () => {
    navigation.navigate(RARI_ADD_DEPOSIT_REVIEW, {
      rariPool,
      assetSymbol: selectedAsset.symbol,
      amount: assetValue,
      transactionPayload,
      exchangeFeeBN,
      slippage,
    });
  };

  const nextButtonTitle = isEstimating ? t('label.gettingFee') : t('button.next');
  const isNextButtonDisabled = !!isEstimating
    || !assetValue
    || !!errorMessage
    || !inputValid
    || !feeInfo;

  return (
    <ContainerWithHeader
      inset={{ bottom: 'never' }}
      headerProps={{
        centerItems: [{ title: t('rariContent.title.addDepositScreen') }],
      }}
      footer={(
        <FooterWrapper>
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
          <Spacing h={16} />
          <Button
            title={nextButtonTitle}
            onPress={onNextButtonPress}
            block
            disabled={isNextButtonDisabled}
          />
        </FooterWrapper>
      )}
    >
      <ValueInputWrapper>
        <ValueInput
          assetData={selectedAsset}
          onAssetDataChange={setSelectedAsset}
          value={assetValue}
          onValueChange={setAssetValue}
          onFormValid={setInputValid}
        />
        <Spacing h={24} />
        <BaseText regular secondary>{t('rariContent.label.currentAPY')}{' '}
          <BaseText>{t('percentValue', { value: rariApy[rariPool].toFixed(2) })}</BaseText>
        </BaseText>
      </ValueInputWrapper>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  rari: {
    rariApy,
  },
  rates: { data: rates },
  assets: { supportedAssets },
  transactionEstimate: { feeInfo, isEstimating, errorMessage: estimateErrorMessage },
}: RootReducerState): $Shape<Props> => ({
  rariApy,
  rates,
  supportedAssets,
  feeInfo,
  estimateErrorMessage,
  isEstimating,
});

const structuredSelector = createStructuredSelector({
  assets: accountAssetsSelector,
  activeAccountAddress: activeAccountAddressSelector,
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState, props: Props): $Shape<Props> => ({
  ...structuredSelector(state, props),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  calculateRariDepositTransactionEstimate: debounce((
    rariDepositTransactions: Object[],
  ) => dispatch(calculateRariDepositTransactionEstimateAction(rariDepositTransactions)), 500),
  resetEstimateTransaction: () => dispatch(resetEstimateTransactionAction()),
  setEstimatingTransaction: (isEstimating: boolean) => dispatch(setEstimatingTransactionAction(isEstimating)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(RariAddDepositScreen);
