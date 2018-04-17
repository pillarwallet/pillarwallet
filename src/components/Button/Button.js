// @flow
import * as React from 'react';
import ButtonWrapper from './ButtonWrapper';
import ButtonText from './ButtonText';

type Props = {
  title: string,
  onPress: Function,
  disabled?: boolean,
  secondary?: boolean,
  marginBottom?: boolean,
  light?: boolean,
  small?: boolean
};


const Button = (props: Props) => {
  const setBackgroundColor = () => {
    if (props.disabled === true) {
      return 'lightgray';
    } else if (props.secondary) {
      return 'rgba(0,0,0,0)';
    } else if (props.light) {
      return '#80dfff';
    }
    return '#00bfff';
  };

  const setTextColor = () => {
    if (props.disabled === true) {
      return 'gray';
    } else if (props.secondary) {
      return '#00bfff';
    } else if (props.light) {
      return '#000000';
    }
    return 'white';
  };

  const setUnderlayColor = () => {
    if (props.disabled === true) {
      return 'darkgray';
    } else if (props.secondary) {
      return '#e5f9ff';
    } else if (props.light) {
      return '#00bfff';
    }
    return '#80dfff';
  };

  const setMarginBottom = () => {
    if (props.small === true && props.marginBottom === true) {
      return '10px';
    } else if (props.marginBottom === true) {
      return '20px';
    }
    return '0';
  };

  return (
    <ButtonWrapper
      backgroundColor={setBackgroundColor()}
      secondary={props.secondary}
      small={props.small}
      underlayColor={setUnderlayColor()}
      marginBottom={setMarginBottom()}
      onPress={props.onPress}
    >
      <ButtonText color={setTextColor()} disabled={props.disabled}>{props.title}</ButtonText>
    </ButtonWrapper>
  );
};

export default Button;
