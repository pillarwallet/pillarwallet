// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { UIColors, baseColors, fontSizes } from 'utils/variables';
import { Button as NBButton } from 'native-base';
import { BoldText } from 'components/Typography';
import Icon from 'components/Icon';

type Props = {
  title: string,
  onPress: Function,
  disabled?: boolean,
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
    background: baseColors.burningFire,
    color: baseColors.white,
  },
  disabled: {
    background: baseColors.lightGray,
    color: baseColors.darkGray,
  },
};

const getTheme = (props: Props) => {
  if (props.disabled) {
    return themes.disabled;
  }
  if (props.secondary && props.danger) {
    return themes.secondaryDanger;
  } else if (props.danger) {
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

const getButtonPadding = (props: Props) => {
  if (props.noPadding) {
    return '0';
  } else if (props.small) {
    return '10px 20px';
  }
  return '10px 40px';
};

const ButtonWrapper = styled.TouchableOpacity`
  align-items: center;
  justify-content: center;
  padding: ${props => getButtonPadding(props)};
  background-color: ${props => props.theme.background};
  margin-top: ${props => props.marginTop || '0px'};
  margin-bottom: ${props => props.marginBottom || '0px'};
  margin-left: ${props => props.marginLeft || '0px'};
  margin-right: ${props => props.marginRight || '0px'};
  border-radius: 40;
  width: ${props => props.block ? '100%' : 'auto'};
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
    onPress,
    width,
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
      onPress={disabled ? null : onPress}
      width={width}
    >
      {!!icon && <ButtonIcon name={icon} theme={theme} />}
      <ButtonText
        theme={theme}
        small={props.small}
      >{props.title}
      </ButtonText>
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
