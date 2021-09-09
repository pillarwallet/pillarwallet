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
import { Keyboard } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import AddressScanner from 'components/QRCodeScanner/AddressScanner';
import Modal from 'components/Modal';
import ContactSelectorModalContent from 'components/Modals/ContactSelectorModal/ContactSelectorModalContent';

// Constants
import { SEND_TOKEN_SELECT_ASSET } from 'constants/navigationConstants';

// Selectors
import { useRootSelector, contactsSelector, activeAccountAddressSelector } from 'selectors';

// Utils
import { addressesEqual } from 'utils/assets';

// Types
import type { Contact } from 'models/Contact';

const SendFlowSelectRecipient = () => {
  const { t } = useTranslationWithPrefix('sendFlow.selectRecipient');
  const navigation = useNavigation();

  const allContacts = useRootSelector(contactsSelector);
  const activeAccountAddress = useRootSelector(activeAccountAddressSelector);

  const [query, setQuery] = React.useState('');

  // Hide contact for current address
  const contacts = allContacts.filter((contact) => !addressesEqual(contact.ethAddress, activeAccountAddress));

  const handleSelectContact = (contact: Contact) => {
    Keyboard.dismiss();
    navigation.navigate(SEND_TOKEN_SELECT_ASSET, { contact });
  };

  const openScanner = () => {
    Keyboard.dismiss();
    Modal.open(() => <AddressScanner onRead={(input) => setQuery(input)} />);
  };

  return (
    <Container>
      <HeaderBlock
        centerItems={[{ title: t('title') }]}
        rightItems={[
          {
            svgIcon: 'qrcode',
            onPress: openScanner,
          },
        ]}
        navigation={navigation}
        noPaddingTop
      />

      <ContactSelectorModalContent
        contacts={contacts}
        onSelectContact={handleSelectContact}
        query={query}
        onQueryChange={setQuery}
      />
    </Container>
  );
};

export default SendFlowSelectRecipient;
