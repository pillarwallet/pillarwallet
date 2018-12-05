// @flow

import * as React from 'react';
import { baseColors, fontSizes } from 'utils/variables';
import { DISCONNECT, BLOCK, MUTE } from 'constants/connectionsConstants';
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';

type Props = {
  onModalHide: Function,
  onManageContact: Function,
  showManageContactModal: boolean,
};

const ManageConnectionModal = (props: Props) => {
  const {
    onModalHide,
    onManageContact,
    showManageContactModal,
  } = props;

  const iconMarginRight = '8';
  const iconSize = 'small';

  return (
    <SlideModal
      isVisible={showManageContactModal}
      onModalHide={onModalHide}
      title="manage"
      dotColor={baseColors.warmPurple}
      titleStyles={{
        fontSize: fontSizes.small,
        lineHeight: 21,
        letterSpacing: 0.1,
      }}
    >
      <Button
        primaryInverted
        title="Mute"
        icon="mute"
        iconSize={iconSize}
        iconMarginRight={iconMarginRight}
        onPress={() => onManageContact(MUTE)}
        style={{
          marginBottom: 13,
          marginTop: 23,
          backgroundColor: baseColors.lighterGray,
          borderColor: baseColors.mediumGray,
        }}
      />
      <Button
        primaryInverted
        title="Disconnect"
        icon="remove"
        iconSize={iconSize}
        iconMarginRight={iconMarginRight}
        onPress={() => onManageContact(DISCONNECT)}
        style={{
          marginBottom: 13,
          backgroundColor: baseColors.lighterGray,
          borderColor: baseColors.mediumGray,
        }}
      />
      <Button
        dangerInverted
        title="Report / Block"
        icon="warning"
        iconSize={iconSize}
        iconMarginRight={iconMarginRight}
        onPress={() => onManageContact(BLOCK)}
        style={{
          marginBottom: 58,
          backgroundColor: baseColors.lighterGray,
          borderColor: baseColors.mediumGray,
        }}
      />
    </SlideModal>
  );
};

export default ManageConnectionModal;
