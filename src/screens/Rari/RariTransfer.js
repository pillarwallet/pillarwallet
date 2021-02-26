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
import React, { useState, useEffect, useCallback } from 'react';
import { Keyboard } from 'react-native';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import debounce from 'lodash.debounce';
import t from 'translations/translate';

import { BaseText } from 'components/Typography';
import FeeLabelToggle from 'components/FeeLabelToggle';
import Toast from 'components/Toast';

import SendContainer from 'containers/SendContainer';

import { isEnoughBalanceForTransactionFee, convertUSDToFiat } from 'utils/assets';
import { reportErrorLog, noop, parseTokenBigNumberAmount } from 'utils/common';

import { resetEstimateTransactionAction, estimateTransactionAction } from 'actions/transactionEstimateActions';

import { ETH, supportedFiatCurrencies, USD } from 'constants/assetsConstants';
import { RARI_TRANSFER_REVIEW } from 'constants/navigationConstants';
import { RARI_TOKENS_DATA, RARI_TRANSFER_TRANSACTION } from 'constants/rariConstants';

import { accountBalancesSelector } from 'selectors/balances';
import { contactsSelector } from 'selectors';
import { useGasTokenSelector } from 'selectors/smartWallet';

import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { NavigationScreenProp } from 'react-navigation';
import type { TransactionFeeInfo } from 'models/Transaction';
import type { Balances, AssetData, Rates } from 'models/Asset';
import type { RariPool } from 'models/RariPool';
import type { Contact } from 'models/Contact';


type Props = {
  navigation: NavigationScreenProp<*>,
  feeInfo: ?TransactionFeeInfo,
  isEstimating: boolean,
  estimateErrorMessage: ?string,
  userDepositInRariToken: {[RariPool]: number},
  contacts: Contact[],
  estimateTransaction: (recipient: string, value: number, assetData: AssetData) => void,
  useGasToken: boolean,
  balances: Balances,
  resetEstimateTransaction: () => void,
  rariFundBalance: {[RariPool]: number},
  rariTotalSupply: {[RariPool]: number},
  rates: Rates,
};

const renderFeeToggle = (
  txFeeInfo: ?TransactionFeeInfo,
  showFee: boolean,
  feeError: ?string,
  isLoading: boolean,
  enoughBalance: boolean,
) => {
  if (!showFee || !txFeeInfo) return null;

  const { fee, gasToken } = txFeeInfo;

  return (
    <>
      <FeeLabelToggle txFeeInWei={fee} gasToken={gasToken} isLoading={isLoading} hasError={!enoughBalance} />
      {!!feeError && <BaseText style={{ marginTop: 15 }} center secondary>{feeError}</BaseText>}
    </>
  );
};

const RariTransferScreen = ({
  navigation,
  feeInfo,
  isEstimating,
  estimateErrorMessage,
  userDepositInRariToken,
  contacts,
  estimateTransaction,
  useGasToken,
  balances,
  resetEstimateTransaction,
  rariFundBalance,
  rariTotalSupply,
  rates,
}: Props) => {
  const [amount, setAmount] = useState('');
  const [inputIsValid, setInputIsValid] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [submitPressed, setSubmitPressed] = useState(false);

  useEffect(() => {
    resetEstimateTransaction();
  }, []);

  const { rariPool } = navigation.state.params;
  const rariTokenData = {
    ...RARI_TOKENS_DATA[rariPool],
  };

  const customBalances = {
    ...balances,
    [RARI_TOKENS_DATA[rariPool].symbol]: {
      symbol: RARI_TOKENS_DATA[rariPool].symbol,
      balance: userDepositInRariToken[rariPool],
    },
  };

  const updateTxFee = () => {
    const value = Number(amount || 0);
    if ((!inputIsValid || value === 0) || !selectedContact) {
      return;
    }
    estimateTransaction(selectedContact.ethAddress, value, rariTokenData);
  };

  const updateTxFeeDebounced = useCallback(
    debounce(updateTxFee, 100),
    [amount, selectedContact, useGasToken],
  );

  useEffect(() => {
    updateTxFeeDebounced();
    return updateTxFeeDebounced.cancel;
  }, [updateTxFeeDebounced]);

  const handleFormSubmit = async () => {
    if (submitPressed) return; // double press

    if (!feeInfo || !selectedContact) {
      // something went wrong
      Toast.show({
        message: t('toast.cannotSendAsset'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });
      reportErrorLog('SendAsset screen handleFormSubmit failed', { feeInfo, selectedContact });
      return;
    }

    setSubmitPressed(true);

    const amountBN = parseTokenBigNumberAmount(amount, rariTokenData.decimals);

    // $FlowFixMe
    const transactionPayload: TokenTransactionPayload = {
      to: selectedContact.ethAddress,
      receiverEnsName: selectedContact.ensName,
      amount: amount || 0,
      txFeeInWei: feeInfo.fee,
      symbol: rariTokenData.symbol,
      contractAddress: rariTokenData.contractAddress,
      decimals: rariTokenData.decimals,
      tag: RARI_TRANSFER_TRANSACTION,
      extra: {
        amount: amountBN,
        symbol: rariTokenData.symbol,
        contactAddress: selectedContact.ethAddress,
        recipient: selectedContact.ensName || selectedContact.ethAddress,
        rariPool,
      },
    };

    if (feeInfo?.gasToken) transactionPayload.gasToken = feeInfo.gasToken;

    Keyboard.dismiss();
    setSubmitPressed(false);
    navigation.navigate(RARI_TRANSFER_REVIEW, {
      transactionPayload,
      amount,
      rariPool,
      receiverAddress: selectedContact.ethAddress,
    });
  };

  const handleSelectContact = (value: ?Contact) => {
    if (!value?.ethAddress) {
      setSelectedContact(null);
    }

    setSelectedContact(value);
  };

  let enoughBalanceForTransaction = true;
  if (feeInfo && inputIsValid) {
    enoughBalanceForTransaction = isEnoughBalanceForTransactionFee(customBalances, {
      txFeeInWei: feeInfo.fee,
      gasToken: feeInfo.gasToken,
      decimals: rariTokenData.decimals,
      amount,
      symbol: rariTokenData.symbol,
    });
  }
  const errorMessage = !enoughBalanceForTransaction
    ? t('error.notEnoughTokenForFeeExtended', { token: feeInfo?.gasToken?.symbol || ETH })
    : estimateErrorMessage;
  const showNextButton = inputIsValid && !!selectedContact && !!parseFloat(amount);
  const isNextButtonDisabled = !feeInfo || !!errorMessage || !inputIsValid;

  const hasAllFeeData = !isEstimating && !!selectedContact;
  const showFee = hasAllFeeData && inputIsValid;

  const rftExchangeRateUsd = rariFundBalance[rariPool] / rariTotalSupply[rariPool];
  const rariTokenSymbol = RARI_TOKENS_DATA[rariPool].symbol;
  const customRates = {
    [rariTokenSymbol]: {
      USD: rftExchangeRateUsd,
    },
  };

  supportedFiatCurrencies.forEach(currency => {
    if (currency !== USD) {
      customRates[rariTokenSymbol][currency] = convertUSDToFiat(rftExchangeRateUsd, rates, currency);
    }
  });

  return (
    <SendContainer
      customScreenTitle={t('rariContent.title.transferScreen')}
      customSelectorProps={{
        contacts,
        selectedContact,
        onSelectContact: handleSelectContact,
      }}
      customValueSelectorProps={{
        assetData: rariTokenData,
        onAssetDataChange: noop,
        customAssets: [rariTokenData],
        value: amount,
        onValueChange: setAmount,
        customBalances,
        onFormValid: setInputIsValid,
        customRates,
      }}
      footerProps={{
        isNextButtonVisible: showNextButton,
        buttonProps: {
          onPress: handleFormSubmit,
          isLoading: submitPressed,
          disabled: isNextButtonDisabled,
        },
        footerTopAddon:
          !!selectedContact &&
          renderFeeToggle(feeInfo, showFee, errorMessage, isEstimating, enoughBalanceForTransaction),
        isLoading: isEstimating,
      }}
    />
  );
};

const mapStateToProps = ({
  transactionEstimate: {
    feeInfo,
    isEstimating,
    errorMessage: estimateErrorMessage,
  },
  rari: {
    userDepositInRariToken,
    rariFundBalance,
    rariTotalSupply,
  },
  rates: { data: rates },
}: RootReducerState): $Shape<Props> => ({
  feeInfo,
  isEstimating,
  estimateErrorMessage,
  userDepositInRariToken,
  rariFundBalance,
  rariTotalSupply,
  rates,
});

const structuredSelector = createStructuredSelector({
  contacts: contactsSelector,
  useGasToken: useGasTokenSelector,
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  resetEstimateTransaction: () => dispatch(resetEstimateTransactionAction()),
  estimateTransaction: (
    recipient: string,
    value: number,
    assetData: AssetData,
  ) => dispatch(estimateTransactionAction(recipient, value, null, assetData)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(RariTransferScreen);
