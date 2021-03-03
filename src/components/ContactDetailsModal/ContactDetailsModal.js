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

import React, { useEffect, useState, useRef } from 'react';
import { View } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { useDebounce } from 'use-debounce';
import t from 'translations/translate';

// components
import ModalBox from 'components/ModalBox';
import Title from 'components/Title';
import Button from 'components/Button';
import { BaseText } from 'components/Typography';
import TextInput from 'components/TextInput';
import Spinner from 'components/Spinner';
import AddressScanner from 'components/QRCodeScanner/AddressScanner';
import Icon from 'components/Icon';
import Image from 'components/Image';
import Modal from 'components/Modal';

// utils
import { fontStyles, spacing } from 'utils/variables';
import { images } from 'utils/images';
import { getThemeColors } from 'utils/themes';
import { isEnsName, isValidAddress, isValidAddressOrEnsName } from 'utils/validators';
import { addressesEqual } from 'utils/assets';

import { isCaseInsensitiveMatch, resolveEnsName, lookupAddress } from 'utils/common';

// types
import type { Contact } from 'models/Contact';

type Props = {|
  onSave: (contact: Contact) => void,
  contact: ?Contact,
  title?: string,
  contacts: Contact[],
  showQRScanner?: boolean,
  onModalHide?: () => void,
|};


const InputWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: ${spacing.small}px;
`;

const FieldIcon = styled(Image)`
  width: 48px;
  height: 48px;
  margin-right: ${spacing.small}px;
`;

const StatusMessage = styled(BaseText)`
  margin-top: ${spacing.large}px;
  text-align: center;
  ${fontStyles.small};
`;

export const LoadingSpinner = styled(Spinner)`
  margin-top: ${spacing.large}px;
  align-items: center;
  justify-content: center;
`;

export const TitleWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

export const QRCodeButton = styled.TouchableOpacity`
  position: absolute;
  top: 0;
  right: 0;
`;

export const QRCodeIcon = styled(Icon)`
  color: ${({ color }) => color};
  font-size: 20px;
`;

const ContactDetailsModal = ({
  contact,
  onSave,
  title,
  contacts,
  showQRScanner,
  onModalHide,
}: Props) => {
  const modalRef = useRef();

  const [addressValue, setAddressValue] = useState('');
  const [nameValue, setNameValue] = useState('');
  const [dirtyInputs, setDirtyInputs] = useState(false);
  const [resolvingEns, setResolvingEns] = useState(false);
  const [hasEnsResolutionError, setHasEnsResolutionError] = useState(false);

  const [debouncedAddressValue] = useDebounce(addressValue, 500);

  const theme = useTheme();
  const colors = getThemeColors(theme);
  const { walletIcon, personIcon } = images(theme);

  // reset input value on default change
  useEffect(() => {
    setDirtyInputs(false);
    setAddressValue(contact?.ethAddress || '');
    setNameValue(contact?.name || '');
  }, [contact]);

  useEffect(() => {
    if (nameValue || addressValue) {
      setDirtyInputs(true);
    }

    setHasEnsResolutionError(false); // reset
  }, [nameValue, addressValue]);

  const reverseResolveEnsName = async (address: string) => {
    setResolvingEns(true);
    const ensName = await lookupAddress(address);
    setNameValue(ensName ?? '');
    setResolvingEns(false);
  };

  const validateEnsName = async (ensName: string) => {
    setResolvingEns(true);
    const address = await resolveEnsName(ensName);
    if (address) {
      setNameValue(ensName);
    }
    setHasEnsResolutionError(!address);
    setResolvingEns(false);
  };

  useEffect(() => {
    if (isValidAddress(addressValue)) {
      reverseResolveEnsName(addressValue);
    } else if (isEnsName(addressValue)) {
      validateEnsName(addressValue);
    }
  }, [debouncedAddressValue]);

  let errorMessage;
  if (!addressValue) {
    errorMessage = t('error.emptyAddress');
  } if (!isValidAddressOrEnsName(addressValue)) {
    errorMessage = t('error.invalid.address');
  } else if (!addressesEqual(contact?.ethAddress, addressValue)
    && contacts.some(({ ethAddress }) => addressesEqual(ethAddress, addressValue))) {
    errorMessage = t('error.contactWithAddressExist');
  } else if (!isCaseInsensitiveMatch(contact?.name, nameValue)
    && contacts.some(({ name }) => isCaseInsensitiveMatch(name, nameValue))) {
    errorMessage = t('error.contactWithNameExist');
  } else if (!nameValue) {
    errorMessage = t('error.emptyName');
  }

  const buttonTitle = resolvingEns ? `${t('label.resolvingEnsName')}..` : t('button.save');
  const onButtonPress = () => {
    if (!errorMessage && !resolvingEns) {
      modalRef.current?.close();
      onSave({ ...contact, name: nameValue, ethAddress: addressValue });
    }
  };

  const handleScannerReadResult = (address: string) => {
    if (isEnsName(address)) {
      setAddressValue('');
      setNameValue(address);
    } else {
      setAddressValue(address);
    }
  };

  const openScanner = () => Modal.open(() => <AddressScanner onRead={handleScannerReadResult} />);

  return (
    <ModalBox ref={modalRef} onModalHide={onModalHide} showModalClose noBoxMinHeight>
      <View style={{ padding: spacing.rhythm }}>
        <TitleWrapper>
          {!!title && <Title align="center" title={title} style={{ marginBottom: spacing.small }} noMargin />}

          {showQRScanner && (
            <QRCodeButton onPress={openScanner}>
              <QRCodeIcon name="qrcode" color={colors.link} />
            </QRCodeButton>
          )}
        </TitleWrapper>

        <InputWrapper>
          <FieldIcon source={walletIcon} />
          <TextInput
            theme={theme}
            inputWrapperStyle={{ flex: 1, paddingBottom: 0 }}
            inputProps={{
              value: addressValue,
              onChangeText: setAddressValue,
              placeholder: t('label.address'),
              autoCapitalize: 'none',
            }}
          />
        </InputWrapper>

        <InputWrapper>
          <FieldIcon source={personIcon} />
          <TextInput
            theme={theme}
            inputWrapperStyle={{ flex: 1, paddingBottom: 0 }}
            inputProps={{
              value: nameValue,
              onChangeText: setNameValue,
              placeholder: t('label.name'),
            }}
          />
        </InputWrapper>

        {hasEnsResolutionError && <StatusMessage secondary>{t('error.ensNameNotFound')}</StatusMessage>}

        {dirtyInputs && !resolvingEns && !!errorMessage && <StatusMessage danger>{errorMessage}</StatusMessage>}

        {resolvingEns && <LoadingSpinner size={25} />}

        <Button
          marginTop={spacing.large}
          disabled={!dirtyInputs || !!errorMessage || resolvingEns}
          onPress={onButtonPress}
          title={buttonTitle}
        />
      </View>
    </ModalBox>
  );
};

export default ContactDetailsModal;
