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
import React, { useEffect, useState, useRef } from 'react';
import type { AbstractComponent } from 'react';
import { View } from 'react-native';
import { CachedImage } from 'react-native-cached-image';
import styled, { withTheme } from 'styled-components/native';
import isEmpty from 'lodash.isempty';
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
import Modal from 'components/Modal';

// utils
import { fontStyles, spacing } from 'utils/variables';
import { images } from 'utils/images';
import { getThemeColors } from 'utils/themes';
import { isUnstoppableName, isEnsName, isValidAddress } from 'utils/validators';
import { addressesEqual } from 'utils/assets';

import { isCaseInsensitiveMatch, lookupAddress } from 'utils/common';
import { getReceiverWithEnsName } from 'utils/contacts';

// types
import type { Theme } from 'models/Theme';
import type { Contact } from 'models/Contact';

type OwnProps = {|
  onSave: (contact: Contact) => void,
  contact: ?Contact,
  dirtyInputs?: boolean,
  isDefaultNameEns?: boolean,
  title?: string,
  contacts: Contact[],
  showQRScanner?: boolean,
  onModalHide?: () => void,
|};

type Props = {|
  ...OwnProps,
  theme: Theme,
|};

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

const ResolutionType = {
  None: 0,
  ENS: 1,
  Unstoppable: 2,
};

const ContactDetailsModal = ({
  theme,
  contact,
  onSave,
  isDefaultNameEns,
  title,
  contacts,
  showQRScanner,
  onModalHide,
}: Props) => {
  const [addressValue, setAddressValue] = useState('');
  const [nameValue, setNameValue] = useState('');
  const [dirtyInputs, setDirtyInputs] = useState(false);
  const [resolvingDomain, setResolvingDomain] = useState(ResolutionType.None);
  const [domainUnresolved, setDomainUnresolved] = useState(ResolutionType.None);
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
    if (domainUnresolved !== ResolutionType.None) { setDomainUnresolved(ResolutionType.None); } // reset
  }, [nameValue, addressValue]);

  useEffect(() => {
    if (
      resolvingDomain !== ResolutionType.None ||
      !isEmpty(nameValue) ||
      !isValidAddress(addressValue) ||
      isEnsName(addressValue)
    ) { return; }

    setResolvingDomain(ResolutionType.ENS);
    lookupAddress(addressValue)
      .then((ensName) => {
        if (ensName) setNameValue(ensName);
        setResolvingDomain(ResolutionType.None);
      })
      .catch(() => setResolvingDomain(ResolutionType.None));
  }, [addressValue]);

  useEffect(() => {
    if (
      resolvingDomain !== ResolutionType.None ||
      !isEmpty(addressValue) ||
      !isEnsName(nameValue) ||
      !isUnstoppableName(nameValue)
    ) { return; }

    const resolutionType = isEnsName(nameValue)
      ? ResolutionType.ENS
      : ResolutionType.Unstoppable;
    setDomainUnresolved(ResolutionType.None);
    setResolvingDomain(resolutionType);
    getReceiverWithEnsName(nameValue)
      .then(({ receiver }) => {
        if (receiver) {
          setAddressValue(receiver);
        } else {
          setDomainUnresolved(resolutionType);
        }
        setResolvingDomain(ResolutionType.None);
      })
      .catch(() => {
        setDomainUnresolved(resolutionType);
        setResolvingDomain(ResolutionType.None);
      });
  }, [nameValue]);

  let errorMessage;
  if (isEmpty(addressValue)) {
    errorMessage = t('error.emptyAddress');
  }
  if (!isValidAddress(addressValue)) {
    errorMessage = t('error.invalid.address');
  } else if (
    !addressesEqual(contact?.ethAddress, addressValue) &&
    contacts.some(({ ethAddress }) => addressesEqual(ethAddress, addressValue))
  ) {
    errorMessage = t('error.contactWithAddressExist');
  } else if (
    !isCaseInsensitiveMatch(contact?.name, nameValue) &&
    contacts.some(({ name }) => isCaseInsensitiveMatch(name, nameValue))
  ) {
    errorMessage = t('error.contactWithNameExist');
  } else if (isEmpty(nameValue)) {
    errorMessage = t('error.emptyName');
  }

  const colors = getThemeColors(theme);
  const modalRef = useRef();

  let buttonTitle = t('button.save');
  if (resolvingDomain === ResolutionType.ENS) {
    buttonTitle = `${t('label.resolvingEnsName')}..`;
  }
  if (resolvingDomain === ResolutionType.Unstoppable) {
    buttonTitle = `${t('label.resolvingUnstoppableName')}..`;
  }
  const onButtonPress = () => {
    if (!errorMessage && resolvingDomain === ResolutionType.None) {
      if (modalRef.current) modalRef.current.close();
      // $FlowFixMe: flow update to 0.122
      onSave({ ...contact, name: nameValue, ethAddress: addressValue });
    }
  };

  const handleScannerReadResult = (address: string) => {
    if (isEnsName(address) || isUnstoppableName(address)) {
      setAddressValue('');
      setNameValue(address);
    } else {
      setAddressValue(address);
    }
  };

  const openScanner = () =>
    Modal.open(() => <AddressScanner onRead={handleScannerReadResult} />);

  return (
    <ModalBox
      ref={modalRef}
      onModalHide={onModalHide}
      showModalClose
      noBoxMinHeight
    >
      <View style={{ padding: spacing.rhythm }}>
        <TitleWrapper>
          {!!title && (
            <Title
              align="center"
              title={title}
              style={{ marginBottom: spacing.small }}
              noMargin
            />
          )}
          {showQRScanner && (
            <QRCodeButton onPress={openScanner}>
              <QRCodeIcon name="qrcode" color={colors.link} />
            </QRCodeButton>
          )}
        </TitleWrapper>
        {renderContactInput(
          addressValue,
          setAddressValue,
          t('label.address'),
          walletIcon,
          theme,
        )}
        {renderContactInput(
          nameValue,
          setNameValue,
          t('label.name'),
          personIcon,
          theme,
        )}
        {domainUnresolved !== ResolutionType.None && (
          <StatusMessage secondary>
            {domainUnresolved === ResolutionType.ENS
              ? t('error.ensNameNotFound')
              : t('error.unstoppableNameNotFound')}
          </StatusMessage>
        )}
        {dirtyInputs &&
          resolvingDomain !== ResolutionType.None &&
          !!errorMessage && (
            <StatusMessage danger>{errorMessage}</StatusMessage>
          )}
        {resolvingDomain !== ResolutionType.None && (
          <LoadingSpinner size={25} />
        )}
        <Button
          marginTop={spacing.large}
          disabled={!dirtyInputs || !!errorMessage || resolvingDomain !== ResolutionType.None}
          onPress={onButtonPress}
          title={buttonTitle}
        />
      </View>
    </ModalBox>
  );
};

export default (withTheme(ContactDetailsModal): AbstractComponent<OwnProps>);
