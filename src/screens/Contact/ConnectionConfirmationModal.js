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
import { baseColors, fontSizes } from 'utils/variables';
import { DISCONNECT } from 'constants/connectionsConstants';
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';

/* eslint max-len:0 */
const subtitleDescription = {
  block: `You will no longer be able to find this user, chat, and make any transactions.
  Your chat history will be erased on your device. No notifications on this user's actions will be received.
  This user will not  be able to see any of your activity. You can unblock the user from your blocked list.`,
  disconnect: 'After disconnecting you no longer be able to chat and send assets. You can re-establish connection later.',
};

const titleConfirmation = (manageContactType: string, username: string) => {
  const contactType = manageContactType;
  const usernameToConfirm = username;
  return `${contactType} ${contactType === DISCONNECT ? 'from' : ''} ${usernameToConfirm}`;
};

type Props = {
  onModalHide: Function,
  onConfirm: Function,
  showConfirmationModal: boolean,
  manageContactType: string,
  contact: Object,
};

const ConnectionConfirmationModal = (props: Props) => {
  const {
    onModalHide,
    onConfirm,
    showConfirmationModal,
    manageContactType,
    contact,
  } = props;

  const contactType = manageContactType;
  const { username } = contact;
  const subtitle = contactType !== '' ?
    subtitleDescription[contactType] : '';

  return (
    <SlideModal
      isVisible={showConfirmationModal}
      onModalHide={onModalHide}
      title={titleConfirmation(contactType, username)}
      fullWidthTitle
      noWrapTitle
      noClose
      subtitle={subtitle}
      subtitleStyles={{
        color: baseColors.darkGray,
        fontSize: fontSizes.small,
        lineHeight: 21,
        letterSpacing: 0.1,
        marginTop: 7,
        marginBottom: 22,
      }}
    >
      <Button
        dangerInverted
        title={`Confirm ${contactType}`}
        onPress={onConfirm}
        style={{
          marginBottom: 13,
        }}
      />
      <Button
        primaryInverted
        title="Cancel"
        onPress={onModalHide}
        style={{
          marginBottom: 58,
        }}
      />
    </SlideModal>
  );
};

export default ConnectionConfirmationModal;
