// @flow
import * as React from 'react';
import ButtonWrapper from './ButtonWrapper';
import ButtonText from './ButtonText';

type Props = {
  title: string,
  onPress: Function,
  disabled?: boolean,
  secondary?: boolean,
  marginBottom?: string,
  marginTop?: string,
  light?: boolean,
  width?: string,
  block?: boolean,
  noPadding?: boolean,
};

const themes = {
  primary: {
    background: '#2077fd',
    underlay: '#80dfff',
    color: '#ffffff',
  },
  secondary: {
    background: 'rgba(0,0,0,0)',
    underlay: 'rgba(0,0,0,0)',
    color: '#2077fd',
  },
  disabled: {
    background: '#d8d8d8',
    underlay: '#a9a9a9',
    color: '#808080',
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
