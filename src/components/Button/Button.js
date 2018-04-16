// @flow
import * as React from 'react';
import ButtonWrapper from './ButtonWrapper';
import ButtonText from './ButtonText';

type Props = {
  title: string,
  onPress: Function,
};

const ButtonTwo = (props: Props) => {
  return (
    <ButtonWrapper onPress={props.onPress}>
      <ButtonText>{props.title}</ButtonText>
    </ButtonWrapper>
  );
};

export default ButtonTwo;
