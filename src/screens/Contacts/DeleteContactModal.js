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
import { useDispatch } from 'react-redux';
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-navigation';
import t from 'translations/translate';

import SlideModal from 'components/Modals/SlideModal';
import ProfileImage from 'components/ProfileImage';
import { Spacing } from 'components/Layout';
import Button from 'components/Button';
import { BaseText, MediumText } from 'components/Typography';

import { spacing } from 'utils/variables';
import { deleteContactAction } from 'actions/contactsActions';

import type { Contact } from 'models/Contact';

type Props = {|
  contact: Contact;
|};

const ContentWrapper = styled(SafeAreaView)`
  width: 100%;
  padding-bottom: 40px;
  align-items: center;
`;

const DeleteContactModal = ({ contact }: Props) => {
  const modalRef = useRef();
  const dispatch = useDispatch();

  const close = () => {
    if (modalRef.current) modalRef.current.close();
  };

  return (
    <SlideModal
      ref={modalRef}
      noClose
      hideHeader
    >
      <ContentWrapper>
        <Spacing h={spacing.large * 2} />
        <MediumText medium negative>
          {t('alert.deleteContact.title', { contactName: contact.name })}
        </MediumText>
        <Spacing h={spacing.large} />
        <ProfileImage
          userName={contact.name}
          initialsSize={48}
          diameter={64}
          noShadow
          borderWidth={0}
        />
        <BaseText
          style={{ padding: spacing.large }}
          medium
          center
        >
          {t('alert.deleteContact.message')}
        </BaseText>
        <Spacing h={spacing.large} />
        <Button
          title={t('alert.deleteContact.button.ok')}
          onPress={() => {
            close();
            dispatch(deleteContactAction(contact));
          }}
          block
          negative
          regularText
        />
        <Spacing h={4} />
        <Button
          onPress={close}
          title={t('alert.deleteContact.button.cancel')}
          light
          squarePrimary
          regularText
        />
      </ContentWrapper>
    </SlideModal>
  );
};

export default DeleteContactModal;
