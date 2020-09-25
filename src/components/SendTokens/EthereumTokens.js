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
import { getEnv } from 'configs/envConfig';
import t from 'translations/translate';

// components
import Button from 'components/Button';
import { BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';
import RelayerMigrationModal from 'components/RelayerMigrationModal';
import FeeLabelToggle from 'components/FeeLabelToggle';
import { Spacing } from 'components/Layout';
import SendContainer from 'containers/SendContainer';
import Toast from 'components/Toast';
import ContactDetailsModal from 'components/ContactDetailsModal';

// utils
import { isValidNumber, getEthereumProvider } from 'utils/common';
import { spacing } from 'utils/variables';
import { getBalance, isEnoughBalanceForTransactionFee } from 'utils/assets';
import { buildTxFeeInfo } from 'utils/smartWallet';
import { getContactWithEnsName } from 'utils/contacts';
import { isEnsName } from 'utils/validators';

// services
import { buildERC721TransactionData } from 'services/assets';
import smartWalletService from 'services/smartWallet';
import { firebaseRemoteConfig } from 'services/firebase';

// selectors
import { isGasTokenSupportedSelector, useGasTokenSelector } from 'selectors/smartWallet';
import { activeAccountAddressSelector, contactsSelector } from 'selectors';
import { visibleActiveAccountAssetsWithBalanceSelector } from 'selectors/assets';
import { activeAccountMappedCollectiblesSelector } from 'selectors/collectibles';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { TokenTransactionPayload, Transaction, TransactionFeeInfo } from 'models/Transaction';
import type { Balances, Assets } from 'models/Asset';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { SessionData } from 'models/Session';
import type { Option } from 'models/Selector';
import type { Contact } from 'models/Contact';

// constants
import { SEND_COLLECTIBLE_CONFIRM, SEND_TOKEN_CONFIRM } from 'constants/navigationConstants';
import { ETH, COLLECTIBLES } from 'constants/assetsConstants';
import { FEATURE_FLAGS } from 'constants/featureFlagsConstants';

// actions
import { addContactAction } from 'actions/contactsActions';


type Props = {
  defaultContact: ?Contact,
  source: string,
  navigation: NavigationScreenProp<*>,
  balances: Balances,
  session: SessionData,
  activeAccountAddress: string,
  accountAssets: Assets,
  accountHistory: Transaction[],
  isGasTokenSupported: boolean,
  useGasToken: boolean,
  assetsWithBalance: Option[],
  collectibles: Option[],
  contacts: Contact[],
  addContact: (contact: Contact) => void,
};

type FooterProps = {
  showRelayerMigration: boolean,
  showFee: boolean,
  isLoading: boolean,
  feeError: boolean,
};

const renderFeeToggle = (
  txFeeInfo: ?TransactionFeeInfo,
  showFee: boolean,
  feeError: boolean,
) => {
  if (!showFee || !txFeeInfo) return null;

  const { fee, gasToken } = txFeeInfo;
  const gasTokenSymbol = get(gasToken, 'symbol', ETH);

  return (
    <>
      <FeeLabelToggle txFeeInWei={fee} gasToken={gasToken} />
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
  activeAccountAddress,
  accountAssets,
  accountHistory,
  isGasTokenSupported,
  useGasToken,
  assetsWithBalance,
  collectibles,
  contacts,
  addContact,
  defaultContact,
}: Props) => {
  const [showRelayerMigrationModal, setShowRelayerMigrationModal] = useState(false);
  const hideRelayerMigrationModal = () => setShowRelayerMigrationModal(false);

  useEffect(() => {
    if (isGasTokenSupported && showRelayerMigrationModal) {
      hideRelayerMigrationModal(); // hide on update
    }
  }, [isGasTokenSupported]);

  const defaultAssetData = navigation.getParam('assetData');
  const [assetData, setAssetData] = useState(defaultAssetData);

  const [amount, setAmount] = useState(null);
  const [inputHasError, setInputHasError] = useState(false);
  const [txFeeInfo, setTxFeeInfo] = useState(null);
  const [gettingFee, setGettingFee] = useState(true);
  const [selectedContact, setSelectedContact] = useState(defaultContact);
  const [submitPressed, setSubmitPressed] = useState(false);
  const [resolvingContactEnsName, setResolvingContactEnsName] = useState(false);
  const [contactToAdd, setContactToAdd] = useState(null);
  const hideAddContactModal = () => setContactToAdd(null);

  // parse value
  const currentValue = parseFloat(amount || 0);
  const isValidAmount = !!amount && isValidNumber(currentValue.toString()); // method accepts value as string

  const updateTxFee = async (specifiedAmount?: number) => {
    const value = Number(specifiedAmount || amount || 0);
    const isCollectible = get(assetData, 'tokenType') === COLLECTIBLES;

    // specified amount is always valid and not necessarily matches input amount
    if ((!specifiedAmount && !isValidAmount) || value === 0 || !assetData || !selectedContact) {
      setGettingFee(false);
      setTxFeeInfo(null);
      return;
    }

    let data;
    if (isCollectible) {
      const provider = getEthereumProvider(getEnv().COLLECTIBLES_NETWORK);
      const {
        name,
        id,
        contractAddress,
        tokenType,
      } = assetData;
      const collectibleTransaction = {
        from: activeAccountAddress,
        to: selectedContact.ethAddress,
        receiverEnsName: selectedContact.ensName,
        name,
        tokenId: id,
        contractAddress,
        tokenType,
      };
      data = await buildERC721TransactionData(collectibleTransaction, provider);
    }

    const transaction = { recipient: selectedContact.ethAddress, value, data };
    const estimated = await smartWalletService
      .estimateAccountTransaction(transaction, assetData)
      .then(res => buildTxFeeInfo(res, useGasToken))
      .catch(() => null);

    if (!estimated) {
      Toast.show({
        message: t('toast.transactionFeeEstimationFailed'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });
      setGettingFee(false);
      setTxFeeInfo(null);
      return;
    }

    setTxFeeInfo(estimated);
  };

  const updateTxFeeDebounced = useCallback(
    debounce(updateTxFee, 500),
    [amount, selectedContact, useGasToken, assetData],
  );

  useEffect(() => {
    if (!gettingFee) setGettingFee(true);
    updateTxFeeDebounced();
    return updateTxFeeDebounced.cancel;
  }, [updateTxFeeDebounced]);

  // fee changed, no longer getting
  useEffect(() => { if (gettingFee) setGettingFee(false); }, [txFeeInfo]);

  const handleAmountChange = (value: ?Object) => {
    if (amount !== value?.input) setAmount(value?.input || '0');
    if (value && assetData !== value.selector) setAssetData(value.selector);
  };

  useEffect(() => {
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
    if (submitPressed || !txFeeInfo || !amount || !selectedContact || !assetData) return;

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
      txFeeInWei: txFeeInfo.fee,
      symbol: assetData.token,
      contractAddress: assetData.contractAddress,
      decimals: assetData.decimals,
    };

    if (txFeeInfo?.gasToken) transactionPayload.gasToken = txFeeInfo.gasToken;

    Keyboard.dismiss();
    setSubmitPressed(false);
    navigation.navigate(SEND_TOKEN_CONFIRM, {
      transactionPayload,
      source,
    });
  };

  const calculateBalancePercentTxFee = async (assetSymbol: string, percentageModifier: number) => {
    setGettingFee(true);
    const maxBalance = parseFloat(getBalance(balances, assetSymbol));
    const calculatedBalanceAmount = maxBalance * percentageModifier;

    // update fee only on max balance
    if (maxBalance === calculatedBalanceAmount) {
      // not debounced call to make sure it's not cancelled
      await updateTxFee(calculatedBalanceAmount);
    }
  };

  const renderRelayerMigrationButton = () => (
    <Button
      title={t('transactions.button.payFeeWithPillar')}
      onPress={() => setShowRelayerMigrationModal(true)}
      secondary
      small
    />
  );

  const renderFee = (props: FooterProps) => {
    const {
      showRelayerMigration,
      showFee,
      isLoading,
      feeError,
    } = props;

    if (isLoading) {
      return <Spinner width={20} height={20} />;
    }

    return (
      <>
        {renderFeeToggle(txFeeInfo, showFee, feeError)}
        {showRelayerMigration && (
          <>
            <Spacing h={spacing.medium} />
            {renderRelayerMigrationButton()}
          </>
        )}
      </>
    );
  };

  const token = get(assetData, 'token');
  const preselectedCollectible = get(assetData, 'tokenType') === COLLECTIBLES ? get(assetData, 'id') : '';

  // balance
  const balance = getBalance(balances, token);

  const enteredMoreThanBalance = currentValue > balance;
  const hasAllFeeData = !gettingFee && !!txFeeInfo && txFeeInfo.fee.gt(0) && !!selectedContact;

  const showFeeForAsset = !enteredMoreThanBalance && hasAllFeeData && isValidAmount;
  const showFeeForCollectible = hasAllFeeData;
  const isCollectible = get(assetData, 'tokenType') === COLLECTIBLES;
  const showFee = isCollectible ? showFeeForCollectible : showFeeForAsset;

  const showRelayerMigration = firebaseRemoteConfig.getBoolean(FEATURE_FLAGS.APP_FEES_PAID_WITH_PLR)
    && showFee
    && !isGasTokenSupported;

  const hasAllData = isCollectible
    ? (!!selectedContact && !!assetData)
    : (!inputHasError && !!selectedContact && !!currentValue);

  let feeError = false;
  if (txFeeInfo && assetData && isValidAmount) {
    feeError = !isEnoughBalanceForTransactionFee(balances, {
      txFeeInWei: txFeeInfo.fee,
      gasToken: txFeeInfo.gasToken,
      decimals: assetData.decimals,
      amount,
      symbol: token,
    });
  }

  const showNextButton = !gettingFee && hasAllData && !feeError;

  const isNextButtonDisabled = !session.isOnline;

  const contactsAsOptions = contacts.map((contact) => ({ ...contact, value: contact.ethAddress }));
  const addContactButtonPress = (option: Option) => resolveAndSetContactAndFromOption(
    option,
    setContactToAdd,
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
      }}
      customValueSelectorProps={{
        getFormValue: handleAmountChange,
        getError: manageFormErrorState,
        txFeeInfo,
        preselectedAsset: token,
        preselectedCollectible,
        showAllAssetTypes: true,
        gettingFee,
        hideMaxSend: gettingFee || !selectedContact, // we cannot calculate max if no receiver is set
        calculateBalancePercentTxFee,
      }}
      footerProps={{
        isNextButtonVisible: showNextButton,
        buttonProps: {
          onPress: handleFormSubmit,
          isLoading: submitPressed,
          disabled: isNextButtonDisabled,
        },
        footerTopAddon: !!selectedContact && renderFee({
          showRelayerMigration,
          showFee,
          isLoading: gettingFee,
          feeError,
        }),
      }}
    >
      {showRelayerMigration &&
        <RelayerMigrationModal
          isVisible={showRelayerMigrationModal}
          onModalHide={hideRelayerMigrationModal}
          accountAssets={accountAssets}
          accountHistory={accountHistory}
        />
      }
      <ContactDetailsModal
        title={t('title.addNewContact')}
        isVisible={!isEmpty(contactToAdd)}
        contact={contactToAdd}
        onSavePress={(contact: Contact) => {
          hideAddContactModal();
          addContact(contact);
          handleReceiverSelect({ ...contact, value: contact.ethAddress });
        }}
        onModalHide={hideAddContactModal}
        contacts={contacts}
        isDefaultNameEns
      />
    </SendContainer>
  );
};

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
  isGasTokenSupported: isGasTokenSupportedSelector,
  useGasToken: useGasTokenSelector,
  assetsWithBalance: visibleActiveAccountAssetsWithBalanceSelector,
  collectibles: activeAccountMappedCollectiblesSelector,
  contacts: contactsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  addContact: (contact: Contact) => dispatch(addContactAction(contact)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SendEthereumTokens);
