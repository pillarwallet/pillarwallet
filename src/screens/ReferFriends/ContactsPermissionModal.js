// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-expressions */

import React, { useRef } from 'react';
import { useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled, { useTheme } from 'styled-components/native';
import t from 'translations/translate';

// Actions
import { allowToAccessPhoneContactsAction } from 'actions/referralsActions';

// Components
import { Spacing } from 'components/Layout';
import { BaseText, MediumText } from 'components/Typography';
import Button from 'components/Button';
import Image from 'components/Image';
import SlideModal from 'components/Modals/SlideModal';

// Utils
import { images } from 'utils/images';
import { spacing } from 'utils/variables';

type Props = {|
  onAllow: () => mixed;
  onCancel: () => mixed;
|};

const ContactsPermissionModal = ({ onAllow, onCancel }: Props) => {
  const modalRef = useRef();

  const dispatch = useDispatch();

  const theme = useTheme();

  const handleAllowPress = () => {
    dispatch(allowToAccessPhoneContactsAction());
    modalRef.current?.close();
    onAllow();
  };

  const handleCancelPress = () => {
    modalRef.current?.close();
    onCancel();
  };

  return (
    <SlideModal ref={modalRef} onDismiss={handleCancelPress} noClose hideHeader>
      <SafeAreaContent>
        <Spacing h={spacing.large} />

        <MediumText medium>{t('referralsContent.modal.contactsPermission.title')}</MediumText>

        <Spacing h={spacing.large} />

        <IconImage source={images(theme).roundedPhoneIcon} />

        <Spacing h={spacing.large} />

        <BaseText center secondary>
          {t('referralsContent.modal.contactsPermission.body')}
        </BaseText>

        <Spacing h={spacing.extraLarge} />

        <Button title={t('referralsContent.modal.contactsPermission.allow')} onPress={handleAllowPress} block />

        <Spacing h={spacing.small} />

        <Button onPress={handleCancelPress} title={t('button.cancel')} transparent danger />
      </SafeAreaContent>
    </SlideModal>
  );
};

export default ContactsPermissionModal;

const SafeAreaContent = styled(SafeAreaView)`
  align-items: center;
`;

const IconImage = styled(Image)`
  width: 64px;
  height: 64px;
`;
