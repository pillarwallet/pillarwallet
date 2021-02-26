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
import { Keyboard } from 'react-native';
import styled from 'styled-components/native';
import isEmpty from 'lodash.isempty';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';

// components
import { MediumText, BaseText } from 'components/Typography';
import ProfileImage from 'components/ProfileImage';
import { Spacing } from 'components/Layout';
import Modal from 'components/Modal';

// selectors
import { activeAccountAddressSelector } from 'selectors';

// utils
import { isValidAddress, isEnsName } from 'utils/validators';
import { getColorByTheme } from 'utils/themes';
import { noop } from 'utils/common';

// types
import type { Contact } from 'models/Contact';

import ContactSelectorOptions from './ContactSelectorOptions';

export type Props = {|
  contacts?: Contact[],
  selectedContact?: ?Contact,
  onSelectContact?: (contact: ?Contact) => mixed,
  placeholder?: string,
  searchPlaceholder?: string,
  wrapperStyle?: Object,
  noOptionImageFallback?: boolean,
  hasQRScanner?: boolean,
  disableSelfSelect?: boolean,
  activeAccountAddress?: string,
  allowEnteringCustomAddress?: boolean,
  allowAddContact?: boolean,
  children?: any,
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
  onSelectContact = noop,
  disableSelfSelect,
  activeAccountAddress,
  placeholder = t('label.choseOption'),
  searchPlaceholder = t('label.search'),
  noOptionImageFallback,
  hasQRScanner,
  allowEnteringCustomAddress,
  allowAddContact = true,
  children,
}: Props) => {
  // ToDo: move to ContactSelectorOptions
  // const handleScannerReadResult = (address: string) => {
  //   if (isValidAddress(address)) {
  //     const option = {
  //       value: address,
  //       ethAddress: address,
  //       name: address,
  //     };
  //     onSelectContact(option);
  //     if (optionsRef.current) {
  //       optionsRef.current.close();
  //     }
  //   }
  // };

  const handleScannerOpen = () => {
    Keyboard.dismiss();
    // Modal.open(() => <AddressScanner onRead={handleScannerReadResult} />);
  };

  const handleSearchValidation = (searchQuery: string): ?string => {
    if (disableSelfSelect && searchQuery === activeAccountAddress) return t('error.cannotSendYourself');
    return null;
  };

  const openOptions = () => {
    Modal.open(() => (
      <ContactSelectorOptions
        contacts={contacts}
        onSelectContact={onSelectContact}
        title={placeholder}
        searchPlaceholder={searchPlaceholder}
        noImageFallback={noOptionImageFallback}
        iconProps={
          hasQRScanner && {
            icon: 'qrcode',
            style: { fontSize: 20, marginTop: 2 },
            onPress: handleScannerOpen,
          }
        }
        validator={handleSearchValidation}
        allowEnteringCustomAddress={allowEnteringCustomAddress}
        allowAddContact={allowAddContact}
      />
    ));
  };

  const renderContact = (contact: ?Contact) => {
    if (!contact) return null;

    let { name } = contact;

    if (isValidAddress(name) && !isEnsName(name)) {
      name = t('ellipsedMiddleString', {
        stringStart: name.slice(0, 6),
        stringEnd: name.slice(-6),
      });
    }

    return (
      <SelectedOption>
        <ProfileImage
          userName={name}
          diameter={16}
          noShadow
          borderWidth={0}
          initialsSize={10}
        />
        <Spacing w={8} />
        <MediumText medium>{name}</MediumText>
      </SelectedOption>
    );
  };

  const hasValue = !isEmpty(selectedContact);
  const disabled = !contacts?.length && !allowEnteringCustomAddress;
  const placeholderText = !disabled ? placeholder : t('label.noOptionsToSelect');

  return (
    <>
      <SelectorPill onPress={openOptions} disabled={disabled}>
        {hasValue ? (
          renderContact(selectedContact)
        ) : (
          <BaseText link medium>
            {placeholderText}
          </BaseText>
        )}
      </SelectorPill>
      {children}
    </>
  );
};

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
});

export default connect(structuredSelector)(ContactSelector);
