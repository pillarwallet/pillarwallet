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
  animateError: Animated.Value,
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
    animateError: new Animated.Value(4),
    moveRight: new Animated.Value(0),
    moveLeft: new Animated.Value(0),
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

  // animatePinDots = () => {
  //   Animated.spring(animateError, {
  //     toValue: 4,
  //     duration: 600,
  //   }).start();
  // };

  componentDidMount() {
    // this.animatePinDots();
    Animated.sequence([
      Animated.timing(
        this.state.moveRight,
        {
          toValue: 25,
          duration: 200,
          easing: Easing.linear,
        },
      ),
      Animated.timing(
        this.state.moveRight,
        {
          toValue: 0,
          duration: 100,
          easing: Easing.linear,
        },
      ),
      Animated.timing(
        this.state.moveLeft,
        {
          toValue: 25,
          duration: 100,
          easing: Easing.linear,
        },
      ),
      Animated.timing(
        this.state.moveLeft,
        {
          toValue: 0,
          duration: 100,
          easing: Easing.linear,
        },
      ),
      Animated.timing(
        this.state.moveRight,
        {
          toValue: 25,
          duration: 100,
          easing: Easing.linear,
        },
      ),
      Animated.timing(
        this.state.moveRight,
        {
          toValue: 0,
          duration: 100,
          easing: Easing.linear,
        },
      ),
      Animated.timing(
        this.state.moveLeft,
        {
          toValue: 25,
          duration: 100,
          easing: Easing.linear,
        },
      ),
      Animated.timing(
        this.state.moveLeft,
        {
          toValue: 0,
          duration: 100,
          easing: Easing.linear,
        },
      ),
    ]).start();
  }

  componentWillUnmount() {
    if (this.resetPinCodeTimeout) {
      clearTimeout(this.resetPinCodeTimeout);
    }
  }

  render() {
    const { showForgotButton } = this.props;
    const numActiveDots = this.state.passCode.length;
    const { moveRight, moveLeft } = this.state;

    console.log(moveRight);
    // console.log(this.props);
    // console.log(this.state);

    return (
      <React.Fragment>
        <PinDotsWrapperAnimated flex={1} style={{
            ...this.props.style,
            paddingLeft: moveRight,
            paddingRight: moveLeft,
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
