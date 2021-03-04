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

import React from 'react';
import styled from 'styled-components/native';
import t from 'translations/translate';

// Components
import { Spacing } from 'components/Layout';
import { MediumText, BaseText } from 'components/Typography';
import Modal from 'components/Modal';
import ProfileImage from 'components/ProfileImage';
import Spinner from 'components/Spinner';

// Utils
import { resolveContact } from 'utils/contacts';
import { getColorByTheme } from 'utils/themes';
import { isValidAddress } from 'utils/validators';

// Types
import type { Contact } from 'models/Contact';

import ContactSelectorOptions from './ContactSelectorOptions';

export type ContactSelectorProps = {|
  contacts?: Contact[],
  selectedContact?: ?Contact,
  onSelectContact?: (contact: ?Contact) => mixed,
  placeholder?: string,
  allowCustomAddress?: boolean,
  allowAddContact?: boolean,
  disabled?: boolean,
|};

const SelectorPill = styled.TouchableOpacity`
  background-color: ${getColorByTheme({ lightKey: 'basic060', darkKey: 'basic080' })};
  padding: 10px 16px;
  border-radius: 24px;
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
  allowCustomAddress = true,
  allowAddContact = true,
  disabled,
}: ContactSelectorProps) => {
  const [isResolvingContact, setIsResolvingContact] = React.useState(false);

  const handleSelectContact = async (contact: ?Contact) => {
    setIsResolvingContact(true);
    const resolvedContact = await resolveContact(contact);
    setIsResolvingContact(false);

    onSelectContact?.(resolvedContact);
  };

  const openOptions = () => {
    Modal.open(() => (
      <ContactSelectorOptions
        contacts={contacts}
        onSelectContact={handleSelectContact}
        allowCustomAddress={allowCustomAddress}
        allowAddContact={allowAddContact}
      />
    ));
  };

  const hasNoOptions = !contacts?.length && !allowCustomAddress;

  const renderContact = () => {
    if (isResolvingContact) {
      return <Spinner size={20} />;
    }

    if (!selectedContact) {
      return (
        <BaseText link medium>
          {disabled || hasNoOptions ? t('label.noOptionsToSelect') : placeholder}
        </BaseText>
      );
    }

    let { name } = selectedContact;

    if (isValidAddress(name)) {
      name = t('ellipsedMiddleString', {
        stringStart: name.slice(0, 6),
        stringEnd: name.slice(-6),
      });
    }

    return (
      <SelectedOption>
        <ProfileImage userName={name} diameter={16} noShadow borderWidth={0} initialsSize={10} />
        <Spacing w={8} />
        <MediumText medium>{name}</MediumText>
      </SelectedOption>
    );
  };

  return (
    <SelectorPill onPress={openOptions} disabled={disabled || hasNoOptions}>
      {renderContact()}
    </SelectorPill>
  );
};

export default ContactSelector;
