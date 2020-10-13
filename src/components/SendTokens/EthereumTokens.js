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

// utils
import { isValidNumber } from 'utils/common';
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
  estimateTransaction: (recipient: string, value: number, assetData?: AssetData) => void,
};

const renderFeeToggle = (
  txFeeInfo: ?TransactionFeeInfo,
  showFee: boolean,
  feeError: boolean,
  isLoading: boolean,
) => {
  if (!showFee || !txFeeInfo) return null;

  const { fee, gasToken } = txFeeInfo;
  const gasTokenSymbol = get(gasToken, 'symbol', ETH);

  return (
    <>
      <FeeLabelToggle txFeeInWei={fee} gasToken={gasToken} isLoading={isLoading} notEnoughToken={!!feeError} />
      {!!feeError &&
      <BaseText center secondary>
        {t('error.notEnoughTokenForFeeExtended', { token: gasTokenSymbol })}
      </BaseText>
      }
    </>
  );
};

const SendEthereumTokens = ({
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
  const [assetData, setAssetData] = useState(defaultAssetData);

  const [amount, setAmount] = useState(null);
  const [inputHasError, setInputHasError] = useState(false);
  const [selectedContact, setSelectedContact] = useState(defaultContact);
  const [submitPressed, setSubmitPressed] = useState(false);
  const [resolvingContactEnsName, setResolvingContactEnsName] = useState(false);
  const [contactToAdd, setContactToAdd] = useState(null);
  const hideAddContactModal = () => setContactToAdd(null);
  const [forceHideSelectorModals, setForceHideSelectorModals] = useState(false);
  const [selectorModalsHidden, setSelectorModalsHidden] = useState(false);

  // parse value
  const currentValue = parseFloat(amount || 0);
  const isValidAmount = !!amount && isValidNumber(currentValue.toString()); // method accepts value as string

  const updateTxFee = () => {
    const value = Number(amount || 0);

    // specified amount is always valid and not necessarily matches input amount
    if (!isValidAmount || value === 0 || !assetData || !selectedContact) {
      return;
    }

    // await needed for initial max available send calculation to get estimate before showing max available after fees
    estimateTransaction(selectedContact.ethAddress, value, assetData);
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

  const resolveAndSetContactAndFromOption = async (
    value: Option,
    setContact: (value: ?Contact) => void,
    onSuccess?: () => void,
  ): Promise<void> => {
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

    setContact(contact);

    if (onSuccess) onSuccess();

    return Promise.resolve();
  };

  const handleReceiverSelect = (value: Option, onSuccess?: () => void) => {
    if (!value?.ethAddress) {
      setSelectedContact(null);
      if (onSuccess) onSuccess();
    } else {
      resolveAndSetContactAndFromOption(value, setSelectedContact, onSuccess);
    }
  };

  const manageFormErrorState = (errorMessage: ?string) => {
    const newErrorState = !!errorMessage;
    if (inputHasError !== newErrorState) setInputHasError(newErrorState);
  };

  const handleFormSubmit = async () => {
    if (submitPressed || !feeInfo || !amount || !selectedContact || !assetData) return;

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
      receiverEnsName: selectedContact.ensName,
      amount,
      txFeeInWei: feeInfo.fee,
      symbol: assetData.token,
      contractAddress: assetData.contractAddress,
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
      await estimateTransaction(selectedContact.ethAddress, Number(calculatedBalanceAmount), assetData);
    }
  };

  const token = get(assetData, 'token');
  const preselectedCollectible = get(assetData, 'tokenType') === COLLECTIBLES ? get(assetData, 'id') : '';

  // balance
  const balance = getBalance(balances, token);

  const enteredMoreThanBalance = currentValue > balance;
  const hasAllFeeData = !isEstimating && !estimateErrorMessage && !!selectedContact;

  const showFeeForAsset = !enteredMoreThanBalance && hasAllFeeData && isValidAmount;
  const showFeeForCollectible = hasAllFeeData;
  const isCollectible = get(assetData, 'tokenType') === COLLECTIBLES;
  const showFee = isCollectible ? showFeeForCollectible : showFeeForAsset;

  const hasAllData = isCollectible
    ? (!!selectedContact && !!assetData)
    : (!inputHasError && !!selectedContact && !!currentValue);

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

  const showNextButton = !isEstimating && hasAllData && enoughBalanceForTransaction && !!feeInfo;

  const isNextButtonDisabled = !session.isOnline;

  const contactsAsOptions = contacts.map((contact) => ({ ...contact, value: contact.ethAddress }));
  const addContactButtonPress = (option: Option) => resolveAndSetContactAndFromOption(
    option,
    setContactToAdd,
    () => setForceHideSelectorModals(true),
  );
  const customOptionButtonOnPress = !resolvingContactEnsName
    ? addContactButtonPress
    : () => {};
  const selectedOption: ?Option = selectedContact
    ? { ...selectedContact, value: selectedContact.ethAddress }
    : null;

  return (
    <SendContainer
      customSelectorProps={{
        onOptionSelect: !resolvingContactEnsName && !contactToAdd ? handleReceiverSelect : () => {},
        options: contactsAsOptions,
        selectedOption,
        customOptionButtonLabel: t('button.addToContacts'),
        customOptionButtonOnPress,
        resetOptionsModalOnHiddenOptionAdded: true,
        hideModals: forceHideSelectorModals,
        onModalsHidden: () => {
          // force hide selector modals to show contact add modal
          if (contactToAdd) {
            setSelectorModalsHidden(true);
          }
        },
      }}
      customValueSelectorProps={{
        getFormValue: handleAmountChange,
        getError: manageFormErrorState,
        txFeeInfo: feeInfo,
        preselectedAsset: token,
        preselectedCollectible,
        showAllAssetTypes: true,
        gettingFee: isEstimating,
        hideMaxSend: isEstimating || !selectedContact, // we cannot calculate max if no receiver is set
        calculateBalancePercentTxFee,
      }}
      footerProps={{
        isNextButtonVisible: showNextButton,
        buttonProps: {
          onPress: handleFormSubmit,
          isLoading: submitPressed,
          disabled: isNextButtonDisabled,
        },
        footerTopAddon: !!selectedContact && renderFeeToggle(feeInfo, showFee, errorMessage, isEstimating),
      }}
    >
      <ContactDetailsModal
        title={t('title.addNewContact')}
        isVisible={!isEmpty(contactToAdd) && selectorModalsHidden}
        contact={contactToAdd}
        onSavePress={(contact: Contact) => {
          hideAddContactModal();
          addContact(contact);
          handleReceiverSelect({ ...contact, value: contact.ethAddress });
        }}
        onModalHide={hideAddContactModal}
        onModalHidden={() => {
          setSelectorModalsHidden(false);
          setForceHideSelectorModals(false);
        }}
        contacts={contacts}
        isDefaultNameEns
      />
    </SendContainer>
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
    assetData?: AssetData,
  ) => dispatch(estimateTransactionAction(recipient, value, null, assetData)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SendEthereumTokens);
