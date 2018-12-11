// @flow

import * as React from 'react';
import { baseColors, fontSizes } from 'utils/variables';
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
  backgroundColor: baseColors.lighterGray,
  borderColor: baseColors.mediumGray,
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

  const iconMarginRight = '8';
  const iconSize = 'small';

  const manageContactButtons = manageModalButtons.map((manageButton) => {
    const { manageType, ...manageButtonProps } = manageButton;
    return (
      <Button
        key={`modalButton-${manageType}`}
        iconSize={iconSize}
        iconMarginRight={iconMarginRight}
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
      titleStyles={{
        lineHeight: 21,
        letterSpacing: 0.1,
      }}
    >
      {manageContactButtons}
    </SlideModal>
  );
};

export default ManageConnectionModal;
