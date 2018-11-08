// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { ENCRYPTING, CREATED } from 'constants/walletConstants';
import { PROFILE } from 'constants/navigationConstants';
import { changePinAction, resetIncorrectPasswordAction } from 'actions/authActions';
import { Container } from 'components/Layout';
import { BaseText } from 'components/Typography';
import ErrorMessage from 'components/ErrorMessage';
import Spinner from 'components/Spinner';
import PinCode from 'components/PinCode';
import Button from 'components/Button';
import Header from 'components/Header';
import { validatePin } from 'utils/validators';

type Props = {
  changePin: (newPin: string, currentPin: string) => Function,
  walletState: ?string,
  navigation: NavigationScreenProp<*>,
  resetIncorrectPassword: () => Function,
};

type State = {
  pinError: string,
};

class ConfirmNewPin extends React.Component<Props, State> {
  state = {
    pinError: '',
  };

  handlePinSubmit = (enteredPin: string) => {
    const { navigation, changePin } = this.props;
    const currentPin = navigation.getParam('currentPin');
    const newPin = navigation.getParam('newPin');
    const validationError = validatePin(enteredPin, newPin);

    if (validationError) {
      this.setState({
        pinError: validationError,
      });
      return;
    }

    changePin(enteredPin, currentPin);
  };

  handlePinChange = () => {
    this.setState({
      pinError: '',
    });
  };

  handleScreenDismissal = () => {
    this.props.resetIncorrectPassword();
    this.props.navigation.dismiss();
  };

  render() {
    const { walletState } = this.props;
    const { pinError } = this.state;

    const showError = pinError ? <ErrorMessage>{pinError}</ErrorMessage> : null;

    if (walletState === ENCRYPTING) {
      return (
        <Container center>
          <BaseText style={{ marginBottom: 20 }}>{walletState}</BaseText>
          <Spinner />
        </Container>
      );
    }

    if (walletState === CREATED) {
      return (
        <Container center>
          <BaseText style={{ marginBottom: 20 }}>Pin changed!</BaseText>
          <Button title="Continue" onPress={() => this.props.navigation.navigate(PROFILE)} />
        </Container>
      );
    }

    return (
      <Container>
        <Header
          title="confirm new pincode"
          centerTitle
          onClose={this.handleScreenDismissal}
        />
        {showError}
        <PinCode
          onPinEntered={this.handlePinSubmit}
          onPinChanged={this.handlePinChange}
          pageInstructions=""
          showForgotButton={false}
          pinError={!!pinError}
        />
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet: { walletState } }) => ({ walletState });

const mapDispatchToProps = (dispatch: Function) => ({
  changePin: (newPin: string, currentPin: string) => {
    dispatch(changePinAction(newPin, currentPin));
  },
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmNewPin);
