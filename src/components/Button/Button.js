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
  block?: boolean
};

const themes = {
  primary: {
    background: '#2077fd',
    underlay: '80dfff',
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

const Button = (props: Props) => {
  const setTheme = () => {
    if (props.disabled) {
      return themes.disabled;
    }
    if (props.secondary) {
      return themes.secondary;
    }
    return themes.primary;
  };

  return (
    <ButtonWrapper
      {...props}
      theme={setTheme()}
      block={props.block}
      marginTop={props.marginTop}
      marginBottom={props.marginBottom}
      onPress={props.onPress}
      width={props.width}
    >
      <ButtonText
        theme={setTheme()}
      >{props.title}
      </ButtonText>
    </ButtonWrapper>
  );
};

export default Button;
