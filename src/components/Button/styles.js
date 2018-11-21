// @flow
import styled from 'styled-components/native';
import { Platform } from 'react-native';
import { Button as NBButton } from 'native-base';
import { BoldText } from 'components/Typography';
import Icon from 'components/Icon';
import { UIColors, baseColors, fontSizes, spacing, fontWeights } from 'utils/variables';

export const themes = {
  primary: {
    background: baseColors.electricBlue,
    color: '#ffffff',
    borderColor: UIColors.defaultBorderColor,
    borderWidth: 0,
    shadow: true,
  },
  primaryInverted: {
    background: baseColors.white,
    color: baseColors.electricBlue,
    borderColor: baseColors.veryLightBlue,
    borderWidth: '1px',
  },
  dangerInverted: {
    background: baseColors.white,
    color: baseColors.burningFire,
    borderColor: baseColors.dawnPink,
    borderWidth: '1px',
  },
  secondary: {
    background: baseColors.white,
    color: baseColors.electricBlue,
    borderColor: baseColors.electricBlue,
    borderWidth: '1px',
  },
  secondaryDanger: {
    background: baseColors.white,
    color: baseColors.fireEngineRed,
    borderColor: UIColors.defaultBorderColor,
    borderWidth: 0,
  },
  danger: {
    background: baseColors.fireEngineRed,
    color: baseColors.white,
    borderColor: UIColors.defaultBorderColor,
    borderWidth: 0,
  },
  dark: {
    background: baseColors.darkGray,
    color: baseColors.white,
    borderColor: UIColors.defaultBorderColor,
    borderWidth: 0,
  },
  disabled: {
    background: baseColors.lightGray,
    color: baseColors.darkGray,
    borderColor: UIColors.defaultBorderColor,
    borderWidth: 0,
  },
  disabledTransparent: {
    background: baseColors.electricBlue,
    color: baseColors.white,
    opacity: 0.5,
  },
};

export const ButtonIcon = styled(Icon)`
  font-size: ${fontSizes.medium};
  margin-right: 5px;
  color: ${props => props.theme.color};
`;

const getButtonHeight = (props) => {
  if (props.height) {
    return `${props.height}px`;
  } else if (props.noPadding) {
    return '0';
  } else if (props.small) {
    return '34px';
  }

  return '56px';
};

const getButtonWidth = (props) => {
  if (props.isSquare) {
    return getButtonHeight(props);
  } else if (props.block) {
    return '100%';
  }

  return 'auto';
};

const getButtonPadding = (props) => {
  if (props.noPadding) {
    return '0';
  } else if (props.small) {
    return `${spacing.rhythm}px`;
  } else if (props.block) {
    return `${spacing.rhythm}px`;
  }
  return `${spacing.rhythm * 2.5}px`;
};

const getButtonFontSize = (props) => {
  if (props.listItemButton) {
    return `${fontSizes.small}px`;
  } else if (props.small) {
    return `${fontSizes.extraSmall}px`;
  }
  return `${fontSizes.medium}px`;
};

export const ButtonWrapper = styled.TouchableOpacity`
  align-items: center;
  justify-content: center;
  padding: 0 ${props => getButtonPadding(props)};
  background-color: ${props => props.theme.background};
  opacity: ${props => props.theme.opacity ? props.theme.opacity : 1};
  margin-top: ${props => props.marginTop || '0px'};
  margin-bottom: ${props => props.marginBottom || '0px'};
  margin-left: ${props => props.marginLeft || '0px'};
  margin-right: ${props => props.marginRight || '0px'};
  border-radius: ${({ isSquare }) => isSquare ? 0 : 40};
  width: ${props => getButtonWidth(props)};
  height: ${props => getButtonHeight(props)};
  align-self: ${props => props.flexRight ? 'flex-end' : 'auto'} ;
  border-color: ${props => props.theme.borderColor};
  border-width:  ${props => props.theme.borderWidth};
  border-style: solid;
  flex-direction: ${({ alignTitleVertical }) =>
    alignTitleVertical ? 'column' : 'row'};
  ${props => props.theme.shadow ? 'box-shadow: 0px 2px 7px rgba(0,0,0,.12);' : ''}
  ${props => props.theme.shadow ? 'elevation: 1;' : ''}
`;

export const ButtonText = styled(BoldText)`
  color: ${props => props.theme.color};
  font-size: ${props => getButtonFontSize(props)};
  margin-bottom: 2px;
  ${props => props.listItemButton ? `font-weight: ${fontWeights.book};` : ''}
  ${props => props.listItemButton
    ? `font-family: ${Platform.OS === 'android' ? 'AktivGrotesk-Regular' : 'Aktiv Grotesk App'};`
    : ''}
`;

export const ButtonMiniWrapper = styled(NBButton)`
  padding: 10px 20px;
  background-color: ${baseColors.electricBlue};
  border-radius: 17;
  box-shadow: 0px .5px .5px ${baseColors.electricBlue};
  height: 34px;
  width: auto;
`;

export const ButtonMiniText = styled(BoldText)`
  font-size: 14px;
  letter-spacing: 0.3;
  color: #fff;
`;
