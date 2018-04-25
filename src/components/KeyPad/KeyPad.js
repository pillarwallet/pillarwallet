// @flow
import * as React from 'react';
import { Button } from 'react-native';
import styled from 'styled-components/native';

const KeyInput = styled.View`
  justify-content: center;
  width: 120;
  height: 55;
`;

const Wrapper = styled.View`
  flex-wrap: wrap;
  flex-direction: row;
  align-self: center;
  width: 360;
  justify-content: flex-end;
`;

type KeyPadButton = {
  label: string,
  value: string,
  callback: () => void,
}

type Props = {
  buttons: KeyPadButton[]
}

const KeyPad = (props: Props) => {
  const { buttons } = props;

  return (
    <Wrapper>
      {buttons.map(({ label, value, callback }: KeyPadButton) => (
        <KeyInput key={value}>
          <Button title={label} onPress={callback} />
        </KeyInput>
      ))}
    </Wrapper>
  );
};

export default KeyPad;
