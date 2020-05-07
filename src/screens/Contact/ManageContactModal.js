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

// constants
import {
  DISCONNECT,
  BLOCK,
  MUTE,
  STATUS_BLOCKED,
  STATUS_MUTED,
} from 'constants/connectionsConstants';

// components
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';

import { fontSizes } from 'utils/variables';


type Props = {
  onModalHide: Function,
  onManageContact: Function,
  showManageContactModal: boolean,
  contactStatus?: ?string
};

const buttonStyle = {
  marginBottom: 12,
};

const manageModalButtons = [
  {
    manageType: MUTE,
    primaryInverted: true,
    title: 'Mute',
    leftIconName: 'mute',
    style: { ...buttonStyle, marginTop: 12 },
  },
  {
    manageType: DISCONNECT,
    primaryInverted: true,
    title: 'Disconnect',
    leftIconName: 'remove',
    style: { ...buttonStyle },
  },
  {
    manageType: BLOCK,
    dangerInverted: true,
    title: 'Report / Block',
    leftIconName: 'warning',
    style: { ...buttonStyle, marginBottom: 58 },
  },
];

const ManageConnectionModal = (props: Props) => {
  const {
    onModalHide,
    onManageContact,
    showManageContactModal,
    contactStatus,
  } = props;


  const manageContactButtons = manageModalButtons.map((manageButton) => {
    const { manageType, ...manageButtonProps } = manageButton;
    let title = manageButtonProps.title; // eslint-disable-line prefer-destructuring
    if (manageType === MUTE) {
      title = contactStatus === STATUS_MUTED ? 'Unmute' : 'Mute';
    } else if (manageType === BLOCK) {
      title = contactStatus === STATUS_BLOCKED ? 'Unblock' : 'Block';
    }
    return (
      <Button
        key={`modalButton-${manageType}`}
        leftIconStyle={{ fontSize: fontSizes.small }}
        onPress={() => onManageContact(manageType)}
        {...manageButtonProps}
        title={title}
      />
    );
  });

  return (
    <SlideModal
      isVisible={showManageContactModal}
      onModalHide={onModalHide}
      title="manage"
    >
      {manageContactButtons}
    </SlideModal>
  );
};

export default ManageConnectionModal;
