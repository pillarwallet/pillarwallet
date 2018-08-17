// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import { DECRYPTING, INVALID_PASSWORD } from 'constants/walletConstants';
import { checkPinAction } from 'actions/authActions';
import { Container, Wrapper } from 'components/Layout';
import { BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';
import ErrorMessage from 'components/ErrorMessage';
import PinCode from 'components/PinCode';

type Props = {
  checkPin: (pin: string, onValidPin: Function, options: Object) => Function,
  wallet: Object,
  revealMnemonic: boolean,
  onPinValid: Function,
  title?: string,
}

const CheckPinWrapper = styled(Wrapper)`
  margin-top: auto;
  height: 100%;
  flex: 1;
`;

class CheckPin extends React.Component<Props, *> {
  handlePinSubmit = (pin: string) => {
    const { checkPin, onPinValid, revealMnemonic = false } = this.props;
    const options = {
      mnemonic: revealMnemonic,
    };
    checkPin(pin, onPinValid, options);
  };

  render() {
    const { wallet: { walletState } } = this.props;
    const pinError = walletState === INVALID_PASSWORD ? 'Invalid pincode' : null;
    const showError = pinError ? <ErrorMessage>{pinError}</ErrorMessage> : null;

    if (walletState === DECRYPTING) {
      return (
        <Container center>
          <BaseText style={{ marginBottom: 20 }}>Checking</BaseText>
          <Spinner />
        </Container>
      );
    }

    return (
      <CheckPinWrapper>
        {showError}
        <PinCode
          onPinEntered={this.handlePinSubmit}
          pageInstructions=""
          showForgotButton={false}
        />
      </CheckPinWrapper>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  checkPin: (pin: string, onValidPin: Function, options: Object) => {
    dispatch(checkPinAction(pin, onValidPin, options));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(CheckPin);
