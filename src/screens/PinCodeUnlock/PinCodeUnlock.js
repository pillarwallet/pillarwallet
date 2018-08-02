// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { DECRYPTING, INVALID_PASSWORD } from 'constants/walletConstants';
import { FORGOT_PIN } from 'constants/navigationConstants';
import { loginAction } from 'actions/authActions';
import { Container, Center } from 'components/Layout';
import { BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';
import Title from 'components/Title';
import ErrorMessage from 'components/ErrorMessage';
import PinCode from 'components/PinCode';

type Props = {
  login: (pin: string) => Function,
  wallet: Object,
  navigation: NavigationScreenProp<*>,
}

type State = {
  pinError: string,
};

class PinCodeUnlock extends React.Component<Props, State> {
  state = {
    pinError: '',
  };

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    const { walletState } = nextProps.wallet;
    if (walletState === INVALID_PASSWORD) {
      return {
        ...prevState,
        pinError: 'Invalid pincode',
      };
    }
    return null;
  }

  handlePinSubmit = (pin: string) => {
    const { login } = this.props;
    login(pin);
  };

  handleForgotPasscode = () => {
    this.props.navigation.navigate(FORGOT_PIN);
  };

  render() {
    const { pinError } = this.state;

    const showError = pinError ? <ErrorMessage>{pinError}</ErrorMessage> : null;
    const { walletState } = this.props.wallet;

    if (walletState === DECRYPTING) {
      return (
        <Container center>
          <BaseText style={{ marginBottom: 20 }}>{walletState}</BaseText>
          <Spinner />
        </Container>
      );
    }

    return (
      <Container>
        {showError}
        <Center>
          <Title align="center" title="enter pincode" />
        </Center>
        <PinCode
          onPinEntered={this.handlePinSubmit}
          pageInstructions=""
          onForgotPin={this.handleForgotPasscode}
        />
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  login: (pin: string) => dispatch(loginAction(pin)),
});

export default connect(mapStateToProps, mapDispatchToProps)(PinCodeUnlock);
