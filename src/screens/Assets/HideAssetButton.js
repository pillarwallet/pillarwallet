// @flow
import * as React from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import styled from 'styled-components/native';
import { BaseText } from 'components/Typography';
import Icon from 'components/Icon';
import { spacing, baseColors, fontSizes } from 'utils/variables';

type Props = {
  onPress: Function,
  expanded?: boolean,
  disabled?: boolean,
}

const HideButtonWrapper = styled.View`
  padding: ${Platform.select({
    ios: props => props.expanded ? `${spacing.rhythm / 2}px 6px` : `15px ${spacing.rhythm / 2}px`,
    android: props => props.expanded ? `${spacing.rhythm / 2}px 6px` : `0 ${spacing.rhythm / 2}px 20px`,
  })};
  justify-content: center;
  align-items: flex-start;
  flex: 1;
  margin-right: ${props => props.expanded ? spacing.rhythm : spacing.rhythm + 10}px;
`;

const HideButtonLabel = styled(BaseText)`
  color: ${baseColors.burningFire};
  font-size: ${props => props.expanded ? fontSizes.extraSmall : fontSizes.extraExtraSmall}px;
  margin-top: 8px;
  opacity: ${props => props.disabled ? 0.5 : 1}
`;

export const HideAssetButton = (props: Props) => {
  const { onPress, expanded, disabled } = props;
  return (
    <HideButtonWrapper expanded={expanded}>
      <TouchableOpacity
        disabled={disabled}
        onPress={onPress}
        style={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Icon
          name="turn-off"
          style={{
            color: baseColors.burningFire,
            fontSize: expanded ? fontSizes.medium : fontSizes.small,
            opacity: disabled ? 0.5 : 1,
          }}
        />
        <HideButtonLabel expanded={expanded} disabled={disabled}>
          Hide
        </HideButtonLabel>
      </TouchableOpacity>
    </HideButtonWrapper>
  );
};
