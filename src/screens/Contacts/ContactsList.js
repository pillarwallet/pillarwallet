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
import { SafeAreaView } from 'react-navigation';
import styled, { withTheme } from 'styled-components/native';
import t from 'translations/translate';

// actions
import { addContactAction, deleteContactAction, updateContactAction } from 'actions/contactsActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import ContactDetailsModal from 'components/ContactDetailsModal';
import SwipeoutButton from 'components/SwipeoutButton';
import ProfileImage from 'components/ProfileImage';
import { Spacing } from 'components/Layout';
import SlideModal from 'components/Modals/SlideModal/SlideModal-old';
import Button from 'components/Button';
import { BaseText, MediumText } from 'components/Typography';

// utils
import { getThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Contact } from 'models/Contact';
import type { Theme } from 'models/Theme';


type Props = {
  theme: Theme,
  contacts: Contact[],
  addContact: (contact: Contact) => void,
  deleteContact: (contact: Contact) => void,
  updateContact: (prevEthAddress: string, contact: Contact) => void,
};

const ContentWrapper = styled(SafeAreaView)`
  width: 100%;
  padding-bottom: 40px;
  align-items: center;
`;

const ContactsList = ({
  addContact,
  deleteContact,
  updateContact,
  contacts,
  theme,
}: Props) => {
  const colors = getThemeColors(theme);

  const [selectedContact, setSelectedContact] = useState(null);
  const hideContactDetailsModal = () => setSelectedContact(null);

  const [contactToDelete, setContactToDelete] = useState(null);
  const hideContactToDeleteModal = () => setContactToDelete(null);

  const renderListItem = ({ item }: { item: Contact }) => {
    const { name, ethAddress, ensName } = item;
    return (
      <Swipeout
        right={[{
          component: (
            <SwipeoutButton
              onPress={() => setContactToDelete(item)}
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
      {!!contactToDelete && (
        <SlideModal
          isVisible={!isEmpty(contactToDelete)}
          onModalHide={hideContactToDeleteModal}
          noClose
          hideHeader
        >
          <ContentWrapper>
            <Spacing h={spacing.large * 2} />
            <MediumText medium negative>
              {t('alert.deleteContact.title', { contactName: contactToDelete?.name })}
            </MediumText>
            <Spacing h={spacing.large} />
            <ProfileImage
              userName={contactToDelete?.name}
              initialsSize={48}
              diameter={64}
              noShadow
              borderWidth={0}
            />
            <BaseText
              style={{ padding: spacing.large }}
              medium
              center
            >
              {t('alert.deleteContact.message')}
            </BaseText>
            <Spacing h={spacing.large} />
            <Button
              title={t('alert.deleteContact.button.ok')}
              onPress={() => {
                hideContactToDeleteModal();
                deleteContact(contactToDelete);
              }}
              block
              negative
              regularText
            />
            <Spacing h={4} />
            <Button
              onPress={hideContactToDeleteModal}
              title={t('alert.deleteContact.button.cancel')}
              light
              squarePrimary
              regularText
            />
          </ContentWrapper>
        </SlideModal>
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
  deleteContact: (contact: Contact) => dispatch(deleteContactAction(contact)),
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(ContactsList));
