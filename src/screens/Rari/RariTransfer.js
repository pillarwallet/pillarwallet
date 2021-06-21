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

// components
import { BaseText } from 'components/Typography';
import FeeLabelToggle from 'components/FeeLabelToggle';
import Toast from 'components/Toast';

// containers
import SendContainer from 'containers/SendContainer';

// utils
import { isEnoughBalanceForTransactionFee, convertUSDToFiat } from 'utils/assets';
import { reportErrorLog, noop, parseTokenBigNumberAmount } from 'utils/common';

// actions
import { resetEstimateTransactionAction, estimateTransactionAction } from 'actions/transactionEstimateActions';

// constants
import { ETH, supportedFiatCurrencies, USD } from 'constants/assetsConstants';
import { RARI_TRANSFER_REVIEW } from 'constants/navigationConstants';
import { RARI_TOKENS_DATA, RARI_TRANSFER_TRANSACTION } from 'constants/rariConstants';
import { CHAIN } from 'constants/chainConstants';

// selectors
import { accountEthereumWalletAssetsBalancesSelector } from 'selectors/balances';
import { contactsSelector, useChainRates } from 'selectors';
import { useGasTokenSelector } from 'selectors/archanova';

// types
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { NavigationScreenProp } from 'react-navigation';
import type { TransactionFeeInfo, TransactionToEstimate } from 'models/Transaction';
import type { RariPool } from 'models/RariPool';
import type { Contact } from 'models/Contact';
import type { WalletAssetsBalances } from 'models/Balances';


type Props = {
  navigation: NavigationScreenProp<*>,
  feeInfo: ?TransactionFeeInfo,
  isEstimating: boolean,
  estimateErrorMessage: ?string,
  userDepositInRariToken: {[RariPool]: number},
  contacts: Contact[],
  estimateTransaction: (transaction: TransactionToEstimate) => void,
  useGasToken: boolean,
  balances: WalletAssetsBalances,
  resetEstimateTransaction: () => void,
  rariFundBalance: {[RariPool]: number},
  rariTotalSupply: {[RariPool]: number},
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
      <FeeLabelToggle
        txFeeInWei={fee}
        gasToken={gasToken}
        chain={CHAIN.ETHEREUM}
        isLoading={isLoading}
        hasError={!enoughBalance}
      />
      {!!feeError && (
        <BaseText style={{ marginTop: 15 }} center secondary>
          {feeError}
        </BaseText>
      )}
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
}: Props) => {
  const [amount, setAmount] = useState('');
  const [inputIsValid, setInputIsValid] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [submitPressed, setSubmitPressed] = useState(false);

  const ethereumRates = useChainRates(CHAIN.ETHEREUM);

  useEffect(() => {
    resetEstimateTransaction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    estimateTransaction({ to: selectedContact.ethAddress, value, data: rariTokenData });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const transactionPayload: TransactionPayload = {
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

  let enoughBalanceForTransaction = true;
  if (feeInfo && inputIsValid) {
    const balanceCheckTransaction = {
      txFeeInWei: feeInfo.fee,
      gasToken: feeInfo.gasToken,
      decimals: rariTokenData.decimals,
      amount,
      symbol: rariTokenData.symbol,
    };
    enoughBalanceForTransaction = isEnoughBalanceForTransactionFee(
      customBalances,
      balanceCheckTransaction,
      CHAIN.ETHEREUM,
    );
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
      customRates[rariTokenSymbol][currency] = convertUSDToFiat(
        rftExchangeRateUsd,
        ethereumRates,
        currency,
      );
    }
  });

  return (
    <SendContainer
      customScreenTitle={t('rariContent.title.transferScreen')}
      customSelectorProps={{
        contacts,
        selectedContact,
        onSelectContact: setSelectedContact,
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
}: RootReducerState): $Shape<Props> => ({
  feeInfo,
  isEstimating,
  estimateErrorMessage,
  userDepositInRariToken,
  rariFundBalance,
  rariTotalSupply,
});

const structuredSelector = createStructuredSelector({
  contacts: contactsSelector,
  useGasToken: useGasTokenSelector,
  balances: accountEthereumWalletAssetsBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  resetEstimateTransaction: () => dispatch(resetEstimateTransactionAction()),
  estimateTransaction: (
    transaction: TransactionToEstimate,
  ) => dispatch(estimateTransactionAction(transaction, CHAIN.ETHEREUM)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(RariTransferScreen);
