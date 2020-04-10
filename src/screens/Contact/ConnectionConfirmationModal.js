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

import * as React from 'react';
import capitalize from 'lodash.capitalize';
import { SafeAreaView } from 'react-navigation';

// constants
import {
  DISCONNECT,
  MUTE,
  BLOCK,
  STATUS_BLOCKED,
  STATUS_MUTED,
} from 'constants/connectionsConstants';
import styled from 'styled-components/native';

// components
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import { Paragraph } from 'components/Typography';
import Icon from 'components/Icon';
import ProfileImage from 'components/ProfileImage';
import ButtonText from 'components/ButtonText';
import { fontSizes, spacing } from 'utils/variables';
import { themedColors } from 'utils/themes';

// types
import type { ApiUser } from 'models/Contacts';


type Props = {
  onModalHide: () => void,
  onConfirm: (status: ?string) => void,
  showConfirmationModal: boolean,
  manageContactType: string,
  contact: ApiUser,
};


const ContentWrapper = styled(SafeAreaView)`
  width: 100%;
  padding-bottom: 40px;
  align-items: center;
`;

const HeaderIcon = styled(Icon)`
  font-size: ${fontSizes.medium}px;
  margin-right: 7px;
  color: ${({ notice }) => notice ? themedColors.notice : themedColors.primary};
`;

const StyledProfileImage = styled(ProfileImage)`
  margin-top: 4px;
`;


/* eslint max-len:0 */
const subtitleDescription = {
  block: 'If you block the user, you will not longer be able to receive notifications for chat or transactions. You can unblock later.',
  disconnect: 'If you disconnect the user, you will not longer be able to receive notifications for chat or transactions. You can connect later.',
  mute: 'If you mute the user, you will not longer be able to receive notifications for chat or transactions. You can unmute later.',
  unmute: 'If you unmute the user, you will be able to receive notifications for chat and transactions.',
  unblock: 'If you unblock the user, your connection will return all functionality to normal.',
};

const titleConfirmation = (manageContactType: string, username: string) => {
  const contactType = manageContactType;
  const usernameToConfirm = username;
  return `${capitalize(contactType)}${contactType === DISCONNECT ? ' from ' : ' '}${usernameToConfirm}`;
};

const getIconName = (contactType) => {
  switch (contactType) {
    case MUTE:
      return 'mute';
    case DISCONNECT:
      return 'remove';
    case BLOCK:
      return 'warning';
    default:
      return null;
  }
};


const ConnectionConfirmationModal = (props: Props) => {
  const {
    onModalHide,
    onConfirm,
    showConfirmationModal,
    manageContactType,
    contact,
  } = props;

  const {
    username,
    status,
    profileImage,
    lastUpdateTime,
  } = contact;
  let contactType = manageContactType;
  if ((contactType === MUTE || contactType === '') && status === STATUS_MUTED) {
    contactType = 'unmute';
  } else if ((contactType === BLOCK || contactType === '') && status === STATUS_BLOCKED) {
    contactType = 'unblock';
  }
  const subtitle = contactType !== '' ?
    subtitleDescription[contactType] : '';

  const iconName = getIconName(contactType);
  const userImageUri = profileImage ? `${profileImage}?t=${lastUpdateTime || 0}` : null;

  return (
    <SlideModal
      isVisible={showConfirmationModal}
      onModalHide={onModalHide}
      noClose
      headerProps={{
        centerItems: [
          { custom: !!iconName && <HeaderIcon name={iconName} notice={contactType === BLOCK} /> },
          { title: titleConfirmation(contactType, username) },
        ],
        sideFlex: '0',
        wrapperStyle: { paddingTop: 8, paddingHorizontal: spacing.small },
      }}
    >
      <ContentWrapper forceInset={{ top: 'never', bottom: 'always' }}>
        <StyledProfileImage
          uri={userImageUri}
          userName={username}
          diameter={64}
          borderWidth={0}
          noShadow
        />
        <Paragraph small style={{ marginTop: 20, marginBottom: 34 }}>
          {subtitle}
        </Paragraph>
        <Button
          secondary
          title={`Confirm ${contactType}`}
          onPress={() => { onConfirm(status); }}
          regularText
          style={{ marginBottom: 13 }}
          textStyle={{ fontSize: fontSizes.medium }}
          block
        />
        <ButtonText
          buttonText="Cancel"
          onPress={onModalHide}
          fontSize={fontSizes.medium}
          wrapperStyle={{ marginTop: spacing.medium }}
        />
      </ContentWrapper>
    </SlideModal>
  );
};

export default ConnectionConfirmationModal;
