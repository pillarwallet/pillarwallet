// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors } from 'utils/variables';
import { Button as NBButton } from 'native-base';
import ButtonWrapper from './ButtonWrapper';
import ButtonText from './ButtonText';

type Props = {
  title: string,
  onPress: Function,
  disabled?: boolean,
  secondary?: boolean,
  marginBottom?: string,
  marginTop?: string,
  marginLeft?: string,
  marginRight?: string,
  light?: boolean,
  width?: string,
  block?: boolean,
  noPadding?: boolean,
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
  return themes.primary;
};

const Button = (props: Props) => {
  const theme = getTheme(props);

  return (
    <ButtonWrapper
      {...props}
      theme={theme}
      block={props.block}
      marginTop={props.marginTop}
      marginBottom={props.marginBottom}
      marginLeft={props.marginLeft}
      marginRight={props.marginRight}
      noPadding={props.noPadding}
      onPress={props.onPress}
      width={props.width}
      underlayColor={theme.underlay}
    >
      <ButtonText
        theme={theme}
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

const ButtonMiniText = styled.Text`
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.3;
  color: #fff;
`;

export const ButtonMini = (props: ButtonMiniProps) => (
  <ButtonMiniWrapper onPress={props.onPress}>
    <ButtonMiniText>{props.title}</ButtonMiniText>
  </ButtonMiniWrapper>
);
