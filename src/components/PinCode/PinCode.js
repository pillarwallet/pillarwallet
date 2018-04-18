// @flow
import * as React from 'react';
import { Button } from 'react-native';

import Wrapper from 'components/Wrapper';
import Footer from 'components/Footer';
import PinDots from './PinDots';
import PinDot from './PinDot';
import KeyPad from './KeyPad';
import KeyInput from './KeyInput';

const PASS_CODE_LENGTH = 6;

type PassCode = string[];

type Props = {
  onPinEntered: Function,
  pageInstructions?: string,
  showForgotButton?: boolean
};

type State = {
  passCode: PassCode,
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

  handleKeyPress = (key: string) => {
    if (this.state.passCode.length === PASS_CODE_LENGTH) {
      return;
    }

    this.setState({
      passCode: [...this.state.passCode, key],
    }, () => {
      if (this.state.passCode.length === PASS_CODE_LENGTH) {
        this.props.onPinEntered(this.state.passCode.join(''));
      }
    });
  };

  handleKeyPressDelete = () => {
    const { passCode } = this.state;
    this.setState({ passCode: passCode.slice(0, -1) });
  };

  handleKeyPressForgot = () => {
    console.log('Need to Reset Wallet'); // eslint-disable-line no-console
  };

  verifyPin = () => {
    const array = [];
    this.setState({ passCode: array });
  };

  createPinDot(i: number) {
    let isActive = false;
    if (this.state.passCode.length >= (i + 1)) {
      isActive = true;
    }
    return (
      <PinDot key={i} active={isActive} />
    );
  }

  createPinButton(key: string, title: string, callback: () => void) {
    return (
      <KeyInput key={key}>
        <Button title={title} onPress={callback} />
      </KeyInput>
    );
  }

  generatePinInputs() {
    const keyInputs = Array(9).fill('')
      .map((num, i) => {
        const key = `${i + 1}`;
        const title = key;
        const callback = () => this.handleKeyPress(key);
        return this.createPinButton(key, title, callback);
      });

    if (this.props.showForgotButton) {
      keyInputs.push(this.createPinButton('Forgot', 'Forgot?', () => this.handleKeyPressForgot()));
    } else {
      keyInputs.push(this.createPinButton('', '', () => {}));
    }

    keyInputs.push(
      this.createPinButton('0', '0', () => this.handleKeyPress('0')),
      this.createPinButton('⌫', '⌫', () => this.handleKeyPressDelete()),
    );

    return keyInputs;
  }

  render() {
    const pinCodeDots = Array(PASS_CODE_LENGTH).fill('')
      .map((num, i) => this.createPinDot(i));
    const keyInputs = this.generatePinInputs();

    return (
      <Wrapper>
        <PinDots>
          {pinCodeDots}
        </PinDots>
        <Footer>
          <KeyPad>
            {keyInputs}
          </KeyPad>
        </Footer>
      </Wrapper>
    );
  }
}
