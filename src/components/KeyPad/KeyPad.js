// @flow
import * as React from 'react';
import { Platform, TouchableNativeFeedback } from 'react-native';
import styled from 'styled-components/native';
import { UIColors, fontSizes } from 'utils/variables';
import keyPadTypes from './keyPadTypes';

const KeyInput = styled.View`
  justify-content: center;
  width: 30%;
  height: 70;
`;

const Wrapper = styled.View`
  flex-wrap: wrap;
  flex-direction: row;
  align-self: flex-end;
  justify-content: center;
`;

const PinButton = styled.TouchableOpacity`
  align-self: center;
  height: 120px;
  width: 100%;
  align-items: center;
`;

const PinButtonText = styled.Text`
  color: ${UIColors.defaultTextColor};
  font-size: ${fontSizes.extraLarge};
  line-height: 56;
`;

const ButtonText = styled.Text`
  color: ${UIColors.defaultTextColor};
  font-size: ${fontSizes.extraExtraLarge};
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
  style?: Object,
  inputColor?: string
}

export default class KeyPad extends React.Component<Props> {
  static defaultProps = {
    type: 'numeric',
  };

  handleKeyPress = (pressedKey: any) => () => {
    this.props.onKeyPress(pressedKey);
  };

  renderKeys(buttons: any) {
    return buttons.map(({ label, value }: KeyPadButton) => {
      if (value) {
        if (Platform.OS === 'ios') {
          return (
            <KeyInput key={value}>
              <PinButton onPress={this.handleKeyPress(value)}>
                <PinButtonText>{label}</PinButtonText>
              </PinButton>
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
      type,
      customButtons,
      options,
    } = this.props;
    const buttons = customButtons || (keyPadTypes[type] ? keyPadTypes[type](options) : keyPadTypes.numeric());

    return (
      <Wrapper style={style}>
        {this.renderKeys(buttons)}
      </Wrapper>
    );
  }
}
