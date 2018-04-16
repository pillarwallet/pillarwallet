// @flow
import * as React from 'react';
import ButtonWrapper from './ButtonWrapper';
import ButtonText from './ButtonText';

type Props = {
  title: string,
  onPress: Function,
  disabled?: boolean,
  secondary?: boolean,
  marginBottom?: boolean
};


const ButtonTwo = (props: Props) => {
  const setBackgroundColor = () => {
    if (props.disabled === true) {
      return 'lightgray';
    } else if (props.secondary) {
      return 'rgba(0,0,0,0)';
    }
    return '#00bfff';
  };

  const setTextColor = () => {
    if (props.disabled === true) {
      return 'gray';
    } else if (props.secondary) {
      return '#00bfff';
    }
    return 'white';
  };

  const setUnderlayColor = () => {
    if (props.disabled === true) {
      return 'darkgray';
    } else if (props.secondary) {
      return '#e5f9ff';
    }
    return '#80dfff';
  };

  return (
    <ButtonWrapper
      backgroundColor={setBackgroundColor()}
      secondary={props.secondary}
      underlayColor={setUnderlayColor()}
      marginBottom={props.marginBottom}
      onPress={props.onPress}
    >
      <ButtonText color={setTextColor()} disabled={props.disabled}>{props.title}</ButtonText>
    </ButtonWrapper>
  );
};

export default ButtonTwo;
