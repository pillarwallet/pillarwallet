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
import React, { useCallback } from 'react';
import { FlatList } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
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
import type { RootReducerState } from 'reducers/rootReducer';
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

const ContactsList = ({ theme }: Props) => {
  const dispatch = useDispatch();
  const contacts = useSelector(({ contacts: { data } }: RootReducerState) => data);
  const colors = getThemeColors(theme);

  const openDeleteContactModal = (contact: Contact) => Modal.open(() => (
    <DeleteContactModal contact={contact} />
  ));

  const openContactDetails = useCallback((contact: null | Contact) => {
    Modal.open(() => (
      <ContactDetailsModal
        title={contact === null ? t('title.addNewContact') : t('title.editContact')}
        contact={contact}
        contacts={contacts}
        onSave={(newContact: Contact) => {
          dispatch(contact ? updateContactAction(contact.ethAddress, newContact) : addContactAction(newContact));
        }}
        showQRScanner
      />
    ));
  }, [contacts, dispatch]);

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
          onPress={() => openContactDetails(item)}
          diameter={48}
          rightColumnInnerStyle={{ alignItems: 'flex-end' }}
        />
      </Swipeout>
    );
  };

  const emptyStyle = { flex: 1, justifyContent: 'center', alignItems: 'center' };

  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [{ title: t('title.addressBook') }],
        rightItems: [{ noMargin: true, link: t('button.addNew'), onPress: () => openContactDetails(null) }],
        sideFlex: 2,
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
    </ContainerWithHeader>
  );
};

export default withTheme(ContactsList);
