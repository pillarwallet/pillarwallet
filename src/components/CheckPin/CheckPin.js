// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import { DECRYPTING, INVALID_PASSWORD, EXISTING_PASSWORD } from 'constants/walletConstants';
import { checkPinAction } from 'actions/authActions';
import { Container, Wrapper } from 'components/Layout';
import { BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';
import ErrorMessage from 'components/ErrorMessage';
import PinCode from 'components/PinCode';

type Props = {
  checkPin: (pin: string, onValidPin: Function, options: Object, checkExisting: boolean) => Function,
  wallet: Object,
  revealMnemonic: boolean,
  onPinValid: Function,
  isChecking: boolean,
  title?: string,
  checkExisting: boolean,
}

const CheckPinWrapper = styled(Wrapper)`
  margin-top: auto;
  height: 100%;
  flex: 1;
`;

class CheckPin extends React.Component<Props, *> {
  static defaultProps = {
    revealMnemonic: false,
    checkExisting: false,
  };

  handlePinSubmit = (pin: string) => {
    const {
      checkPin,
      onPinValid,
      revealMnemonic,
      checkExisting,
    } = this.props;
    const options = {
      mnemonic: revealMnemonic,
    };
    checkPin(pin, onPinValid, options, checkExisting);
  };

  getPinError = (walletState: string) => {
    switch (walletState) {
      case INVALID_PASSWORD:
        return 'Invalid pincode';
      case EXISTING_PASSWORD:
        return 'Password must be different from the current one';
      default:
        return null;
    }
  };

  render() {
    const { wallet: { walletState }, isChecking } = this.props;
    const pinError = this.getPinError(walletState);
    const showError = pinError ? <ErrorMessage>{pinError}</ErrorMessage> : null;

    if (walletState === DECRYPTING || isChecking) {
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
          pinError={!!pinError}
        />
      </CheckPinWrapper>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  checkPin: (pin: string, onValidPin: Function, options: Object, checkExisting: boolean) => {
    dispatch(checkPinAction(pin, onValidPin, options, checkExisting));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(CheckPin);
