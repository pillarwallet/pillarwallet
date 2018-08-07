// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { ENCRYPTING, CREATED } from 'constants/walletConstants';
import { PROFILE } from 'constants/navigationConstants';
import { changePinAction } from 'actions/authActions';
import { Container, Center } from 'components/Layout';
import { BaseText } from 'components/Typography';
import Title from 'components/Title';
import ErrorMessage from 'components/ErrorMessage';
import Spinner from 'components/Spinner';
import PinCode from 'components/PinCode';
import Button from 'components/Button';
import Header from 'components/Header';
import { validatePin } from 'utils/validators';

type Props = {
  changePin: (pin: string) => Function,
  wallet: Object,
  navigation: NavigationScreenProp<*>,
}

type State = {
  pinError: string,
};

const mapStateToProps = ({ wallet }) => ({ wallet });

class ConfirmNewPin extends React.Component<Props, State> {
  state = {
    pinError: '',
  };

  handlePinSubmit = (pin: string) => {
    const { navigation, changePin } = this.props;
    const previousPin = navigation.getParam('pin');
    const validationError = validatePin(pin, previousPin);

    if (validationError) {
      this.setState({
        pinError: validationError,
      });
      return;
    }

    changePin(pin);
  };

  handlePinChange = () => {
    this.setState({
      pinError: '',
    });
  };

  handleScreenDismissal = () => {
    this.props.navigation.dismiss();
  };

  render() {
    const { pinError } = this.state;

    const showError = pinError ? <ErrorMessage>{pinError}</ErrorMessage> : null;
    const { walletState } = this.props.wallet;

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
        <Header onClose={this.handleScreenDismissal} />
        {showError}
        <Center>
          <Title align="center" title="confirm new pincode" />
        </Center>
        <PinCode
          onPinEntered={this.handlePinSubmit}
          onPinChanged={this.handlePinChange}
          pageInstructions=""
          showForgotButton={false}
        />
      </Container>
    );
  }
}

const mapDispatchToProps = (dispatch: Function) => ({
  changePin: (pin: string) => {
    dispatch(changePinAction(pin));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmNewPin);
