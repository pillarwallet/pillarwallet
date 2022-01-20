import React, { FC } from 'react';
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';

// Components
import Icon from 'components/core/Icon';

// Utils
import { spacing } from 'utils/variables';

interface IBrowserFloatingButton {
  icon?: string | null;
  onPress?: () => void;
  disabled?: boolean;
}

const BrowserFloatingButton: FC<IBrowserFloatingButton> = ({ icon, onPress, disabled }) => {
  return (
    <FloatingButton onPress={onPress} disabled={disabled}>
      <Icon name={icon} />
    </FloatingButton>
  );
};

const FloatingButton = styled.TouchableOpacity`
  justify-content: center;
  align-items: center;
  padding: ${spacing.large}px;
  opacity: ${({ disabled }) => (disabled ? 0.05 : 1)};
`;

export default BrowserFloatingButton;
