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

import React, { useRef } from 'react';
import { SafeAreaView } from 'react-navigation';
import { useDispatch } from 'react-redux';
import styled from 'styled-components/native';
import t from 'translations/translate';

// Actions
import { deleteContactAction } from 'actions/contactsActions';

// Components
import { Spacing } from 'components/legacy/Layout';
import { BaseText, MediumText } from 'components/legacy/Typography';
import Button from 'components/legacy/Button';
import SlideModal from 'components/Modals/SlideModal';
import ProfileImage from 'components/ProfileImage';

// Utils
import { spacing } from 'utils/variables';

// Types
import type { Contact } from 'models/Contact';

type Props = {|
  contact: Contact;
|};

const DeleteContactModal = ({ contact }: Props) => {
  const modalRef = useRef();

  const dispatch = useDispatch();

  const close = () => {
    modalRef.current?.close();
  };

  return (
    <SlideModal ref={modalRef} noClose hideHeader>
      <ContentWrapper>
        <Spacing h={spacing.large} />

        <MediumText medium negative>
          {t('alert.deleteContact.title')}
        </MediumText>

        <Spacing h={spacing.large} />

        <ProfileImage userName={contact.name} diameter={64} borderWidth={0} />

        <Spacing h={spacing.large} />

        <BaseText center secondary>
          {t('alert.deleteContact.message', { name: contact.name })}
        </BaseText>

        <Spacing h={spacing.extraLarge} />

        <Button
          title={t('alert.deleteContact.button.ok')}
          onPress={() => {
            close();
            dispatch(deleteContactAction(contact));
          }}
          block
          danger
        />

        <Spacing h={4} />

        <Button onPress={close} title={t('alert.deleteContact.button.cancel')} transparent />
      </ContentWrapper>
    </SlideModal>
  );
};

export default DeleteContactModal;

const ContentWrapper = styled(SafeAreaView)`
  width: 100%;
  padding-bottom: 40px;
  align-items: center;
`;
