// @flow
import * as React from 'react';
import { Platform, TouchableNativeFeedback, Image as RNImage } from 'react-native';
import styled from 'styled-components/native';
import { fontSizes, baseColors } from 'utils/variables';
import { KEYPAD_BUTTON_FORGOT } from 'constants/keyPadButtonsConstants';
import keyPadTypes from './keyPadTypes';

const KeyInput = styled.View`
  justify-content: center;
  align-items: center;
  width: 30%;
  height: 70;
`;

const Wrapper = styled.View`
  flex-wrap: wrap;
  flex-direction: row;
  align-self: flex-end;
  justify-content: center;
  align-items: center;
`;

const PinButton = styled.TouchableOpacity`
  align-self: center;
  height: 120px;
  width: 100%;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const ButtonText = styled.BaseText`
  color: ${baseColors.slateBlack};
  font-size: ${props => props.fontSize || fontSizes.extraLarge};
  align-self: center;
  line-height: 56;
`;

const RippleSizer = styled.View`
   height: 55;
   width: 100%;
   align-self: center;
`;

const ImageHolder = styled.View`
  width: 100%;
  height: 56px;
  align-self: center;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Image = styled(RNImage)`
  width: 32px;
  height: 25px;
  align-self: center;
`;


const IMAGE = 'image';
const STRING = 'string';

type KeyPadButton = {
  label: string,
  value: string,
  type?: string,
  image?: number,
};

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

  renderButton = (btn: KeyPadButton) => {
    const {
      label,
      type,
      image,
      value,
    } = btn;
    if (type === IMAGE) {
      return (
        <ImageHolder>
          <Image source={image} />
        </ImageHolder>
      );
    }

    let buttonFontSize = type === STRING ? fontSizes.mediumLarge : null;
    if (value === KEYPAD_BUTTON_FORGOT) {
      buttonFontSize = fontSizes.medium;
    }

    return (
      <ButtonText fontSize={buttonFontSize}>
        {label}
      </ButtonText>
    );
  };

  renderKeys(buttons: any) {
    return buttons.map((btn: KeyPadButton) => {
      const {
        value,
      } = btn;
      if (Platform.OS === 'ios') {
        return (
          <KeyInput key={value}>
            <PinButton onPress={this.handleKeyPress(value)}>
              {this.renderButton(btn)}
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
              {this.renderButton(btn)}
            </RippleSizer>
          </TouchableNativeFeedback>
        </KeyInput>
      );
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
