// @flow
import * as React from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import styled from 'styled-components/native';
import { BaseText } from 'components/Typography';
import Icon from 'components/Icon';
import { spacing, baseColors, fontSizes } from 'utils/variables';

type Props = {
  onPress: Function,
  expanded?: boolean
}

const HideButtonWrapper = styled.View`
  padding: ${Platform.select({
    ios: props => props.expanded ?
      `${spacing.rhythm / 2}px ${spacing.rhythm / 2}px ${spacing.rhythm / 2}px 0` :
      `15px ${spacing.rhythm}px 15px 0`,
    android: props => props.expanded ?
      `${spacing.rhythm / 2}px ${spacing.rhythm / 2}px ${spacing.rhythm / 2}px 0` :
      `3px ${spacing.rhythm}px 27px 0`,
  })};
  justify-content: center;
  align-items: center;
  flex: 1;
  margin-right: ${props => props.expanded ? spacing.rhythm : 14}px;
`;

const HideButtonLabel = styled(BaseText)`
  color: ${baseColors.burningFire};
  font-size: ${props => props.expanded ? fontSizes.extraSmall : fontSizes.extraExtraSmall}px;
  margin-top: ${props => props.expanded ? 8 : 4}px;
`;

export const HideAssetButton = (props: Props) => {
  const { onPress, expanded } = props;
  return (
    <HideButtonWrapper expanded={expanded}>
      <TouchableOpacity
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
          }}
        />
        <HideButtonLabel expanded={expanded}>
          Hide
        </HideButtonLabel>
      </TouchableOpacity>
    </HideButtonWrapper>
  );
};
