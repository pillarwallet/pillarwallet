// @flow
import * as React from 'react';
import { Platform } from 'react-native';
import styled from 'styled-components/native';
import Icon from 'components/Icon';
import { UIColors, baseColors, fontSizes, fontTrackings } from 'utils/variables';
import { BaseText } from 'components/Typography';
import { Shadow } from 'components/Shadow';
import LinearGradient from 'react-native-linear-gradient';

type Props = {
  disabled?: boolean,
  onPress: Function,
  label: string,
  icon: string,
}

const CircleButtonIconWrapperColors = ['#ffffff', '#f2f4f9'];

const CircleButtonWrapper = styled.TouchableOpacity`
  justify-content: center;
  align-items: center;
  padding: 8px;
  margin: ${Platform.select({
    ios: '0 14px',
    android: '0 6px',
  })}
`;

const CircleButtonIconWrapper = styled(LinearGradient)`
  border-radius: 31;
  width: 64px;
  height: 64px;
  background: ${props => props.disabled ? baseColors.lightGray : baseColors.white};
  justify-content: center;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const InnerWrapper = styled.View`
  border-radius: 33;
  width: 66px;
  height: 66px;
  border: 1px solid ${UIColors.actionButtonBorderColor};
  shadow-color: rgba(0, 122, 255, 0.03);
  shadow-offset: 0px -1px;
  shadow-opacity: 1;
  shadow-radius: 2px;
  background-color: ${UIColors.actionButtonBorderColor};
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
  letter-spacing: ${fontTrackings.tiny}px;
  margin-top: ${Platform.select({
    ios: '10px',
    android: '-2px',
  })}
`;


const CircleButton = (props: Props) => {
  return (
    <CircleButtonWrapper
      disabled={props.disabled}
      onPress={() => props.onPress()}
    >
      <Shadow
        shadowOffsetY={5}
        shadowDistance={12}
        shadowRadius={5}
        shadowSpread={20}
        shadowColorAndroid="#14123F6F"
        shadowColoriOS={UIColors.actionButtonShadowColor}
        heightAndroid={66}
        widthAndroid={66}
      >
        <InnerWrapper>
          <CircleButtonIconWrapper
            disabled={props.disabled}
            colors={CircleButtonIconWrapperColors}
          >
            <CircleButtonIcon
              disabled={props.disabled}
              name={props.icon}
            />
          </CircleButtonIconWrapper>
        </InnerWrapper>
      </Shadow>
      <CircleButtonText disabled={props.disabled}>
        {props.label}
      </CircleButtonText>
    </CircleButtonWrapper>
  );
};

export default CircleButton;
