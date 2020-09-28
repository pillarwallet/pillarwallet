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
import React, { useState } from 'react';
import { FlatList } from 'react-native';
import { connect } from 'react-redux';
import isEmpty from 'lodash.isempty';
import Swipeout from 'react-native-swipeout';
import { withTheme } from 'styled-components/native';
import t from 'translations/translate';

// actions
import { addContactAction, updateContactAction } from 'actions/contactsActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import ContactDetailsModal from 'components/ContactDetailsModal';
import SwipeoutButton from 'components/SwipeoutButton';
import Modal from 'components/Modal';

// utils
import { getThemeColors } from 'utils/themes';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Contact } from 'models/Contact';
import type { Theme } from 'models/Theme';

// partials
import DeleteContactModal from './DeleteContactModal';

type Props = {
  theme: Theme,
  contacts: Contact[],
  addContact: (contact: Contact) => void,
  updateContact: (prevEthAddress: string, contact: Contact) => void,
};

const ContactsList = ({
  addContact,
  updateContact,
  contacts,
  theme,
}: Props) => {
  const colors = getThemeColors(theme);

  const [selectedContact, setSelectedContact] = useState(null);
  const hideContactDetailsModal = () => setSelectedContact(null);

  const openDeleteContactModal = (contact: Contact) => Modal.open(() => (
    <DeleteContactModal contact={contact} />
  ));

  const renderListItem = ({ item }: { item: Contact }) => {
    const { name, ethAddress, ensName } = item;
    return (
      <Swipeout
        right={[{
          component: (
            <SwipeoutButton
              onPress={() => openDeleteContactModal(item)}
              iconName="remove"
              label={t('button.delete')}
              color={colors.negative}
              disabled
            />
          ),
        }]}
        backgroundColor="transparent"
        sensitivity={10}
        buttonWidth={80}
      >
        <ListItemWithImage
          label={name || ensName || ethAddress}
          onPress={() => setSelectedContact(item)}
          diameter={48}
          rightColumnInnerStyle={{ alignItems: 'flex-end' }}
        />
      </Swipeout>
    );
  };

  const emptyStyle = { flex: 1, justifyContent: 'center', alignItems: 'center' };
  const showContactDetailsModal = !!selectedContact;

  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [{ title: t('title.addressBook') }],
        rightItems: [{ noMargin: true, link: t('button.addNew'), onPress: () => setSelectedContact({}) }],
      }}
    >
      <FlatList
        data={contacts}
        keyExtractor={({ ethAddress }) => ethAddress}
        renderItem={renderListItem}
        initialNumToRender={9}
        contentContainerStyle={!contacts.length && emptyStyle}
        ListEmptyComponent={<EmptyStateParagraph title={t('label.noContactsAdded')} />}
      />
      {showContactDetailsModal && (
        <ContactDetailsModal
          title={isEmpty(selectedContact) ? t('title.addNewContact') : t('title.editContact')}
          dirtyInputs={!isEmpty(selectedContact)}
          isVisible={!!selectedContact}
          contact={selectedContact}
          onSavePress={(newContact: Contact) => {
            if (isEmpty(selectedContact)) {
              addContact(newContact);
            } else if (selectedContact) {
              updateContact(selectedContact.ethAddress, newContact);
            }
            hideContactDetailsModal();
          }}
          onModalHide={hideContactDetailsModal}
          contacts={contacts}
          showQRScanner
        />
      )}
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  contacts: { data: contacts },
}: RootReducerState): $Shape<Props> => ({
  contacts,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  updateContact: (prevEthAddress: string, contact: Contact) => dispatch(updateContactAction(prevEthAddress, contact)),
  addContact: (contact: Contact) => dispatch(addContactAction(contact)),
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(ContactsList));
