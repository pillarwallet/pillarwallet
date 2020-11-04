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

import React, { useCallback } from 'react';
import type { AbstractComponent } from 'react';
import { Platform } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components/native';
import t from 'translations/translate';
import ImagePicker from 'react-native-image-crop-picker';
import { PERMISSIONS, RESULTS, request as requestPermission } from 'react-native-permissions';

// components
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import { Spacing } from 'components/Layout';
import { MediumText } from 'components/Typography';
import ProfileImage from 'components/ProfileImage';
import Modal from 'components/Modal';
import Toast from 'components/Toast';
import Camera from 'components/Camera';

// selectors
import { usernameSelector, updatedProfileImageSelector, walletIdSelector } from 'selectors/user';
import { accountsSelector } from 'selectors/selectors';

// actions
import { updateUserAvatarAction } from 'actions/userActions';
import { handleImagePickAction } from 'actions/appSettingsActions';

// utlis
import { getEnsName } from 'utils/accounts';
import { reportLog } from 'utils/common';

// partials
import DeleteAvatarModal from './DeleteAvatarModal';

const Wrapper = styled.View`
  align-items: center;
  padding: 20px 20px 50px;
`;

const ProfileImageModal: AbstractComponent<{||}> = () => {
  const profileImage = useSelector(updatedProfileImageSelector);
  const username = useSelector(usernameSelector) ?? '';
  const ensName = getEnsName(useSelector(accountsSelector));
  const walletId = useSelector(walletIdSelector);

  const dispatch = useDispatch();

  const openCamera = useCallback(async () => {
    let statusPhoto = RESULTS.GRANTED; // android doesn't need extra permission
    if (Platform.OS === 'ios') {
      statusPhoto = await requestPermission(PERMISSIONS.IOS.PHOTO_LIBRARY);
    }
    const statusCamera = await requestPermission(Platform.select({
      android: PERMISSIONS.ANDROID.CAMERA,
      ios: PERMISSIONS.IOS.CAMERA,
    }));

    const permissionsGranted = statusPhoto === RESULTS.GRANTED && statusCamera === RESULTS.GRANTED;

    Modal.open(() => <Camera permissionsGranted={permissionsGranted} />);
  }, []);

  const openImagePicker = useCallback(() => {
    dispatch(handleImagePickAction(true));

    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropperCircleOverlay: true,
      cropping: true,
    })
      .then((image) => {
        dispatch(handleImagePickAction(false));
        if (!walletId) return;

        const formData: any = new FormData();
        formData.append('walletId', walletId);
        formData.append('image', { uri: image.path, name: 'image.jpg', type: 'multipart/form-data' });
        dispatch(updateUserAvatarAction(walletId, formData));
      })
      .catch((error) => {
        dispatch(handleImagePickAction(false));
        if (error?.code === 'E_PICKER_CANCELLED') return;

        reportLog('Failed to get image from the gallery', { error });
        Toast.show({
          message: t('toast.failedToUploadImage'),
          emoji: 'hushed',
          autoClose: true,
        });
      });
  }, [dispatch, walletId]);

  const openDeletionModal = useCallback(() => {
    Modal.open(() => <DeleteAvatarModal />);
  }, []);

  return (
    <SlideModal
      hideHeader
      noPadding
    >
      <Wrapper>
        <MediumText medium center>{ensName}</MediumText>
        <Spacing h={19} />
        <ProfileImage
          uri={profileImage}
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
          onPress={openCamera}
        />
        <Spacing h={8} />
        <Button
          secondary
          block
          title={t('profileContent.modal.profileImage.button.uploadPicture')}
          onPress={openImagePicker}
        />
        {!!profileImage && (
          <>
            <Spacing h={8} />
            <Button
              secondaryDanger
              block
              title={t('profileContent.modal.profileImage.button.deleteAvatar')}
              onPress={openDeletionModal}
            />
          </>
        )}
      </Wrapper>
    </SlideModal>
  );
};

export default ProfileImageModal;
