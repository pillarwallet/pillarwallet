// @flow
import * as React from 'react';
import { Platform, TouchableNativeFeedback } from 'react-native';
import styled from 'styled-components/native';
import FastImage from 'react-native-fast-image';
import { fontSizes, baseColors } from 'utils/variables';
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

const ButtonText = styled.Text`
  color: ${baseColors.slateBlack};
  font-size: ${props => props.fontSize ? props.fontSize : fontSizes.extraLarge};
  align-self: center;
  line-height: 56;
`;

const RippleSizer = styled.View`
   height: 55;
   width: 55;
   align-self: center;
`;

const ImageHolder = styled.View`
  width: 32px;
  height: 25px;
`;

const Image = styled(FastImage)`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 15px;
  right: 3px;
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
    } = btn;
    if (type === IMAGE) {
      return (
        <ImageHolder>
          <Image source={image} />
        </ImageHolder>
      );
    }

    return (
      <ButtonText fontSize={type === STRING ? fontSizes.mediumLarge : null}>
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
