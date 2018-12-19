// @flow

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
