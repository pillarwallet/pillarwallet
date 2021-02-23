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
import isEmpty from 'lodash.isempty';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';

// actions
import { addContactAction } from 'actions/contactsActions';
import { estimateTransactionAction, resetEstimateTransactionAction } from 'actions/transactionEstimateActions';

// constants
import { SEND_COLLECTIBLE_CONFIRM, SEND_TOKEN_CONFIRM } from 'constants/navigationConstants';
import { ETH, COLLECTIBLES } from 'constants/assetsConstants';

// components
import { BaseText } from 'components/Typography';
import FeeLabelToggle from 'components/FeeLabelToggle';
import SendContainer from 'containers/SendContainer';
import ContactDetailsModal from 'components/ContactDetailsModal';
import Toast from 'components/Toast';
import Modal from 'components/Modal';

// utils
import { isValidNumber, reportErrorLog } from 'utils/common';
import { getBalance, isEnoughBalanceForTransactionFee } from 'utils/assets';
import { getContactWithEnsName } from 'utils/contacts';
import { isEnsName } from 'utils/validators';

// selectors
import { useGasTokenSelector } from 'selectors/smartWallet';
import { contactsSelector } from 'selectors';
import { visibleActiveAccountAssetsWithBalanceSelector } from 'selectors/assets';
import { activeAccountMappedCollectiblesSelector } from 'selectors/collectibles';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { TokenTransactionPayload, TransactionFeeInfo } from 'models/Transaction';
import type { Balances, AssetData } from 'models/Asset';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { SessionData } from 'models/Session';
import type { Option } from 'models/Selector';
import type { Contact } from 'models/Contact';


type Props = {
  defaultContact: ?Contact,
  source: string,
  navigation: NavigationScreenProp<*>,
  balances: Balances,
  session: SessionData,
  useGasToken: boolean,
  assetsWithBalance: Option[],
  collectibles: Option[],
  contacts: Contact[],
  addContact: (contact: Contact) => void,
  feeInfo: ?TransactionFeeInfo,
  isEstimating: boolean,
  estimateErrorMessage: ?string,
  resetEstimateTransaction: () => void,
  estimateTransaction: (recipient: string, value: number, assetData: AssetData) => void,
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
  collectibles,
  contacts,
  addContact,
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
    value: defaultAssetData.token,
  };
  const [assetData, setAssetData] = useState<Option>(defaultAssetOption || assetsWithBalance[0]);
  const [amount, setAmount] = useState('');
  const [inputIsValid, setInputIsValid] = useState(false);
  const [selectedContact, setSelectedContact] = useState(defaultContact);
  const [submitPressed, setSubmitPressed] = useState(false);
  const [resolvingContactEnsName, setResolvingContactEnsName] = useState(false);

  // parse value
  const currentValue = parseFloat(amount || 0);
  const isValidAmount = !!amount && isValidNumber(currentValue.toString()); // method accepts value as string

  const updateTxFee = () => {
    const value = Number(amount || 0);
    const isCollectible = get(assetData, 'tokenType') === COLLECTIBLES;

    // specified amount is always valid and not necessarily matches input amount
    if ((!isCollectible && (!isValidAmount || value === 0)) || !assetData || !selectedContact) {
      return;
    }

    estimateTransaction(selectedContact.ethAddress, value, mapToAssetDataType(assetData));
  };

  const updateTxFeeDebounced = useCallback(
    debounce(updateTxFee, 100),
    [amount, selectedContact, useGasToken, assetData],
  );

  useEffect(() => {
    updateTxFeeDebounced();
    return updateTxFeeDebounced.cancel;
  }, [updateTxFeeDebounced]);

  const handleAmountChange = (value: ?Object) => {
    if (amount !== value?.input) setAmount(value?.input || '0');
    if (value && assetData !== value.selector) setAssetData(value.selector);
  };

  // initial
  useEffect(() => {
    resetEstimateTransaction();

    if (!defaultAssetData) return;

    let formattedSelectedAsset;
    if (assetData.tokenType === COLLECTIBLES) {
      formattedSelectedAsset = collectibles.find(({ tokenId }) => assetData.id === tokenId);
    } else {
      formattedSelectedAsset = assetsWithBalance.find(({ token }) => assetData.token === token);
    }

    if (!formattedSelectedAsset) return;

    handleAmountChange({ selector: formattedSelectedAsset, input: '' });
  }, []);

  const resolveContactFromOption = async (value: Option): Promise<?Contact> => {
    const ethAddress = value?.ethAddress || '';
    let contact = {
      name: value?.name || '',
      ethAddress,
      ensName: null,
    };

    if (isEnsName(ethAddress)) {
      setResolvingContactEnsName(true);
      contact = await getContactWithEnsName(contact, ethAddress);
      if (!contact?.ensName) {
        // failed to resolve ENS, error toast will be shown
        setResolvingContactEnsName(false);
        return Promise.resolve();
      }
      setResolvingContactEnsName(false);
    }

    // if name still empty let's set it with address
    if (isEmpty(contact.name)) contact = { ...contact, name: contact.ethAddress };

    return contact;
  };

  const handleReceiverSelect = async (value: Option) => {
    if (!value?.ethAddress) {
      setSelectedContact(null);
    } else {
      const contact = await resolveContactFromOption(value);
      setSelectedContact(contact);
    }
  };

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
    const transactionPayload: TokenTransactionPayload = {
      to: selectedContact.ethAddress,
      // $FlowFixMe: flow update to 0.122
      receiverEnsName: selectedContact.ensName,
      amount: amount || 0,
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
    const maxBalance = parseFloat(getBalance(balances, assetSymbol));
    const calculatedBalanceAmount = maxBalance * percentageModifier;

    // update fee only on max balance
    if (maxBalance === calculatedBalanceAmount && selectedContact) {
      // await needed for initial max available send calculation to get estimate before showing max available after fees
      await estimateTransaction(
        selectedContact.ethAddress,
        Number(calculatedBalanceAmount),
        mapToAssetDataType(assetData),
      );
    }
    return null;
  };

  const token = get(assetData, 'token');

  // balance
  const balance = getBalance(balances, token);

  const enteredMoreThanBalance = currentValue > balance;
  const hasAllFeeData = !isEstimating && !!selectedContact;

  const showFeeForAsset = !enteredMoreThanBalance && hasAllFeeData && isValidAmount;
  const showFeeForCollectible = hasAllFeeData;
  const isCollectible = get(assetData, 'tokenType') === COLLECTIBLES;
  const showFee = isCollectible ? showFeeForCollectible : showFeeForAsset;

  const hasAllData = isCollectible
    ? (!!selectedContact && !!assetData)
    : (inputIsValid && !!selectedContact && !!currentValue);

  // perform actual balance check only if all values set
  let enoughBalanceForTransaction = true;
  if (feeInfo && assetData && isValidAmount) {
    enoughBalanceForTransaction = isEnoughBalanceForTransactionFee(balances, {
      txFeeInWei: feeInfo.fee,
      gasToken: feeInfo.gasToken,
      decimals: assetData.decimals,
      amount,
      symbol: token,
    });
  }

  const errorMessage = !enoughBalanceForTransaction
    ? t('error.notEnoughTokenForFeeExtended', { token: feeInfo?.gasToken?.symbol || ETH })
    : estimateErrorMessage;

  const showNextButton = hasAllData;

  const isNextButtonDisabled = !session.isOnline || !feeInfo || !!errorMessage || !inputIsValid;

  const openAddToContacts = useCallback((initial: ?Contact) => {
    Modal.open(() => (
      <ContactDetailsModal
        title={t('title.addNewContact')}
        contact={initial}
        onSave={(contact: Contact) => {
          addContact(contact);
          handleReceiverSelect({ ...contact, value: contact.ethAddress });
        }}
        contacts={contacts}
        isDefaultNameEns
      />
    ));
  }, [contacts, addContact, handleReceiverSelect]);

  const contactsAsOptions = contacts.map((contact) => ({ ...contact, value: contact.ethAddress }));

  const handleAddToContactsPress = async (option: Option) => {
    console.log('🔵 handleAddToContactsPress', option);
    if (resolvingContactEnsName) return;

    const contact = await resolveContactFromOption(option);
    openAddToContacts(contact);
  };

  const selectedOption: ?Option = selectedContact
    ? { ...selectedContact, value: selectedContact.ethAddress }
    : null;

  return (
    <SendContainer
      customSelectorProps={{
        onOptionSelect: !resolvingContactEnsName ? handleReceiverSelect : () => {},
        options: contactsAsOptions,
        selectedOption,
        customOptionButtonLabel: t('button.addToContacts'),
        customOptionButtonOnPress: handleAddToContactsPress,
      }}
      customValueSelectorProps={{
        value: amount,
        onValueChange: setAmount,
        assetData,
        onAssetDataChange: setAssetData,
        showCollectibles: true,
        txFeeInfo: feeInfo,
        hideMaxSend: isEstimating || !selectedContact,
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
        footerTopAddon: !!selectedContact && renderFeeToggle(
          feeInfo,
          showFee,
          errorMessage,
          isEstimating,
          enoughBalanceForTransaction,
        ),
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
  collectibles: activeAccountMappedCollectiblesSelector,
  contacts: contactsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  addContact: (contact: Contact) => dispatch(addContactAction(contact)),
  resetEstimateTransaction: () => dispatch(resetEstimateTransactionAction()),
  estimateTransaction: (
    recipient: string,
    value: number,
    assetData: AssetData,
  ) => dispatch(estimateTransactionAction(recipient, value, null, assetData)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SendAsset);
