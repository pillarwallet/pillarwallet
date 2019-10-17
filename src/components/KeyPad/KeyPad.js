// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as React from 'react';
import { Platform, TouchableNativeFeedback, Image as RNImage } from 'react-native';
import styled from 'styled-components/native';
import { fontSizes, baseColors } from 'utils/variables';
import { BaseText } from 'components/Typography';
import { Wrapper } from 'components/Layout';
import { KEYPAD_BUTTON_FORGOT } from 'constants/keyPadButtonsConstants';
import keyPadTypes from './keyPadTypes';

const KeyPadWrapper = styled(Wrapper)`
  margin-top: auto;
`;

const KeyInput = styled.View`
  justify-content: center;
  align-items: center;
  width: 30%;
  height: 70;
`;

const KeyPadInner = styled.View`
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-top: auto;
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

const ButtonText = styled(BaseText)`
  color: ${baseColors.slateBlack};
  font-size: ${props => props.fontSize || fontSizes.large}px;
  align-self: center;
  line-height: 56px;
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

    let buttonFontSize = type === STRING ? fontSizes.large : null;
    if (value === KEYPAD_BUTTON_FORGOT) {
      buttonFontSize = fontSizes.big;
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
        label,
      } = btn;

      if (!label && label !== 0) {
        return (
          <KeyInput key={value} />
        );
      }

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
      <KeyPadWrapper style={style}>
        <KeyPadInner>
          {this.renderKeys(buttons)}
        </KeyPadInner>
      </KeyPadWrapper>
    );
  }
}
