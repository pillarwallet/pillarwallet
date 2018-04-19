// @flow
import * as React from 'react';
import {
  Text,
  ActivityIndicator,
} from 'react-native';
import { NavigationActions } from 'react-navigation';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import ethers from 'ethers';

import Container from 'components/Container';
import Wrapper from 'components/Wrapper';
import Footer from 'components/Footer';
import Title from 'components/Title';
import PinCode from 'components/PinCode';
import Button from 'components/Button';

import { generateEncryptedWalletAction } from 'actions/walletActions';
import { ENCRYPTING, CREATED, GENERATING } from 'constants/walletConstants';
import { LOGIN } from 'constants/navigationConstants';
import { validatePin } from 'utils/validators';

type State = {
  mnemonic: string,
  pin: string,
  pinError: string
};

type Props = {
  navigation: NavigationScreenProp<*>,
  generateEncryptedWallet: (mnemonic: string, pin: string) => Function,
  wallet: Object,
};

class NewWallet extends React.Component<Props, State> {
  state = {
    mnemonic: '',
    pin: '',
    pinError: '',
  };

  handlePinSubmit = (pin: string) => {
    const validationError = validatePin(pin);
    const { generateEncryptedWallet } = this.props;

    if (validationError) {
      this.setState({
        pinError: validationError,
      });
      return;
    }

    const mnemonic = ethers.HDNode.entropyToMnemonic(ethers.utils.randomBytes(16));
    generateEncryptedWallet(mnemonic, pin);

    this.setState({
      pin,
      mnemonic,
    });
  };

  goToLoginPage = () => {
    const navigationAction = NavigationActions.navigate({
      routeName: LOGIN,
    });
    this.props.navigation.dispatch(navigationAction);
  };

  render() {
    const {
      mnemonic,
      pin,
      pinError,
    } = this.state;

    const { walletState, data: wallet } = this.props.wallet;

    if (walletState === CREATED) {
      return (
        <Container>
          <Wrapper padding>
            <Title>Wallet Created</Title>
            <Text style={{ marginBottom: 10 }}>Password: {pin}</Text>
            <Text style={{ marginBottom: 10 }}>Mnemonic: {mnemonic}</Text>
            <Text style={{ marginBottom: 10 }}>Public address: {wallet.address}</Text>
            <Text style={{ marginBottom: 10 }}>Private key: {wallet.privateKey}</Text>
          </Wrapper>
          <Footer>
            <Button
              onPress={this.goToLoginPage}
              title="Login"
            />
          </Footer>
        </Container>
      );
    }

    if (walletState === GENERATING || walletState === ENCRYPTING) {
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

    const showError = pinError ? <Text>{pinError}</Text> : null;

    return (
      <Container>
        <Title center>Enter Passcode</Title>
        <PinCode
          onPinEntered={this.handlePinSubmit}
          pageInstructions="Setup your Passcode"
          showForgotButton={false}
        />
        {showError}
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  generateEncryptedWallet: (mnemonic, pin) => {
    dispatch(generateEncryptedWalletAction(mnemonic, pin));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(NewWallet);
