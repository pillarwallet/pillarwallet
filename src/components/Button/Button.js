// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { UIColors, baseColors, fontSizes, spacing } from 'utils/variables';
import { Button as NBButton } from 'native-base';
import { BoldText } from 'components/Typography';
import Icon from 'components/Icon';

type Props = {
  children?: React.Node,
  title: string,
  onPress: Function,
  disabled?: boolean,
  disabledTransparent?: boolean,
  secondary?: boolean,
  danger?: boolean,
  marginBottom?: string,
  marginTop?: string,
  marginLeft?: string,
  marginRight?: string,
  light?: boolean,
  width?: string,
  block?: boolean,
  noPadding?: boolean,
  flexRight?: boolean,
  small?: boolean,
  icon?: string,
};

const themes = {
  primary: {
    background: baseColors.electricBlue,
    color: '#ffffff',
  },
  secondary: {
    background: 'rgba(0,0,0,0)',
    color: baseColors.electricBlue,
  },
  secondaryDanger: {
    background: 'rgba(0,0,0,0)',
    color: baseColors.fireEngineRed,
  },
  danger: {
    background: baseColors.fireEngineRed,
    color: baseColors.white,
  },
  disabled: {
    background: baseColors.lightGray,
    color: baseColors.darkGray,
  },
  disabledTransparent: {
    background: baseColors.electricBlue,
    color: baseColors.white,
    opacity: 0.5,
  },
};

const getTheme = (props: Props) => {
  if (props.disabledTransparent) {
    return themes.disabledTransparent;
  }
  if (props.disabled) {
    return themes.disabled;
  }
  if (props.secondary && props.danger) {
    return themes.secondaryDanger;
  }
  if (props.danger) {
    return themes.danger;
  }
  if (props.secondary) {
    return themes.secondary;
  }
  return themes.primary;
};

const ButtonIcon = styled(Icon)`
  font-size: ${fontSizes.medium};
  margin-right: 5px;
  color: ${props => props.theme.color};
`;

const getButtonHeight = (props: Props) => {
  if (props.noPadding) {
    return '0';
  } else if (props.small) {
    return '34px';
  }
  return '52px';
};

const getButtonPadding = (props: Props) => {
  if (props.noPadding) {
    return '0';
  } else if (props.small) {
    return `${spacing.rhythm}px`;
  }
  return `${spacing.rhythm * 2.5}px`;
};
const ButtonWrapper = styled.TouchableOpacity`
  align-items: center;
  justify-content: center;
  padding: 0 ${props => getButtonPadding(props)};
  background-color: ${props => props.theme.background};
  opacity: ${props => props.theme.opacity ? props.theme.opacity : 1};
  margin-top: ${props => props.marginTop || '0px'};
  margin-bottom: ${props => props.marginBottom || '0px'};
  margin-left: ${props => props.marginLeft || '0px'};
  margin-right: ${props => props.marginRight || '0px'};
  border-radius: 40;
  width: ${props => props.block ? '100%' : 'auto'};
  height: ${props => getButtonHeight(props)};
  align-self: ${props => props.flexRight ? 'flex-end' : 'auto'} ;
  border-color: ${UIColors.defaultBorderColor};
  border-width: ${props => props.secondary ? '1px' : 0};
  border-style: solid;
  flex-direction: row;
`;

const ButtonText = styled(BoldText)`
  color: ${props => props.theme.color};
  font-size: ${props => props.small ? fontSizes.extraSmall : fontSizes.medium};
`;

const Button = (props: Props) => {
  const theme = getTheme(props);
  const {
    block,
    marginTop,
    marginBottom,
    icon,
    marginLeft,
    marginRight,
    noPadding,
    disabled,
    disabledTransparent,
    onPress,
    width,
    children,
  } = props;

  return (
    <ButtonWrapper
      {...props}
      theme={theme}
      block={block}
      marginTop={marginTop}
      marginBottom={marginBottom}
      marginLeft={marginLeft}
      marginRight={marginRight}
      noPadding={noPadding}
      onPress={(disabled || disabledTransparent) ? null : onPress}
      width={width}
      disabled={disabled || disabledTransparent}
    >
      {!!icon && <ButtonIcon name={icon} theme={theme} />}
      {!!props.title &&
      <ButtonText
        theme={theme}
        small={props.small}
      >{props.title}
      </ButtonText>}
      {children}
    </ButtonWrapper>
  );
};

export default Button;


type ButtonMiniProps = {
  onPress: Function,
  title: string,
};

const ButtonMiniWrapper = styled(NBButton)`
  padding: 10px 20px;
  background-color: ${baseColors.electricBlue};
  border-radius: 17;
  box-shadow: 0px .5px .5px ${baseColors.electricBlue};
  height: 34px;
  width: auto;
`;

const ButtonMiniText = styled(BoldText)`
  font-size: 14px;
  letter-spacing: 0.3;
  color: #fff;
`;

export const ButtonMini = (props: ButtonMiniProps) => (
  <ButtonMiniWrapper onPress={props.onPress}>
    <ButtonMiniText>{props.title}</ButtonMiniText>
  </ButtonMiniWrapper>
);
