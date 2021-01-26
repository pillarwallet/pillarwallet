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
import { createStructuredSelector } from 'reselect';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';
import isEmpty from 'lodash.isempty';

// actions
import { addContactAction } from 'actions/contactsActions';
import { fetchAccountDepositBalanceAction } from 'actions/etherspotActions';

// components
import ContactDetailsModal from 'components/ContactDetailsModal';
import Modal from 'components/Modal';
import SendContainer from 'containers/SendContainer';
import { Label } from 'components/Typography';

// constants
import { PPN_TOKEN } from 'configs/assetsConfig';
import { SEND_TOKEN_CONFIRM } from 'constants/navigationConstants';

// utils
import { getAssetData, getAssetsAsList } from 'utils/assets';
import { isEnsName } from 'utils/validators';
import { getContactWithEnsName } from 'utils/contacts';

// selectors
import { contactsSelector } from 'selectors';
import { accountAssetsSelector } from 'selectors/assets';
import { availableStakeSelector } from 'selectors/paymentNetwork';

// types
import type { Dispatch } from 'reducers/rootReducer';
import type { Assets, Balances } from 'models/Asset';
import type { Contact } from 'models/Contact';
import type { Option } from 'models/Selector';
import type { TokenTransactionPayload } from 'models/Transaction';


type Props = {
  navigation: NavigationScreenProp<*>,
  accountAssets: Assets,
  availableStake: number,
  contacts: Contact[],
  addContact: (contact: Contact) => void,
  fetchAccountDepositBalance: () => void,
};

const PPNSendTokenAmount = ({
  navigation,
  accountAssets,
  availableStake,
  contacts,
  addContact,
  fetchAccountDepositBalance,
}: Props) => {
  useEffect(() => {
    fetchAccountDepositBalance();
  }, []);

  const [amount, setAmount] = useState(null);
  const [inputValid, setInputValid] = useState(false);
  const [selectedContact, setSelectedContact] = useState<?Contact>(null);
  const [resolvingContactEnsName, setResolvingContactEnsName] = useState(false);

  const PPNAsset = getAssetData(getAssetsAsList(accountAssets), [], PPN_TOKEN);

  const { symbol, address: contractAddress, decimals } = PPNAsset;

  // for selector
  const PPNAssetDataOption = { ...PPNAsset, value: symbol };

  const showNextButton = amount !== null; // only if amount input touched
  const isNextButtonDisabled = !amount || !inputValid || !selectedContact;
  const onNextButtonPress = () => {
    if (!selectedContact || !amount) {
      // TODO: show toast
      return;
    }

    const transactionPayload: TokenTransactionPayload = {
      to: selectedContact.ethAddress,
      amount,
      txFeeInWei: 0,
      usePPN: true,
      symbol,
      contractAddress,
      decimals,
    };

    const { ensName } = selectedContact;
    if (ensName) transactionPayload.receiverEnsName = ensName;

    navigation.navigate(SEND_TOKEN_CONFIRM, { transactionPayload });
  };

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
  const addContactButtonPress = (option: Option) => resolveAndSetContactAndFromOption(
    option,
    openAddToContacts,
  );
  const customOptionButtonOnPress = !resolvingContactEnsName
    ? addContactButtonPress
    : () => {};
  const selectedOption: ?Option = selectedContact
    ? { ...selectedContact, value: selectedContact.ethAddress }
    : null;

  const accountDepositBalance: Balances = { [PPN_TOKEN]: { symbol: PPN_TOKEN, balance: availableStake.toString() } };

  return (
    <SendContainer
      customSelectorProps={{
        onOptionSelect: !resolvingContactEnsName ? handleReceiverSelect : () => {},
        options: contactsAsOptions,
        selectedOption,
        customOptionButtonLabel: t('button.addToContacts'),
        customOptionButtonOnPress,
      }}
      customValueSelectorProps={{
        onValueChange: setAmount,
        assetData: PPNAssetDataOption,
        value: amount || '', // cannot be null
        customAssets: [],
        customBalances: accountDepositBalance,
        onFormValid: setInputValid,
      }}
      footerProps={{
        isNextButtonVisible: showNextButton,
        buttonProps: {
          onPress: onNextButtonPress,
          disabled: isNextButtonDisabled,
        },
        footerTopAddon: <Label small>{t('ppnContent.label.paidByPillar')}</Label>,
      }}
    />
  );
};

const structuredSelector = createStructuredSelector({
  contacts: contactsSelector,
  accountAssets: accountAssetsSelector,
  availableStake: availableStakeSelector,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  addContact: (contact: Contact) => dispatch(addContactAction(contact)),
  fetchAccountDepositBalance: () => dispatch(fetchAccountDepositBalanceAction()),
});

export default connect(structuredSelector, mapDispatchToProps)(PPNSendTokenAmount);

