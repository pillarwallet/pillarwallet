// @flow
import * as React from 'react';
import styled from 'styled-components/native/index';
import KeyPad from 'components/KeyPad';
import { Wrapper } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import { KEYPAD_BUTTON_DELETE, KEYPAD_BUTTON_FORGOT } from 'constants/keyPadButtonsConstants';
import PinDots from './PinDots';

const PASS_CODE_LENGTH = 6;

const PageWrapper = styled.View`
  flex: 1;
  justify-content: space-between;
`;

type Props = {
  onPinEntered: Function,
  onPinChanged?: Function,
  onForgotPin?: Function,
  pageInstructions?: string,
  showNewPincodeText?: boolean,
  showForgotButton?: boolean,
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

  handleForgotPin = () => {
    if (this.props.onForgotPin) {
      this.props.onForgotPin();
    }
  };

  render() {
    const { showForgotButton, showNewPincodeText } = this.props;
    const numActiveDots = this.state.passCode.length;

    return (
      <PageWrapper>
        <Wrapper regularPadding>
          <PinDots numAllDots={PASS_CODE_LENGTH} numActiveDots={numActiveDots} />
          {showNewPincodeText &&
            <Paragraph
              light
              center
            >
              Please create a pincode to secure access to your wallet and for signing of transactions.
            </Paragraph>
          }
        </Wrapper>
        <KeyPad type="pincode" options={{ showForgotButton }} onKeyPress={this.handleButtonPressed} />
      </PageWrapper>
    );
  }
}
