// @flow
import * as React from 'react';
import styled from 'styled-components/native/index';

import KeyPad from 'components/KeyPad';
import { KEYPAD_BUTTON_DELETE, KEYPAD_BUTTON_FORGOT } from 'constants/keyPadButtonsConstants';
import PinDots from './PinDots';

const PASS_CODE_LENGTH = 6;

const PinWrapper = styled.View`
  flex: 1;
  justify-content: space-between;
`;

type Props = {
  onPinEntered: Function,
  onPinChanged?: Function,
  pageInstructions?: string,
  showForgotButton?: boolean
};

type State = {
  passCode: string[],
};

export default class PinCode extends React.Component<Props, State> {
  static defaultProps = {
    pageHeading: 'Enter Passcode',
    pageInstructions: 'Setup your Passcode',
    showForgotButton: true,
  };

  state = {
    passCode: [],
  };

  getKeyPadButtons() {
    const keyInputs: Array<Object> = Array(9).fill('')
      .map((num, i) => {
        const key = `${i + 1}`;
        return this.keyPadButton(key, key);
      });

    if (this.props.showForgotButton) {
      keyInputs.push(this.keyPadButton(KEYPAD_BUTTON_FORGOT, 'Forgot?'));
    } else {
      keyInputs.push(this.keyPadButton('', ''));
    }

    keyInputs.push(
      this.keyPadButton('0', '0'),
      this.keyPadButton(KEYPAD_BUTTON_DELETE, '⌫'),
    );

    return keyInputs;
  }

  keyPadButton(value: string, label: string) {
    return {
      label,
      value,
    };
  }

  handleButtonPressed = (value: any) => {
    switch (value) {
      case KEYPAD_BUTTON_DELETE: return this.handleKeyPressDelete();
      case KEYPAD_BUTTON_FORGOT: return this.handleKeyPressForgot();
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

    if (passCode.length === PASS_CODE_LENGTH) {
      this.props.onPinEntered(passCodeString);
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

  handleKeyPressForgot = () => {
    console.log('Need to Reset Wallet'); // eslint-disable-line no-console
  };

  render() {
    const keyPadButtons = this.getKeyPadButtons();
    const numActiveDots = this.state.passCode.length;

    return (
      <PinWrapper>
        <PinDots numAllDots={PASS_CODE_LENGTH} numActiveDots={numActiveDots} />
        <KeyPad buttons={keyPadButtons} onKeyPress={this.handleButtonPressed} />
      </PinWrapper>
    );
  }
}
