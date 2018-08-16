// @flow
import * as React from 'react';

import { connect } from 'react-redux';
import { DECRYPTING, INVALID_PASSWORD } from 'constants/walletConstants';
import { checkPinAction } from 'actions/authActions';
import { Container, Wrapper } from 'components/Layout';
import { BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';
import Header from 'components/Header';
import ErrorMessage from 'components/ErrorMessage';
import PinCode from 'components/PinCode';

type Props = {
  checkPin: (pin: string, onValidPin: Function) => Function,
  wallet: Object,
  onPinValid: Function,
  title?: string,
}

class CheckPin extends React.Component<Props, *> {
  handlePinSubmit = (pin: string) => {
    const { checkPin, onPinValid } = this.props;
    checkPin(pin, () => onPinValid());
  };

  render() {
    const { title, wallet: { walletState } } = this.props;
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
      <Wrapper>
        <Header title="enter pincode" />
        {showError}
        <PinCode
          onPinEntered={this.handlePinSubmit}
          pageInstructions=""
          showForgotButton={false}
        />
      </Wrapper>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  checkPin: (pin: string, onValidPin: Function) => {
    dispatch(checkPinAction(pin, onValidPin));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(CheckPin);
