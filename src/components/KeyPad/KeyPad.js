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
}

type Props = {
  buttons: KeyPadButton[],
  onKeyPress: Function,
}

export default class KeyPad extends React.Component<Props> {
  handleKeyPress = (pressedKey: any) => () => {
    this.props.onKeyPress(pressedKey);
  };

  render() {
    const { buttons } = this.props;
    return (
      <Wrapper>
        {buttons.map(({ label, value }: KeyPadButton) => (
          <KeyInput key={value}>
            <Button title={label} onPress={this.handleKeyPress(value)} />
          </KeyInput>
        ))}
      </Wrapper>
    );
  }
}

