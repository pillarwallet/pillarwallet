import React, { FC } from 'react';
import styled from 'styled-components/native';

// Components
import Icon, { IconName } from 'components/core/Icon';

// Utils
import { spacing } from 'utils/variables';

interface IAddressBarButton {
  icon?: IconName | null;
  onPress?: () => void;
  iconColor?: string | null;
  disabled?: boolean;
}

const AddressBarButton: FC<IAddressBarButton> = ({ icon, onPress, iconColor, disabled }) => {
  return (
    <Button onPress={onPress} disabled={disabled}>
      <Icon name={icon} color={iconColor} />
    </Button>
  );
};

const Button = styled.TouchableOpacity`
  justify-content: center;
  padding-horizontal: ${spacing.medium}px;
  opacity: ${({ disabled }) => (disabled ? 0.05 : 1)};
`;

export default AddressBarButton;
