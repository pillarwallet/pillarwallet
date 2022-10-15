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

import React from 'react';
import styled from 'styled-components/native';
import t from 'translations/translate';

// Components
import { Spacing } from 'components/legacy/Layout';
import { MediumText, BaseText } from 'components/legacy/Typography';
import Modal from 'components/Modal';
import ContactSelectorModal from 'components/Modals/ContactSelectorModal';
import ProfileImage from 'components/ProfileImage';
import Spinner from 'components/Spinner';

// Utils
import { resolveContact } from 'utils/contacts';
import { isValidAddress } from 'utils/validators';
import { spacing } from 'utils/variables';

// Types
import type { Contact } from 'models/Contact';
import type { Chain } from 'models/Chain';

export type ContactSelectorProps = {|
  contacts?: Contact[],
  selectedContact?: ?Contact,
  onSelectContact?: (contact: ?Contact) => mixed,
  placeholder?: string,
  disabled?: boolean,
  chain?: ?Chain,
|};

const SelectorPill = styled.TouchableOpacity`
  min-height: 44px;
  justify-content: center;
  padding: ${spacing.medium}px ${spacing.mediumLarge}px;
  background-color: ${({ theme }) => theme.colors.inputField};
  border-radius: 1000px;
`;

const SelectedOption = styled.View`
  flex-direction: row;
  align-items: center;
`;

const ContactSelector = ({
  contacts,
  selectedContact,
  onSelectContact,
  placeholder = t('label.whereToSend'),
  disabled,
  chain,
}: ContactSelectorProps) => {
  const [isResolvingContact, setIsResolvingContact] = React.useState(false);

  const handleSelectContact = async (contact: ?Contact) => {
    setIsResolvingContact(true);
    const resolvedContact = await resolveContact(contact, chain);
    setIsResolvingContact(false);

    onSelectContact?.(resolvedContact);
  };

  const openOptions = () => {
    Modal.open(() => <ContactSelectorModal chain={chain} contacts={contacts} onSelectContact={handleSelectContact} />);
  };

  const renderContact = () => {
    if (isResolvingContact) {
      return <Spinner size={20} />;
    }

    if (!selectedContact) {
      return (
        <BaseText link medium>
          {disabled || placeholder}
        </BaseText>
      );
    }

    const name = selectedContact.name || selectedContact.ensName || selectedContact.ethAddress;
    const textProps = isValidAddress(name) ? { tiny: true } : { medium: true };

    return (
      <SelectedOption>
        <ProfileImage userName={name} diameter={16} borderWidth={0} />
        <Spacing w={8} />
        <MediumText {...textProps}>{name}</MediumText>
      </SelectedOption>
    );
  };

  return (
    <SelectorPill onPress={openOptions} disabled={disabled}>
      {renderContact()}
    </SelectorPill>
  );
};

export default ContactSelector;
