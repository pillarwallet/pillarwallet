// @flow
import * as React from 'react';

import { Text, ActivityIndicator } from 'react-native';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { DECRYPTING, INVALID_PASSWORD } from 'constants/walletConstants';
import { checkPinAction } from 'actions/authActions';
import { Container, Center, Wrapper } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import Title from 'components/Title';
import ErrorMessage from 'components/ErrorMessage';
import MnemonicPhrase from 'components/MnemonicPhrase';
import FullScreenModal from 'components/Modals/FullScreenModal';
import PinCode from 'components/PinCode';

type Props = {
  checkPin: (pin: string, onValidPin: Function) => Function,
  wallet: Object,
  navigation: NavigationScreenProp<*>,
}

type State = {
  pinError: string,
  pinIsValid: boolean,
};

class RevealBackupPhrase extends React.Component<Props, State> {
  state = {
    pinError: '',
    pinIsValid: false,
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
    const { checkPin } = this.props;
    checkPin(pin, () => this.setState({ pinIsValid: true }));
  };

  render() {
    const { pinError, pinIsValid } = this.state;
    const { navigation } = this.props;

    const showError = pinError ? <ErrorMessage>{pinError}</ErrorMessage> : null;
    const { walletState, data: walletData } = this.props.wallet;

    if (walletState === DECRYPTING) {
      return (
        <Container center>
          <Text style={{ marginBottom: 20 }}>Checking</Text>
          <ActivityIndicator
            animating
            color="#111"
            size="large"
          />
        </Container>
      );
    }

    if (!pinIsValid) {
      return (
        <FullScreenModal navigation={navigation}>
          <Wrapper style={{ marginTop: 40 }}>
            {showError}
            <Center>
              <Title center title="enter pincode" />
            </Center>
            <PinCode
              onPinEntered={this.handlePinSubmit}
              pageInstructions=""
              showForgotButton={false}
            />
          </Wrapper>
        </FullScreenModal>
      );
    }

    return (
      <FullScreenModal navigation={navigation}>
        <Wrapper style={{ marginTop: 40 }}>
          <Title title="backup phrase" />
          <Paragraph>Please use this 12 word backup phrase in order to restore the wallet.</Paragraph>
          <Paragraph light>
            Keep it secure as it&#39;s the only way to recover your account in an emergency.
            Don&#39;t email or screenshot it.
          </Paragraph>

          <MnemonicPhrase phrase={walletData.mnemonic} />
        </Wrapper>
      </FullScreenModal>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  checkPin: (pin: string, onValidPin: Function) => {
    dispatch(checkPinAction(pin, onValidPin));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(RevealBackupPhrase);
