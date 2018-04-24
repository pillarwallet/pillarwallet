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
  small?: boolean,
};


const Button = (props: Props) => {
  const setBackgroundColor = () => {
    if (props.disabled === true) {
      return 'rgb(216, 216, 216)';
    } else if (props.secondary) {
      return 'rgba(0,0,0,0)';
    } else if (props.light) {
      return '#80dfff';
    }
    return 'rgb(32, 119, 253)';
  };

  const setTextColor = () => {
    if (props.disabled === true) {
      return 'gray';
    } else if (props.secondary) {
      return 'rgb(32, 119, 253)';
    } else if (props.light) {
      return '#000000';
    }
    return 'white';
  };

  const setUnderlayColor = () => {
    if (props.disabled === true) {
      return 'darkgray';
    } else if (props.secondary) {
      return 'rgba(0,0,0,0)';
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
      {...props}
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
