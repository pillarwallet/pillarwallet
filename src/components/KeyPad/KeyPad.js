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
import { Platform, TouchableNativeFeedback, Image as RNImage, Dimensions } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import { fontSizes } from 'utils/variables';
import { BaseText } from 'components/legacy/Typography';
import { KEYPAD_BUTTON_FORGOT } from 'constants/keyPadButtonsConstants';
import type { Theme } from 'models/Theme';
import { LIGHT_THEME } from 'constants/appSettingsConstants';
import { getThemeColors } from 'utils/themes';
import keyPadTypes from './keyPadTypes';

const { height } = Dimensions.get('window');

const KeyPadWrapper = styled.View`
  max-height: ${height * 0.4}px;
`;

const KeyInput = styled.View`
  justify-content: center;
  width: 30%;
  height: 25%;
`;

const KeyPadInner = styled.View`
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: center;
  align-items: stretch;
  height: 100%;
`;

const PinButton = styled.TouchableOpacity`
  align-self: center;
  width: 100%;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const ButtonText = styled(BaseText)`
  font-size: ${(props) => props.fontSize || fontSizes.large}px;
  align-self: center;
  line-height: 56px;
`;

const RippleSizer = styled.View`
  height: 55px;
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
  imageDarkTheme?: number,
};

type Props = {
  customButtons?: KeyPadButton[],
  type: string,
  options?: Object,
  onKeyPress: Function,
  style?: Object,
  inputColor?: string,
  theme: Theme,
  testIdTag?: string,
};

class KeyPad extends React.Component<Props> {
  static defaultProps = {
    type: 'numeric',
  };

  handleKeyPress = (pressedKey: any) => () => {
    this.props.onKeyPress(pressedKey);
  };

  renderButton = (btn: KeyPadButton) => {
    const { label, type, image, imageDarkTheme, value } = btn;
    const { theme } = this.props;
    const { current: currentTheme = LIGHT_THEME } = theme;
    const colors = getThemeColors(theme);
    if (type === IMAGE) {
      const img = currentTheme === LIGHT_THEME ? image : imageDarkTheme;
      return (
        <ImageHolder>
          <Image source={img} style={{ tintColor: colors.basic010 }} />
        </ImageHolder>
      );
    }

    let buttonFontSize = type === STRING ? fontSizes.large : null;
    if (value === KEYPAD_BUTTON_FORGOT) {
      buttonFontSize = fontSizes.big;
    }

    return <ButtonText fontSize={buttonFontSize}>{label}</ButtonText>;
  };

  renderKeys(buttons: any) {
    return buttons.map((btn: KeyPadButton) => {
      const { value, label } = btn;

      const TAG = this.props.testIdTag;

      if (!label && label !== 0) {
        return <KeyInput key={value} />;
      }

      if (Platform.OS === 'ios') {
        return (
          <KeyInput key={value}>
            <PinButton
              onPress={this.handleKeyPress(value)}
              testID={TAG && `${TAG}-button-keypad_${value}`}
              // eslint-disable-next-line i18next/no-literal-string
              accessibilityLabel={TAG && `${TAG}-button-keypad_${value}`}
            >
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
            testID={TAG && `$${TAG}-button-keypad_${value}`}
            // eslint-disable-next-line i18next/no-literal-string
            accessibilityLabel={TAG && `$${TAG}-button-keypad_${value}`}
          >
            <RippleSizer>{this.renderButton(btn)}</RippleSizer>
          </TouchableNativeFeedback>
        </KeyInput>
      );
    });
  }

  render() {
    const { style, type, customButtons, options } = this.props;
    const buttons = customButtons || (keyPadTypes[type] ? keyPadTypes[type](options) : keyPadTypes.numeric());

    return (
      <KeyPadWrapper style={style}>
        <KeyPadInner>{this.renderKeys(buttons)}</KeyPadInner>
      </KeyPadWrapper>
    );
  }
}

export default withTheme(KeyPad);
