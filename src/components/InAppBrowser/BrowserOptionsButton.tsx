import React, { FC } from 'react';
import styled from 'styled-components/native';

// Components
import Text from 'components/core/Text';

// Utils
import { spacing, borderRadiusSizes } from 'utils/variables';

interface IBrowserOptionsButton {
  title: string;
  onPress: () => void;
}

const BrowserOptionsButton: FC<IBrowserOptionsButton> = ({ title, onPress }) => {
  return (
    <Button onPress={onPress}>
      <Text style={{ width: '100%', textAlign: 'center' }}>{title}</Text>
    </Button>
  );
};

const Button = styled.TouchableOpacity`
  margin-bottom: ${spacing.medium}px;
  padding-horizontal: ${spacing.large}px;
  padding-vertical: ${spacing.medium}px;
  background-color: ${({ theme }) => theme.colors.basic060};
  border-radius: ${borderRadiusSizes.small}px;
`;

export default BrowserOptionsButton;
