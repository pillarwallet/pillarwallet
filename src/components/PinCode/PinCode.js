// @flow
import * as React from 'react';
import { Animated, Easing } from "react-native";
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
};

type State = {
  passCode: string[],
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
  };

  state = {
    passCode: [],
    errorShake: new Animated.Value(0),
  };

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

  componentWillUnmount() {
    if (this.resetPinCodeTimeout) {
      clearTimeout(this.resetPinCodeTimeout);
    }
  }

  render() {
    const { showForgotButton } = this.props;
    const numActiveDots = this.state.passCode.length;

    console.log(this.props);

    if (this.props.pinError) {
      Animated.sequence([
        Animated.timing(
          this.state.errorShake,
          {
            toValue: 1,
            duration: 500,
            easing: Easing.linear,
          },
        ),
      ]).start();
    }

    return (
      <React.Fragment>
        <PinDotsWrapperAnimated flex={1} style={{
            transform: [{
                translateX: this.state.errorShake.interpolate({
                    inputRange: [0, 0.08, 0.25, 0.41, 0.58, 0.75, 0.92, 1],
                    outputRange: [0, -10, 10, -10, 10, -5, 5, 0],
                }),
            }],
        }}>
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
