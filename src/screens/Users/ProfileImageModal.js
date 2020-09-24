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
import t from 'translations/translate';
import styled from 'styled-components/native';
import SlideModal from 'components/Modals/SlideModal/SlideModal-old';
import Button from 'components/Button';
import { Spacing } from 'components/Layout';
import { MediumText } from 'components/Typography';
import ProfileImage from 'components/ProfileImage';


type Props = {
  isVisible: boolean,
  onModalHide: () => void,
  ensName: string,
  profileImageUri: ?string,
  username: string,
  onTakeSelfiePress: () => void,
  onUploadPicturePress: () => void,
  onDeleteAvatarPress: () => void,
};

const Wrapper = styled.View`
  align-items: center;
  padding: 20px 20px 50px;
`;

const ProfileImageModal = ({
  isVisible,
  onModalHide,
  ensName,
  profileImageUri,
  username,
  onTakeSelfiePress,
  onUploadPicturePress,
  onDeleteAvatarPress,
}: Props) => {
  return (
    <SlideModal
      isVisible={isVisible}
      onModalHide={onModalHide}
      hideHeader
      noPadding
    >
      <Wrapper>
        <MediumText medium center>{ensName}</MediumText>
        <Spacing h={19} />
        <ProfileImage
          uri={profileImageUri}
          userName={username}
          diameter={64}
          borderWidth={0}
          noShadow
        />
        <Spacing h={26} />
        <Button
          secondary
          block
          title={t('profileContent.modal.profileImage.button.takeSelfie')}
          onPress={onTakeSelfiePress}
        />
        <Spacing h={8} />
        <Button
          secondary
          block
          title={t('profileContent.modal.profileImage.button.uploadPicture')}
          onPress={onUploadPicturePress}
        />
        {!!profileImageUri && (
          <>
            <Spacing h={8} />
            <Button
              secondaryDanger
              block
              title={t('profileContent.modal.profileImage.button.deleteAvatar')}
              onPress={onDeleteAvatarPress}
            />
          </>
        )}
      </Wrapper>
    </SlideModal>
  );
};

export default ProfileImageModal;
