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

/* eslint-disable no-unused-expressions */

import * as React from 'react';
import styled, { useTheme } from 'styled-components/native';
import { Keyboard, FlatList } from 'react-native';
import { useDispatch } from 'react-redux';
import Clipboard from '@react-native-community/clipboard';
import t from 'translations/translate';

// Actions
import { addContactAction } from 'actions/contactsActions';
import { goToInvitationFlowAction } from 'actions/referralsActions';

// Components
import { Spacing } from 'components/Layout';
import AddressScanner from 'components/QRCodeScanner/AddressScanner';
import Button from 'components/Button';
import ContactDetailsModal from 'components/ContactDetailsModal';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import FloatingButtons from 'components/FloatingButtons';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Modal from 'components/Modal';
import SearchBar from 'components/SearchBar';
import SlideModal from 'components/Modals/SlideModal';

// Selectors
import { useRootSelector, activeAccountAddressSelector } from 'selectors';

// Utils
import { spacing } from 'utils/variables';
import { getThemeColors } from 'utils/themes';
import { getMatchingSortedData } from 'utils/textInput';
import { getContactWithEnsName } from 'utils/contacts';
import { isEnsName, isValidAddress } from 'utils/validators';


// Types
import type { Contact } from 'models/Contact';

type Props = {|
  contacts?: Contact[],
  onSelectContact?: (contact: ?Contact) => mixed,
  onResolvingContact?: (isResolving: boolean) => mixed,
  title?: string,
  searchPlaceholder?: string,
  allowEnteringCustomAddress?: boolean,
  allowAddContact?: boolean,
|};

const viewConfig = {
  minimumViewTime: 300,
  viewAreaCoveragePercentThreshold: 100,
  waitForInteraction: true,
};

const MIN_QUERY_LENGTH = 2;

const ContactSelectorOptions = ({
  contacts = [],
  onSelectContact,
  onResolvingContact,
  title,
  allowEnteringCustomAddress,
  allowAddContact,
}: Props) => {
  const theme = useTheme();

  const searchInputRef = React.useRef<any>(null);
  const modalRef = React.useRef<any>(null);

  const [query, setQuery] = React.useState(null);
  const [customAddressContact, setCustomAddressContact] = React.useState(null);
  const [isQueryValidAddress, setIsQueryValidAddress] = React.useState(false);
  const [hasSearchError, setHasSearchError] = React.useState(false);
  const [resolvingContactEnsName, setResolvingContactEnsName] = React.useState(false);

  const dispatch = useDispatch();
  const activeAccountAddress = useRootSelector(activeAccountAddressSelector);

  const close = () => {
    Keyboard.dismiss();
    modalRef.current?.close();
  };

  const handleCustomAddress = (address: string) => {
    const isValid = isValidAddress(address);

    setIsQueryValidAddress(isValid);
    setCustomAddressContact(isValid && address ? { name: address, ethAddress: address } : null);
  };

  const handleInputChange = (input: string) => {
    input = input?.trim() ?? '';
    setQuery(input);
    if (allowEnteringCustomAddress) handleCustomAddress(input);
  };

  const resolveContact = async (value: Contact): Promise<?Contact> => {
    let contact: Contact = {
      name: value?.name || '',
      ethAddress: value?.ethAddress || '',
    };

    if (isEnsName(contact.ethAddress)) {
      setResolvingContactEnsName(true);
      onResolvingContact?.(true);

      contact = await getContactWithEnsName(contact, contact.ethAddress);

      setResolvingContactEnsName(false);
      onResolvingContact?.(false);

      // ENS name resolution failed
      if (!contact.ensName) return undefined;
    }

    if (!contact.name) {
      contact.name = contact.ethAddress;
    }

    return contact;
  };

  const selectValue = async (contact: Contact) => {
    close();
    const resolvedContact = await resolveContact(contact);

    onSelectContact?.(resolvedContact);
  };

  const handlePaste = async () => {
    const clipboardValue = await Clipboard.getString();
    handleInputChange(clipboardValue);
  };

  const handleAddToContactsPress = async (contact?: Contact) => {
    if (resolvingContactEnsName) return;

    const initialContact = contact ? await resolveContact(contact) : null;

    Modal.open(() => (
      <ContactDetailsModal
        title={t('title.addNewContact')}
        contact={initialContact}
        onSave={(savedContact: Contact) => {
          dispatch(addContactAction(savedContact));
          selectValue(savedContact);
          close();
        }}
        contacts={contacts ?? []}
        isDefaultNameEns
      />
    ));
  };

  const handleInviteFriendPress = () => {
    dispatch(goToInvitationFlowAction());
  };

  const validateSearch = (searchQuery: string) => {
    if (searchQuery === activeAccountAddress) {
      setHasSearchError(true);
      return t('error.cannotSendYourself');
    }

    if (hasSearchError) {
      setHasSearchError(false);
    }

    return null;
  };

  const handleModalShow = () => {
    searchInputRef.current?.focus();
  };

  const handleScannerResult = (address: string) => {
    if (isValidAddress(address)) {
      const option = {
        value: address,
        ethAddress: address,
        name: address,
      };
      selectValue(option);
    }
  };

  const handleOpenScanner = () => {
    Keyboard.dismiss();
    Modal.open(() => <AddressScanner onRead={handleScannerResult} />);
  };

  const renderItem = (item: Contact) => {
    if (!item) return null;

    return (
      <ListItemWithImage
        label={item.name}
        onPress={() => selectValue(item)}
        fallbackToGenericToken={false}
      />
    );
  };

  const colors = getThemeColors(theme);
  const isSearching = query && query.length >= MIN_QUERY_LENGTH;

  const filteredContacts: Contact[] = isSearching ? getMatchingSortedData(contacts, query) : contacts;

  const showEmptyState = !customAddressContact && !filteredContacts?.length;
  const emptyStateMessage =
    allowEnteringCustomAddress && !!query && !isQueryValidAddress
      ? t('error.invalid.address')
      : t('label.nothingFound');

  const renderEmptyState = () => {
    if (!showEmptyState) return null;

    return (
      <EmptyStateWrapper fullScreen>
        <EmptyStateParagraph title={emptyStateMessage} />
      </EmptyStateWrapper>
    );
  };

  let items: Contact[] = [];
  if (filteredContacts.length) {
    items = [...filteredContacts];
  } else if (!hasSearchError && customAddressContact) {
    items = [customAddressContact];
  }

  const buttons = [
    {
      title: t('button.addContact'),
      iconName: 'add-contact',
      onPress: () => handleAddToContactsPress(),
    },
    {
      title: t('button.inviteFriend'),
      iconName: 'plus',
      onPress: handleInviteFriendPress,
    },
  ];

  return (
    <SlideModal
      ref={modalRef}
      fullScreen
      onModalShow={handleModalShow}
      noSwipeToDismiss
      noClose
      backgroundColor={colors.basic050}
      noTopPadding
    >
      <ContainerWithHeader
        headerProps={{
          noPaddingTop: true,
          customOnBack: close,
          centerItems: [{ title }],
          rightItems: [
            {
              icon: 'qrcode',
              onPress: handleOpenScanner,
              fontSize: 18,
              color: colors.basic020,
            },
          ],
        }}
      >
        <SearchContainer>
          <SearchBarWrapper>
            <SearchBar
              inputProps={{
                onChange: handleInputChange,
                value: query,
                autoCapitalize: 'none',
                validator: validateSearch,
              }}
              placeholder={t('label.walletAddressEnsUser')}
              inputRef={searchInputRef}
              noClose
              marginBottom="0"
              iconProps={{ persistIconOnFocus: true }}
            />
          </SearchBarWrapper>

          <Button onPress={handlePaste} title={t('button.paste')} transparent small />
        </SearchContainer>

        <FlatList
          stickyHeaderIndices={[0]}
          data={items}
          renderItem={({ item }) => renderItem(item)}
          keyExtractor={(contact) => contact.ethAddress || contact.name}
          keyboardShouldPersistTaps="always"
          initialNumToRender={10}
          viewabilityConfig={viewConfig}
          windowSize={10}
          hideModalContentWhileAnimating
          ListHeaderComponent={renderEmptyState()}
        />

        {allowAddContact && !customAddressContact && <FloatingButtons items={buttons} />}

        {allowAddContact &&
          customAddressContact &&
          !hasSearchError && (
            <ActionButtonsContainer>
              <Button
                title={t('button.addToAddressBook')}
                onPress={() => handleAddToContactsPress(customAddressContact)}
                isLoading={resolvingContactEnsName}
              />
              <Spacing h={spacing.small} />
              <Button secondary title={t('button.skip')} onPress={() => selectValue(customAddressContact)} />
            </ActionButtonsContainer>
          )}
      </ContainerWithHeader>
    </SlideModal>
  );
};

export default ContactSelectorOptions;

const EmptyStateWrapper = styled.View`
  padding-top: 90px;
  padding-bottom: 90px;
  align-items: center;
`;

const SearchContainer = styled.View`
  flex-direction: row;
  align-items: center;
`;

const SearchBarWrapper = styled.View`
  flex: 1;
  padding-vertical: ${spacing.small}px;
  padding-start: ${spacing.layoutSides}px;
`;

const ActionButtonsContainer = styled.View`
  padding-horizontal: ${spacing.rhythm}px;
`;
