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

import * as React from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components/native';
import Swipeout from 'react-native-swipeout';
import t from 'translations/translate';

// Actions
import { addContactAction, updateContactAction } from 'actions/contactsActions';

// Components
import Button from 'components/legacy/Button';
import ContactDetailsModal from 'components/ContactDetailsModal';
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import FloatingButtons from 'components/FloatingButtons';
import ListItemWithImage from 'components/legacy/ListItem/ListItemWithImage';
import Modal from 'components/Modal';
import SearchBar from 'components/SearchBar';
import SwipeoutButton from 'components/SwipeoutButton';

// Constants
import { SEND_TOKEN_FROM_CONTACT_FLOW } from 'constants/navigationConstants';

// Utils
import { filterContacts } from 'utils/contacts';
import { useThemeColors } from 'utils/themes';
import { isValidAddress, useNameValid } from 'utils/validators';
import { spacing } from 'utils/variables';

// Types
import type { Contact } from 'models/Contact';
import type { RootReducerState } from 'reducers/rootReducer';

// Partials
import DeleteContactModal from './DeleteContactModal';

const ContactsList = () => {
  const [query, setQuery] = React.useState('');
  const [customAddressContact, setCustomAddressContact] = React.useState(null);

  const dispatch = useDispatch();
  const contacts = useSelector(({ contacts: { data } }: RootReducerState) => data);

  const navigation = useNavigation();

  const colors = useThemeColors();

  const openContactDetails = (contact: ?Contact) =>
    Modal.open(() => {
      const isEdit = !!contact?.name;

      return (
        <ContactDetailsModal
          title={isEdit ? t('title.editContact') : t('title.addNewContact')}
          contact={contact}
          contacts={contacts}
          onSave={(newContact: Contact) => {
            dispatch(
              isEdit && contact ? updateContactAction(contact.ethAddress, newContact) : addContactAction(newContact),
            );
          }}
          showQRScanner
        />
      );
    });

  const openDeleteContactModal = (contact: Contact) => Modal.open(() => <DeleteContactModal contact={contact} />);

  const { data } = useNameValid(query);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    const isValid = !isValidAddress(value) && !data?.[0] && !filterContacts(contacts, value).length;
    setCustomAddressContact(isValid ? { ethAddress: value, name: '' } : null);
  };

  const renderItem = ({ item }: { item: Contact }) => {
    return (
      <Swipeout
        right={[
          {
            component: (
              <SwipeoutButton
                onPress={() => openDeleteContactModal(item)}
                iconName="remove"
                label={t('button.delete')}
                color={colors.negative}
                disabled
              />
            ),
          },
        ]}
        backgroundColor="transparent"
        sensitivity={10}
        buttonWidth={80}
      >
        <ListItemWithImage
          label={item.name || item.ensName || item.ethAddress}
          onPress={() => openContactDetails(item)}
          diameter={48}
          rightColumnInnerStyle={{ alignItems: 'flex-end' }}
        />
      </Swipeout>
    );
  };

  const buttons = [
    {
      title: t('button.addContact'),
      iconName: 'add-contact',
      onPress: () => openContactDetails(null),
    },
    !!contacts.length && {
      title: t('button.send'),
      iconName: 'send',
      onPress: () => navigation.navigate(SEND_TOKEN_FROM_CONTACT_FLOW),
    },
  ];

  const filteredContacts = filterContacts(contacts, query);

  let items: Contact[] = [];
  if (filteredContacts.length) {
    items = [...filteredContacts];
  } else if (customAddressContact) {
    items = [customAddressContact];
  }

  const renderEmptyState = () => {
    return !query ? (
      <EmptyStateWrapper>
        <EmptyStateParagraph title={t('label.noContacts')} bodyText={t('paragraph.addContacts')} />
      </EmptyStateWrapper>
    ) : (
      <EmptyStateWrapper>
        <EmptyStateParagraph title={t('label.nothingFound')} />
      </EmptyStateWrapper>
    );
  };

  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [{ title: t('title.addressBook') }],
      }}
      footer={<View />}
      shouldFooterAvoidKeyboard
    >
      <SearchBar
        query={query}
        onQueryChange={handleQueryChange}
        placeholder={t('label.addressSupportedNames')}
        autoFocus
      />

      <FlatList
        data={items}
        keyExtractor={({ ethAddress }) => ethAddress}
        renderItem={renderItem}
        initialNumToRender={9}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.flatListContantContainer}
      />

      {!filteredContacts.length && customAddressContact ? (
        <ActionButtonsContainer>
          <Button title={t('button.addToAddressBook')} onPress={() => openContactDetails(customAddressContact)} />
        </ActionButtonsContainer>
      ) : (
        <FloatingButtons items={buttons} applyBottomInset={false} />
      )}
    </ContainerWithHeader>
  );
};

export default ContactsList;

const styles = {
  flatListContantContainer: {
    flexGrow: 1,
    paddingBottom: FloatingButtons.SCROLL_VIEW_BOTTOM_INSET,
  },
};

const EmptyStateWrapper = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const ActionButtonsContainer = styled.View`
  padding-horizontal: ${spacing.large}px;
  padding-bottom: ${spacing.largePlus}px;
`;
