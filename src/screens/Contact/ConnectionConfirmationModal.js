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

// constants
import {
  DISCONNECT,
  MUTE,
  BLOCK,
  STATUS_BLOCKED,
  STATUS_MUTED,
} from 'constants/connectionsConstants';

// components
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import { Paragraph } from 'components/Typography';

/* eslint max-len:0 */
const subtitleDescription = {
  block: 'You will no longer be able to find this user, chat, and make any transactions.\n' +
"Your chat history will be erased on your device. No notifications on this user's actions will be received.\n" +
'This user will not be able to see any of your activity. \nYou can unblock the user from your blocked list.',
  disconnect: 'After disconnecting you will no longer be able to chat and send assets. You can re-establish connection later.',
  mute: 'If you mute the user, you will not longer be able to receive notifications for chat or transactions. You can unmute later.',
  unmute: 'If you unmute the user, you will be able to receive notifications for chat and transactions.',
  unblock: 'If you unblock the user, your connection will return all functionality to normal.',
};

const titleConfirmation = (manageContactType: string, username: string) => {
  const contactType = manageContactType;
  const usernameToConfirm = username;
  return `${capitalize(contactType)} ${contactType === DISCONNECT ? 'from' : ''} ${usernameToConfirm}`;
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

  const { username, status } = contact;
  let contactType = manageContactType;
  if ((contactType === MUTE || contactType === '') && status === STATUS_MUTED) {
    contactType = 'unmute';
  } else if ((contactType === BLOCK || contactType === '') && status === STATUS_BLOCKED) {
    contactType = 'unblock';
  }
  const subtitle = contactType !== '' ?
    subtitleDescription[contactType] : '';

  return (
    <SlideModal
      isVisible={showConfirmationModal}
      onModalHide={onModalHide}
      title={titleConfirmation(contactType, username)}
      noClose
    >
      <Paragraph small light style={{ marginTop: 7, marginBottom: 22 }}>
        {subtitle}
      </Paragraph>
      <Button
        dangerInverted
        title={`Confirm ${contactType}`}
        onPress={() => { onConfirm(status); }}
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
