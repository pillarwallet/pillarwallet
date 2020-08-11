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
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { CachedImage } from 'react-native-cached-image';
import styled, { withTheme } from 'styled-components/native';
import isEmpty from 'lodash.isempty';

// components
import ModalBox from 'components/ModalBox';
import Title from 'components/Title';
import Button from 'components/Button';
import { BaseText } from 'components/Typography';
import TextInput from 'components/TextInput';

// utils
import { fontStyles, spacing } from 'utils/variables';
import { images } from 'utils/images';
import { themedColors } from 'utils/themes';
import { isValidAddress } from 'utils/validators';
import { addressesEqual } from 'utils/assets';

// types
import type { Theme } from 'models/Theme';
import type { Contact } from 'models/Contact';


type Props = {
  theme: Theme,
  isVisible: boolean,
  onModalHide: () => void,
  onSavePress: (contact: Contact) => void,
  contact: ?Contact,
  dirtyInputs?: boolean,
  isDefaultNameEns?: boolean,
  title?: string,
  contacts: Contact[],
};

const InputWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: ${spacing.small}px;
`;

const FieldIcon = styled(CachedImage)`
  width: 48px;
  height: 48px;
  margin-right: ${spacing.small}px;
`;

const ErrorMessage = styled(BaseText)`
  margin-top: ${spacing.large}px;
  text-align: center;
  color: ${themedColors.negative};
  ${fontStyles.small};
`;

const renderContactInput = (
  value: string,
  onChangeText: (value: string) => void,
  placeholder: string,
  icon: string,
  theme: Theme,
) => (
  <InputWrapper>
    <FieldIcon source={icon} />
    <TextInput
      theme={theme}
      inputWrapperStyle={{ flex: 1, paddingBottom: 0 }}
      inputProps={{
        value,
        onChangeText,
        placeholder,
      }}
    />
  </InputWrapper>
);

const ContactDetailsModal = ({
  isVisible,
  onModalHide,
  theme,
  contact,
  onSavePress,
  isDefaultNameEns,
  title,
  contacts,
}: Props) => {
  const [addressValue, setAddressValue] = useState('');
  const [nameValue, setNameValue] = useState('');
  const [dirtyInputs, setDirtyInputs] = useState(false);
  const { walletIcon, personIcon } = images(theme);

  // reset input value on default change
  useEffect(() => {
    setDirtyInputs(false);
    setAddressValue(contact?.ethAddress || '');
    const defaultName = isDefaultNameEns ? contact?.ensName : contact?.name;
    setNameValue(defaultName || '');
  }, [contact]);

  useEffect(() => {
    if (!dirtyInputs && (!isEmpty(nameValue) || !isEmpty(addressValue))) {
      setDirtyInputs(true);
    }
  }, [nameValue, addressValue]);

  let errorMessage;
  if (isEmpty(addressValue)) {
    errorMessage = 'Address cannot be empty';
  } if (!isValidAddress(addressValue)) {
    errorMessage = 'Invalid address';
  } else if (!addressesEqual(contact?.ethAddress, addressValue)
    && contacts.some(({ ethAddress }) => addressesEqual(ethAddress, addressValue))) {
    errorMessage = 'Contact with this address already exist';
  } else if (isEmpty(nameValue)) {
    errorMessage = 'Name cannot be empty';
  }

  return (
    <ModalBox
      isVisible={isVisible}
      onModalHide={onModalHide}
      showModalClose
      noBoxMinHeight
    >
      <View style={{ padding: spacing.rhythm }}>
        {!!title && (
          <Title
            align="center"
            title={title}
            style={{ marginBottom: spacing.small }}
            noMargin
          />
        )}
        {renderContactInput(addressValue, setAddressValue, 'Address', walletIcon, theme)}
        {renderContactInput(nameValue, setNameValue, 'Name', personIcon, theme)}
        {dirtyInputs && !!errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        <Button
          marginTop={spacing.large}
          disabled={!dirtyInputs || !!errorMessage}
          onPress={() => !errorMessage && onSavePress({ ...contact, name: nameValue, ethAddress: addressValue })}
          title="Save"
        />
      </View>
    </ModalBox>
  );
};

export default withTheme(ContactDetailsModal);
