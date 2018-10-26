// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import Icon from 'components/Icon';
import { UIColors, baseColors, fontSizes } from 'utils/variables';
import { BaseText } from 'components/Typography';
import LinearGradient from 'react-native-linear-gradient';

type Props = {
  disabled?: boolean,
  onPress: Function,
  label: string,
  icon: string,
}

const CircleButtonIconWrapperColors = [baseColors.selago, baseColors.hawkesBlue];

const CircleButtonWrapper = styled.TouchableOpacity`
  justify-content: center;
  align-items: center;
  margin: 0 14px;
  padding: 6px;
`;

const CircleButtonIconWrapper = styled(LinearGradient)`
  border-radius: 32;
  width: 64px;
  height: 64px;
  background: ${props => props.disabled ? baseColors.lightGray : baseColors.white};
  justify-content: center;
  display: flex;
  flex-direction: row;
  align-items: center;
  box-shadow: 0 1px 1px ${UIColors.defaultShadowColor};
  elevation: ${props => props.disabled ? 0 : 6};
`;

const CircleButtonIcon = styled(Icon)`
  font-size: ${fontSizes.extraLarge};
  color: ${props => props.disabled ? baseColors.mediumGray : baseColors.clearBlue};
  justify-content: center;
  display: flex;
`;

const CircleButtonText = styled(BaseText)`
  color: ${props => props.disabled ? baseColors.mediumGray : baseColors.electricBlue};
  text-align: center;
  font-size: ${fontSizes.small};
  margin-top: 10px;
`;


const CircleButton = (props: Props) => {
  return (
    <CircleButtonWrapper
      disabled={props.disabled}
      onPress={() => props.onPress()}
    >
      <CircleButtonIconWrapper
        disabled={props.disabled}
        colors={CircleButtonIconWrapperColors}
      >
        <CircleButtonIcon
          disabled={props.disabled}
          name={props.icon}
        />
      </CircleButtonIconWrapper>
      <CircleButtonText
        disabled={props.disabled}
      >{props.label}
      </CircleButtonText
      >
    </CircleButtonWrapper>
  );
};

export default CircleButton;
