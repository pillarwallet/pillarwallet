// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { Container, Wrapper } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import PinCode from 'components/PinCode';
import ErrorMessage from 'components/ErrorMessage';
import Header from 'components/Header';
import { setPinForNewWalletAction } from 'actions/walletActions';
import { validatePin } from 'utils/validators';

type Props = {
  setPinForNewWallet: (pin: string) => Function,
  wallet: Object,
  navigation: NavigationScreenProp<*>,
};

type State = {
  error: string,
};

class SetWalletPinCode extends React.Component<Props, State> {
  state = {
    error: '',
  };

  handlePinSubmit = (pin: string) => {
    const validationError = validatePin(pin);
    if (validationError) {
      this.setState({
        error: validationError,
      });
      return;
    }

    this.props.setPinForNewWallet(pin);
  };

  handlePinChange = () => {
    this.setState({
      error: '',
    });
  };

  render() {
    const { error } = this.state;
    const { wallet } = this.props;
    const { onboarding } = wallet;
    const { apiUser } = onboarding;

    return (
      <Container>
        {!!error && <ErrorMessage>{error}</ErrorMessage>}
        <Header
          title={apiUser.username ? `hello, ${apiUser.username}` : 'hello'}
          onBack={() => this.props.navigation.goBack(null)}
        />
        <Wrapper regularPadding style={{ justifyContent: 'space-between', flex: 1 }}>
          <Paragraph light small style={{ marginBottom: 50, marginTop: 10 }}>
            Set your pin-code. It will be used to access the wallet and confirm transactions.
          </Paragraph>
          <PinCode
            onPinEntered={this.handlePinSubmit}
            onPinChanged={this.handlePinChange}
            pageInstructions="Setup your Pincode"
            showForgotButton={false}
            pinError={!!error}
            flex={false}
          />
        </Wrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  setPinForNewWallet: (pin) => {
    dispatch(setPinForNewWalletAction(pin));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SetWalletPinCode);
