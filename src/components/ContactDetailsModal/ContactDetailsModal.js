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
/* eslint-disable i18next/no-literal-string */

import React, { useEffect, useState, useRef } from 'react';
import { View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import styled, { useTheme } from 'styled-components/native';
import { useDebounce } from 'use-debounce';
import t from 'translations/translate';

// Components
import { BaseText } from 'components/legacy/Typography';
import AddressScanner from 'components/QRCodeScanner/AddressScanner';
import Button from 'components/legacy/Button';
import Icon from 'components/legacy/Icon';
import Image from 'components/Image';
import Modal from 'components/Modal';
import ModalBox from 'components/ModalBox';
import Spinner from 'components/Spinner';
import TextInput from 'components/legacy/TextInput';
import Title from 'components/legacy/Title';

// Utils
import { addressesEqual } from 'utils/assets';
import { isCaseInsensitiveMatch, resolveEnsName, lookupAddress } from 'utils/common';
import { images } from 'utils/images';
import { getThemeColors } from 'utils/themes';
import { useNameValid, isValidAddress } from 'utils/validators';
import { fontStyles, spacing } from 'utils/variables';

// Types
import type { Contact } from 'models/Contact';
import type { Chain } from 'models/Chain';

type Props = {|
  onSave: (contact: Contact) => void,
  contact: ?Contact,
  title?: string,
  contacts: Contact[],
  showQRScanner?: boolean,
  onModalHide?: () => void,
  chain?: ?Chain,
|};

type FormData = {|
  address: string,
  name: string,
|};

const ContactDetailsModal = ({ chain, contact, onSave, title, contacts, showQRScanner, onModalHide }: Props) => {
  const modalRef = useRef();
  const [query, setQuery] = useState('');

  const validInputQuery = useNameValid(query, chain);
  const { data } = validInputQuery;

  const formSchema = yup.object().shape({
    address: yup
      .string()
      .required(t('error.emptyAddress'))
      .test('isValid', t('error.invalid.address'), (value) => {
        setQuery(value);
        return isValidAddress(value) && !data?.[0];
      })
      .test(
        'alreadyExists',
        t('error.contactWithAddressExists'),
        (value) =>
          addressesEqual(contact?.ethAddress, value) ||
          !contacts.some(({ ethAddress }) => addressesEqual(ethAddress, value)),
      ),
    name: yup
      .string()
      .required(t('error.emptyName'))
      .test(
        'alreadyExists',
        t('error.contactWithNameExists'),
        (value) =>
          isCaseInsensitiveMatch(contact?.name, value) ||
          !contacts.some(({ name }) => isCaseInsensitiveMatch(name, value)),
      ),
  });

  const { control, handleSubmit, errors, watch, getValues, setValue } = useForm({
    defaultValues: { address: contact?.ethAddress || '', name: contact?.name || '' },
    resolver: yupResolver(formSchema),
    mode: 'onTouched',
  });

  const [isResolvingEns, setIsResolvingEns] = useState(false);
  const [hasEnsFailedToResolve, setHasEnsFailedToResolve] = useState(false);

  const [debouncedAddress] = useDebounce(watch('address'), 500);

  useEffect(() => {
    const handleAddressChange = async () => {
      if (data) {
        setIsResolvingEns(true);
        const resolvedAddress = await resolveEnsName(debouncedAddress);
        setIsResolvingEns(false);

        setHasEnsFailedToResolve(!resolvedAddress);
        if (resolvedAddress && !getValues('name')) {
          setValue('name', debouncedAddress, { shouldValidate: true, shouldDirty: true });
        }
        return;
      }

      setHasEnsFailedToResolve(false);

      if (isValidAddress(debouncedAddress) && !getValues('name')) {
        setIsResolvingEns(true);
        const ensName = await lookupAddress(debouncedAddress);
        setIsResolvingEns(false);

        if (ensName && !getValues('name')) {
          setValue('name', ensName, { shouldValidate: true, shouldDirty: true });
        }
      }
    };
    handleAddressChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedAddress]);

  const onSubmit = async ({ address, name }: FormData) => {
    if (hasEnsFailedToResolve) return;

    modalRef.current?.close();
    onSave({ ethAddress: address, name });
  };

  const theme = useTheme();
  const colors = getThemeColors(theme);
  const { walletIcon, personIcon } = images(theme);

  const handleScannerRead = (address: string) => {
    setValue('address', address, { shouldValidate: true, shouldDirty: true });
  };

  const openScanner = () => Modal.open(() => <AddressScanner onRead={handleScannerRead} />);

  const errorMessage = errors.address?.message ?? errors.name?.message;

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

        <Controller
          name="address"
          control={control}
          render={({ value, onChange, onBlur }) => (
            <InputWrapper>
              <FieldIcon source={walletIcon} />
              <TextInput
                theme={theme}
                inputWrapperStyle={{ flex: 1, paddingBottom: 0 }}
                inputProps={{
                  value,
                  onChangeText: onChange,
                  onBlur,
                  placeholder: t('label.address'),
                  autoCapitalize: 'none',
                  autoFocus: !contact?.ethAddress,
                }}
              />
            </InputWrapper>
          )}
        />

        <Controller
          name="name"
          control={control}
          render={({ value, onChange, onBlur }) => (
            <InputWrapper>
              <FieldIcon source={personIcon} />
              <TextInput
                theme={theme}
                inputWrapperStyle={{ flex: 1, paddingBottom: 0 }}
                inputProps={{
                  value,
                  onChangeText: onChange,
                  onBlur,
                  placeholder: t('label.name'),
                }}
              />
            </InputWrapper>
          )}
        />

        {isResolvingEns && <LoadingSpinner size={25} />}

        {!!errorMessage && <StatusMessage danger>{errorMessage}</StatusMessage>}

        {hasEnsFailedToResolve && !isResolvingEns && (
          <StatusMessage secondary>{t('error.ensNameNotFound')}</StatusMessage>
        )}

        <Button
          title={isResolvingEns ? `${t('label.resolvingEnsName')}...` : t('button.save')}
          disabled={isResolvingEns}
          onPress={handleSubmit(onSubmit)}
          marginTop={spacing.large}
        />
      </View>
    </ModalBox>
  );
};

export default ContactDetailsModal;

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
  ${fontStyles.small};
  margin-top: ${spacing.large}px;
  text-align: center;
`;

const LoadingSpinner = styled(Spinner)`
  margin-top: ${spacing.large}px;
  align-items: center;
  justify-content: center;
`;

const TitleWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const QRCodeButton = styled.TouchableOpacity`
  position: absolute;
  top: 0;
  right: 0;
`;

const QRCodeIcon = styled(Icon)`
  color: ${({ color }) => color};
  font-size: 20px;
`;
