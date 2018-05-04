// @flow
import * as React from 'react';

import { Text, ActivityIndicator } from 'react-native';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { DECRYPTING, DECRYPTED, INVALID_PASSWORD } from 'constants/walletConstants';
import { ONBOARDING_FLOW } from 'constants/navigationConstants';
import { decryptWalletAction } from 'actions/walletActions';
import { validatePin } from 'utils/validators';
import { Container, Center } from 'components/Layout';
import { Title } from 'components/Typography';
import ErrorMessage from 'components/ErrorMessage';
import PinCode from 'components/PinCode';

type Props = {
  decryptWallet: (pin: string) => Function,
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

  componentWillReceiveProps(nextProps: Props) {
    const { walletState } = nextProps.wallet;
    if (walletState === INVALID_PASSWORD) {
      this.setState({ pinError: 'Invalid password' });
    }
  }

  handlePinSubmit = (pin: string) => {
    const validationError = validatePin(pin);
    const { decryptWallet } = this.props;
    if (validationError) {
      this.setState({
        pinError: validationError,
      });
      return;
    }
    this.setState({
      pinError: validationError,
    });
    decryptWallet(pin);
  };

  handleForgotPasscode = () => {
    this.props.navigation.navigate(ONBOARDING_FLOW);
  }

  render() {
    const { pinError } = this.state;

    const showError = pinError ? <ErrorMessage>{pinError}</ErrorMessage> : null;
    const { walletState } = this.props.wallet;

    if (walletState === DECRYPTING) {
      return (
        <Container center>
          <Text style={{ marginBottom: 20 }}>{walletState}</Text>
          <ActivityIndicator
            animating
            color="#111"
            size="large"
          />
        </Container>
      );
    }

    if (walletState === DECRYPTED) return null;

    return (
      <Container>
        {showError}
        <Center>
          <Title>Enter Passcode</Title>
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
  decryptWallet: (pin: string) => {
    dispatch(decryptWalletAction(pin));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(PinCodeUnlock);
