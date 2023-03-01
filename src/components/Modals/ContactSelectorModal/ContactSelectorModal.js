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
import t from 'translations/translate';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import AddressScanner from 'components/QRCodeScanner/AddressScanner';
import Modal from 'components/Modal';

// Selectors
import { useRootSelector, activeAccountAddressSelector } from 'selectors';

// Utils
import { addressesEqual } from 'utils/assets';

// Types
import type { Contact } from 'models/Contact';
import type { Chain } from 'models/Chain';

// Local
import ContactSelectorModalContent from './ContactSelectorModalContent';

type Props = {|
  contacts?: Contact[],
  onSelectContact?: (contact: ?Contact) => mixed,
  title?: string,
  chain?: ?Chain,
|};

const ContactSelectorModal = ({ chain, contacts = [], onSelectContact, title = t('label.sendTo') }: Props) => {
  const modalRef = React.useRef(null);

  const activeAccountAddress = useRootSelector(activeAccountAddressSelector);

  const [query, setQuery] = React.useState('');

  // Hide contact for current address
  contacts = contacts.filter((contact) => !addressesEqual(contact.ethAddress, activeAccountAddress));

  const close = () => {
    Keyboard.dismiss();
    modalRef.current?.close();
  };

  const handleSelectContact = (contact: Contact) => {
    onSelectContact?.(contact);
    close();
  };

  const openScanner = () => {
    Keyboard.dismiss();
    Modal.open(() => <AddressScanner onRead={(input) => setQuery(input)} />);
  };

  return (
    <Modal ref={modalRef} avoidKeyboard={false} swipeDirection={[]}>
      <Container>
        <HeaderBlock
          noPaddingTop
          leftItems={[
            {
              close: true,
            },
          ]}
          centerItems={[{ title }]}
          rightItems={[
            {
              svgIcon: 'qrcode',
              onPress: openScanner,
            },
          ]}
          onClose={close}
        />

        <ContactSelectorModalContent
          chain={chain}
          contacts={contacts}
          onSelectContact={handleSelectContact}
          query={query}
          onQueryChange={setQuery}
        />
      </Container>
    </Modal>
  );
};

export default ContactSelectorModal;
