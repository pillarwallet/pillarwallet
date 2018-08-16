// @flow
import * as React from 'react';
import KeyPad from 'components/KeyPad';
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

export default class PinCode extends React.Component<Props, State> {
  resetPinCodeTimeout: any | TimeoutID;

  static defaultProps = {
    pageHeading: 'Enter Passcode',
    pageInstructions: 'Setup your Passcode',
    showForgotButton: true,
  };

  state = {
    passCode: [],
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

    return (
      <React.Fragment>
        <PinDots numAllDots={PASS_CODE_LENGTH} numActiveDots={numActiveDots} />
        <KeyPad
          type="pincode"
          options={{ showForgotButton }}
          onKeyPress={this.handleButtonPressed}
        />
      </React.Fragment>
    );
  }
}
