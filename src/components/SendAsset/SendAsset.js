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
import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Keyboard } from 'react-native';
import debounce from 'lodash.debounce';
import get from 'lodash.get';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';

// actions
import { estimateTransactionAction, resetEstimateTransactionAction } from 'actions/transactionEstimateActions';

// constants
import { SEND_COLLECTIBLE_CONFIRM, SEND_TOKEN_CONFIRM } from 'constants/navigationConstants';
import { COLLECTIBLES } from 'constants/assetsConstants';

// components
import Button from 'components/Button';
import FeeLabelToggle from 'components/FeeLabelToggle';
import SendContainer from 'containers/SendContainer';
import Toast from 'components/Toast';

// utils
import { wrapBigNumber, truncateAmount, reportErrorLog } from 'utils/common';
import { getBalanceBN, isEnoughBalanceForTransactionFee } from 'utils/assets';

// selectors
import { useGasTokenSelector } from 'selectors/archanova';
import { contactsSelector } from 'selectors';
import { visibleActiveAccountAssetsWithBalanceSelector } from 'selectors/assets';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type {
  TransactionPayload,
  TransactionFeeInfo,
  TransactionToEstimate,
} from 'models/Transaction';
import type { AssetData, AssetOption } from 'models/Asset';
import type { Collectible } from 'models/Collectible';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { SessionData } from 'models/Session';
import type { Contact } from 'models/Contact';
import type { WalletAssetsBalances } from 'models/Balances';


type Props = {
  defaultContact: ?Contact,
  source: string,
  navigation: NavigationScreenProp<*>,
  balances: WalletAssetsBalances,
  session: SessionData,
  useGasToken: boolean,
  assetsWithBalance: AssetOption[],
  contacts: Contact[],
  feeInfo: ?TransactionFeeInfo,
  isEstimating: boolean,
  estimateErrorMessage: ?string,
  resetEstimateTransaction: () => void,
  estimateTransaction: (transaction: TransactionToEstimate) => void,
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
      {!!feeError && <Button disabled title={feeError} style={{ marginTop: 15 }} />}
    </>
  );
};

// TODO: map collectible params
const mapToAssetDataType = ({
  contractAddress,
  address,
  symbol: token,
  decimals,
  tokenType,
  tokenId,
  name,
}: Object): AssetData => ({
  contractAddress: address || contractAddress,
  token,
  decimals,
  tokenType,
  id: tokenId,
  name,
});

const SendAsset = ({
  source,
  navigation,
  balances,
  session,
  useGasToken,
  assetsWithBalance,
  contacts,
  defaultContact,
  feeInfo,
  isEstimating,
  estimateErrorMessage,
  estimateTransaction,
  resetEstimateTransaction,
}: Props) => {
  const defaultAssetData = navigation.getParam('assetData');
  const defaultAssetOption = defaultAssetData && {
    ...defaultAssetData,
    symbol: defaultAssetData.token,
  };
  const [assetData, setAssetData] = useState<AssetOption | Collectible>(defaultAssetOption || assetsWithBalance[0]);
  const [amount, setAmount] = useState('');
  const [inputIsValid, setInputIsValid] = useState(false);
  const [selectedContact, setSelectedContact] = useState(defaultContact);
  const [submitPressed, setSubmitPressed] = useState(false);

  const token = get(assetData, 'token');
  const balance = getBalanceBN(balances, token);
  const currentValue = wrapBigNumber(amount || 0);

  const isCollectible = assetData?.tokenType === COLLECTIBLES;

  const isValidAmount = (currentValue.isFinite() && !currentValue.isZero()) || isCollectible;

  const isAboveBalance = currentValue.gt(balance);

  const updateTxFee = () => {
    // specified amount is always valid and not necessarily matches input amount
    if ((!isCollectible && (!isValidAmount || isAboveBalance)) || !assetData || !selectedContact) {
      return;
    }

    estimateTransaction({
      to: selectedContact.ethAddress,
      value: currentValue.toString(),
      assetData: mapToAssetDataType(assetData),
    });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateTxFeeDebounced = useCallback(
    debounce(updateTxFee, 100),
    [amount, selectedContact, useGasToken, assetData],
  );

  useEffect(() => {
    updateTxFeeDebounced();
    return updateTxFeeDebounced.cancel;
  }, [updateTxFeeDebounced]);

  // initial
  useEffect(() => {
    resetEstimateTransaction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFormSubmit = async () => {
    if (submitPressed) return; // double press

    if (!feeInfo || !selectedContact || !assetData) {
      // something went wrong
      Toast.show({
        message: t('toast.cannotSendAsset'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });
      reportErrorLog('SendAsset screen handleFormSubmit failed', { feeInfo, selectedContact, assetData });
      return;
    }

    setSubmitPressed(true);

    if (assetData.tokenType === COLLECTIBLES) {
      setSubmitPressed(false);
      navigation.navigate(SEND_COLLECTIBLE_CONFIRM, {
        assetData,
        receiver: selectedContact.ethAddress,
        source,
        receiverEnsName: selectedContact.ensName,
      });
      return;
    }

    // $FlowFixMe
    const transactionPayload: TransactionPayload = {
      to: selectedContact.ethAddress,
      // $FlowFixMe: flow update to 0.122
      receiverEnsName: selectedContact.ensName,
      amount: truncateAmount(currentValue.toString(), assetData.decimals),
      // $FlowFixMe: bignumber.js types
      txFeeInWei: feeInfo.fee,
      // $FlowFixMe: flow update to 0.122
      symbol: assetData.token,
      // $FlowFixMe: flow update to 0.122
      contractAddress: assetData.contractAddress,
      // $FlowFixMe: flow update to 0.122
      decimals: assetData.decimals,
    };

    if (feeInfo?.gasToken) transactionPayload.gasToken = feeInfo.gasToken;

    Keyboard.dismiss();
    setSubmitPressed(false);
    navigation.navigate(SEND_TOKEN_CONFIRM, {
      transactionPayload,
      source,
    });
  };

  const calculateBalancePercentTxFee = async (assetSymbol: string, percentageModifier: number) => {
    const calculatedBalanceAmount = balance.multipliedBy(percentageModifier);

    // update fee only on max balance
    if (percentageModifier === 1.00 && selectedContact) {
      // await needed for initial max available send calculation to get estimate before showing max available after fees
      await estimateTransaction({
        to: selectedContact.ethAddress,
        value: calculatedBalanceAmount.toString(),
        assetData: mapToAssetDataType(assetData),
      });
    }

    return null;
  };

  const hasAllFeeData = !isEstimating && !!selectedContact;

  const showFeeForAsset = !isAboveBalance && hasAllFeeData && isValidAmount;
  const showFee = isCollectible ? hasAllFeeData : showFeeForAsset;

  const hasAllData = isCollectible
    ? (!!selectedContact && !!assetData)
    : (inputIsValid && !!selectedContact && !!currentValue);

  // perform actual balance check only if all values set
  let enoughBalanceForTransaction = true;
  if (feeInfo && assetData && isValidAmount) {
    enoughBalanceForTransaction = isEnoughBalanceForTransactionFee(balances, {
      txFeeInWei: feeInfo.fee,
      gasToken: feeInfo.gasToken,
      // $FlowFixMe: collectible does not have `decimals`
      decimals: assetData.decimals,
      amount,
      symbol: token,
    });
  }

  const errorMessage = !enoughBalanceForTransaction
    ? t('label.notEnoughGas')
    : estimateErrorMessage;

  // note: fee toggle component renders one more button on error message, no need to show disabled next button
  const showNextButton = hasAllData && (!errorMessage || isEstimating);

  const isNextButtonDisabled = !session.isOnline || !feeInfo || !!errorMessage || !inputIsValid || !isValidAmount;

  return (
    <SendContainer
      customSelectorProps={{
        contacts,
        selectedContact,
        onSelectContact: setSelectedContact,
      }}
      customValueSelectorProps={{
        value: amount,
        onValueChange: setAmount,
        assetData,
        onAssetDataChange: (asset) => setAssetData(asset),
        onCollectibleAssetDataChange: (collectible) => setAssetData(collectible),
        showCollectibles: true,
        txFeeInfo: feeInfo,
        updateTxFee: calculateBalancePercentTxFee,
        onFormValid: setInputIsValid,
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
}: RootReducerState): $Shape<Props> => ({
  feeInfo,
  isEstimating,
  estimateErrorMessage,
});

const structuredSelector = createStructuredSelector({
  useGasToken: useGasTokenSelector,
  assetsWithBalance: visibleActiveAccountAssetsWithBalanceSelector,
  contacts: contactsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  resetEstimateTransaction: () => dispatch(resetEstimateTransactionAction()),
  estimateTransaction: (transaction: TransactionToEstimate) => dispatch(estimateTransactionAction(transaction)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SendAsset);
