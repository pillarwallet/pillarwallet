import React, { FC } from 'react';
import styled from 'styled-components/native';

// Components
import Icon from 'components/core/Icon';

// Utils
import { spacing } from 'utils/variables';

interface IAddressBarButton {
  icon?: string | null;
  onPress?: () => void;
  color?: string | null;
}

const AddressBarButton: FC<IAddressBarButton> = ({ icon, onPress, color }) => {
  return (
    <Button onPress={onPress}>
      <Icon name={icon} color={color} />
    </Button>
  );
};

const Button = styled.TouchableOpacity`
  justify-content: center;
  padding-horizontal: ${spacing.medium}px;
`;

export default AddressBarButton;
