// @flow

import * as React from 'react';
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';

const subtitleDescription = {
  block: `You will no longer be able to find this user, chat, and make any transactions.
  Your chat history will be erased on your device. No notifications on this user's actions will be received.
  This user will not  be able to see any of your activity. You can unblock the user from your blocked list.`,
  remove: 'After disconnecting you no longer be able to chat and send assets. You can re-establish connection later.',
};

const titleConfirmation = (manageContactType: string, username: string) => {
  const contactType = manageContactType;
  const usernameToConfirm = username;
  return `${contactType} ${usernameToConfirm}?`;
};

type Props = {
  onModalHide: Function,
  onConfirm: Function,
  showManageContactModal: boolean,
  manageContactType: string,
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

  const contactType = manageContactType;
  const { username } = contact;
  const subtitle = contactType !== '' ?
    subtitleDescription[contactType] : '';

  return (
    <SlideModal
      isVisible={showManageContactModal}
      onModalHide={() => onModalHide()}
      title={titleConfirmation(contactType, username)}
      subtitle={subtitle}
    >
      <Button
        title={`Confirm ${contactType}`}
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
