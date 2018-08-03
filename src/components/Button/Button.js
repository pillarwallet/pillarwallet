// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes } from 'utils/variables';
import { Button as NBButton, View } from 'native-base';
import { BoldText } from 'components/Typography';
import Icon from 'components/Icon';
import ButtonWrapper from './ButtonWrapper';
import ButtonText from './ButtonText';

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
  icon?: string,
};

const themes = {
  primary: {
    background: baseColors.electricBlue,
    underlay: '#80dfff',
    color: '#ffffff',
  },
  secondary: {
    background: 'rgba(0,0,0,0)',
    underlay: 'rgba(0,0,0,0)',
    color: baseColors.electricBlue,
  },
  danger: {
    background: baseColors.burningFire,
    underlay: '#ff7f20',
    color: baseColors.white,
  },
  disabled: {
    background: baseColors.lightGray,
    underlay: baseColors.mediumGray,
    color: baseColors.darkGray,
  },
};

const getTheme = (props: Props) => {
  if (props.disabled) {
    return themes.disabled;
  }
  if (props.secondary) {
    return themes.secondary;
  }
  if (props.danger) {
    return themes.danger;
  }
  return themes.primary;
};

const ButtonIcon = styled(Icon)`
  font-size: ${fontSizes.medium};
  margin-right: 5px;
  color: ${props => props.theme.color};
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
      underlayColor={theme.underlay}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {!!icon &&
        <ButtonIcon name={icon} theme={theme} />}
        <ButtonText
          theme={theme}
        >{props.title}
        </ButtonText>
      </View>
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
