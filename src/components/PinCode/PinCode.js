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
import { Animated, Easing } from 'react-native';
import styled from 'styled-components/native';
import KeyPad from 'components/KeyPad';
import { Wrapper } from 'components/Layout';
import { KEYPAD_BUTTON_DELETE, KEYPAD_BUTTON_FORGOT } from 'constants/keyPadButtonsConstants';
import PinDots from './PinDots';

const PASS_CODE_LENGTH = 6;


type Props = {
  onPinEntered: Function,
  onPinChanged?: Function,
  onForgotPin?: Function,
  pageInstructions?: string,
  showForgotButton?: boolean,
  pinError?: boolean,
  flex: boolean,
  customStyle?: Object,
};

type State = {
  passCode: string[],
  errorShake: Animated.Value,
};

const PinDotsWrapper = styled(Wrapper)`
  justify-content: center;
`;

const PinDotsWrapperAnimated = Animated.createAnimatedComponent(PinDotsWrapper);

export default class PinCode extends React.Component<Props, State> {
  resetPinCodeTimeout: any | TimeoutID;

  static defaultProps = {
    pageHeading: 'Enter Passcode',
    pageInstructions: 'Setup your Passcode',
    showForgotButton: true,
    flex: true,
  };

  state = {
    passCode: [],
    errorShake: new Animated.Value(0),
  };

  componentDidMount() {
    if (this.props.pinError) {
      Animated.timing(
        this.state.errorShake,
        {
          toValue: 1,
          duration: 500,
          easing: Easing.linear,
        },
      ).start();
    }
  }

  componentWillUnmount() {
    if (this.resetPinCodeTimeout) {
      clearTimeout(this.resetPinCodeTimeout);
    }
  }

  handleButtonPressed = (value: any) => {
    switch (value) {
      case KEYPAD_BUTTON_DELETE: return this.handleKeyPressDelete();
      case KEYPAD_BUTTON_FORGOT: return this.handleForgotPin();
      default: return this.handleKeyPress(value);
    }
  };

  handleKeyPress = (key: string) => {
    const { passCode } = this.state;

    if (passCode.length === PASS_CODE_LENGTH) {
      return;
    }

    this.setState({ passCode: [...passCode, key] }, this.onPassCodeChanged);
  };

  onPassCodeChanged = () => {
    const { passCode } = this.state;
    const passCodeString = passCode.join('');

    if (passCode.length > PASS_CODE_LENGTH) return;

    if (passCode.length === PASS_CODE_LENGTH) {
      this.props.onPinEntered(passCodeString);
      this.resetPinCodeTimeout = setTimeout(() => {
        this.setState({ passCode: [] });
      }, 500);
    } else if (this.props.onPinChanged) {
      this.props.onPinChanged(passCodeString);
    }
  };

  handleKeyPressDelete = () => {
    const { passCode } = this.state;
    const newPassCode = passCode.slice(0, -1);
    if (this.props.onPinChanged) {
      this.props.onPinChanged(newPassCode);
    }
    this.setState({ passCode: newPassCode });
  };

  handleForgotPin = () => {
    if (this.props.onForgotPin) {
      this.props.onForgotPin();
    }
  };

  render() {
    const { showForgotButton, flex, customStyle } = this.props;
    const numActiveDots = this.state.passCode.length;
    return (
      <React.Fragment>
        <PinDotsWrapperAnimated
          flex={flex ? 1 : null}
          style={[
            {
              transform: [{
                translateX: this.state.errorShake.interpolate({
                  inputRange: [0, 0.08, 0.25, 0.41, 0.58, 0.75, 0.92, 1],
                  outputRange: [0, -10, 10, -10, 10, -5, 5, 0],
                }),
              }],
            },
            customStyle,
          ]}
        >
          <PinDots numAllDots={PASS_CODE_LENGTH} numActiveDots={numActiveDots} />
        </PinDotsWrapperAnimated>
        <KeyPad
          type="pincode"
          options={{ showForgotButton }}
          onKeyPress={this.handleButtonPressed}
        />
      </React.Fragment>
    );
  }
}
