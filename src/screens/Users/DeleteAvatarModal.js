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

import React, { useRef, useCallback } from 'react';
import type { AbstractComponent } from 'react';
import t from 'translations/translate';
import styled from 'styled-components/native';
import { useSelector, useDispatch } from 'react-redux';

// components
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import { Spacing } from 'components/Layout';
import { MediumText, BaseText } from 'components/Typography';
import ProfileImage from 'components/ProfileImage';

// selectors
import { usernameSelector, updatedProfileImageSelector } from 'selectors/user';

// actions
import { deleteUserAvatarAction } from 'actions/userActions';

const Wrapper = styled.View`
  align-items: center;
  padding: 20px 20px 50px;
`;

const DeleteAvatarModal: AbstractComponent<{||}> = () => {
  const profileImage = useSelector(updatedProfileImageSelector);
  const username = useSelector(usernameSelector) ?? '';

  const dispatch = useDispatch();
  const modalRef = useRef();

  const close = useCallback(() => {
    if (modalRef.current) modalRef.current.close();
  }, []);

  const handleDeletePress = useCallback(() => {
    dispatch(deleteUserAvatarAction());
    close();
  }, [dispatch, close]);

  return (
    <SlideModal
      ref={modalRef}
      hideHeader
      noPadding
    >
      <Wrapper>
        <MediumText medium center negative>
          {t('profileContent.modal.deleteAvatar.title')}
        </MediumText>
        <Spacing h={19} />
        <ProfileImage
          uri={profileImage}
          userName={username}
          diameter={64}
          borderWidth={0}
          noShadow
        />
        <Spacing h={20} />
        <BaseText medium center>{t('profileContent.modal.deleteAvatar.paragraph.areYouSure')}</BaseText>
        <Spacing h={34} />
        <Button
          negative
          block
          title={t('profileContent.modal.deleteAvatar.button.delete')}
          onPress={handleDeletePress}
        />
        <Spacing h={8} />
        <Button
          squarePrimary
          block
          title={t('profileContent.modal.deleteAvatar.button.cancel')}
          onPress={close}
        />
      </Wrapper>
    </SlideModal>
  );
};

export default DeleteAvatarModal;
