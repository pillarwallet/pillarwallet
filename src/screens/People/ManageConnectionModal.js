// @flow

import * as React from 'react';
import { MUTE, BLOCK, REMOVE } from 'constants/connectionsConstants';
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';

const subtitleDescription = {
  block: `You will no longer be able to find this user, chat, and make any transactions.
  Your chat history will be erased on your device. No notifications on this user's actions will be received.
  This user will not  be able to see any of your activity. You can unblock the user from your blocked list.`,
  remove: 'After disconnecting you no longer be able to chat and send assets. You can re-establish connection later.',
};

const titleConfirmation = (manageContactType, username) => {
  return `${manageContactType} ${username}?`;
};

type Props = {
  onModalHide: Function,
  onConfirm: Function,
  showManageContactModal: boolean,
  manageContactType: MUTE | BLOCK | REMOVE,
  contact: Object,
};

const ManageConnectionModal = (props: Props) => {
  const {
    onModalHide,
    onConfirm,
    showManageContactModal,
    manageContactType,
    contact,
  } = props;

  const { username } = contact;
  const subtitle = manageContactType ?
    subtitleDescription[manageContactType] : null;

  return (
    <SlideModal
      isVisible={showManageContactModal}
      onModalHide={() => onModalHide()}
      title={titleConfirmation(manageContactType, username)}
      subtitle={subtitle}
    >
      <Button
        title={`Confirm ${manageContactType}`}
        onPress={() => onConfirm()}
        style={{
          marginBottom: 20,
        }}
      />
      <Button
        danger
        title="Cancel"
        onPress={() => onModalHide()}
        style={{
          marginBottom: 20,
        }}
      />
    </SlideModal>
  );
};

export default ManageConnectionModal;
