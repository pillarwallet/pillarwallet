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
import { DISCONNECT } from 'constants/connectionsConstants';
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';


type Props = {
  onModalHide: Function,
  onManageContact: Function,
  showManageContactModal: boolean,
};

const buttonStyle = {
  marginBottom: 13,
};

const manageModalButtons = [
  /*
  {
    manageType: MUTE,
    primaryInverted: true,
    title: 'Mute',
    icon: 'mute',
    style: { ...buttonStyle, marginTop: 23 },
  },
  */
  {
    manageType: DISCONNECT,
    primaryInverted: true,
    title: 'Disconnect',
    icon: 'remove',
    style: { ...buttonStyle, marginTop: 23, marginBottom: 58 },
  },
  /*
  {
    manageType: BLOCK,
    dangerInverted: true,
    title: 'Report / Block',
    icon: 'warning',
    style: { ...buttonStyle, marginBottom: 58 },
  },
  */
];

const ManageConnectionModal = (props: Props) => {
  const {
    onModalHide,
    onManageContact,
    showManageContactModal,
  } = props;

  const iconSize = 'small';

  const manageContactButtons = manageModalButtons.map((manageButton) => {
    const { manageType, ...manageButtonProps } = manageButton;
    return (
      <Button
        key={`modalButton-${manageType}`}
        iconSize={iconSize}
        onPress={() => onManageContact(manageType)}
        {...manageButtonProps}
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
