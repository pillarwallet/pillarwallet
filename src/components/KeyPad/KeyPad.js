// @flow
import * as React from 'react';
import { Button, Platform, TouchableNativeFeedback } from 'react-native';
import styled from 'styled-components/native';
import keyPadTypes from './keyPadTypes';

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

const ButtonText = styled.Text`
  color: rgb(32,119,253);
  font-size: 18;
  align-self: center;
  line-height: 56;
`;

const RippleSizer = styled.View`
   height: 55;
   width: 55;
   align-self: center;
`;

type KeyPadButton = {
  label: string,
  value: string,
}

type Props = {
  customButtons?: KeyPadButton[],
  type: string,
  options?: Object,
  onKeyPress: Function,
  style?: StyleSheet.Styles,
  inputColor?: string
}

export default class KeyPad extends React.Component<Props> {
  static defaultProps = {
    type: 'numeric',
  };

  handleKeyPress = (pressedKey: any) => () => {
    this.props.onKeyPress(pressedKey);
  };

  renderKeys(buttons, inputColor) {
    return buttons.map(({ label, value }: KeyPadButton) => {
      if (value) {
        if (Platform.OS === 'ios') {
          return (
            <KeyInput key={value}>
              <Button color={inputColor} title={label} onPress={this.handleKeyPress(value)} />
            </KeyInput>
          );
        }
        return (
          <KeyInput key={value}>
            <TouchableNativeFeedback
              onPress={this.handleKeyPress(value)}
              background={TouchableNativeFeedback.SelectableBackgroundBorderless()}
            >
              <RippleSizer>
                <ButtonText>
                  {label}
                </ButtonText>
              </RippleSizer>
            </TouchableNativeFeedback>
          </KeyInput>
        );
      }
      return <KeyInput key={value} />;
    });
  }

  render() {
    const {
      style,
      inputColor,
      type,
      customButtons,
      options,
    } = this.props;
    const buttons = customButtons || (keyPadTypes[type] ? keyPadTypes[type](options) : keyPadTypes.numeric());

    return (
      <Wrapper style={style}>
        {this.renderKeys(buttons, inputColor)}
      </Wrapper>
    );
  }
}
