// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { Container } from 'components/Layout';
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
    return (
      <Container>
        {!!error && <ErrorMessage>{error}</ErrorMessage>}
        <Header title="create pincode" onBack={() => this.props.navigation.goBack(null)} index={1} />
        <PinCode
          onPinEntered={this.handlePinSubmit}
          onPinChanged={this.handlePinChange}
          pageInstructions="Setup your Pincode"
          showForgotButton={false}
        />
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
