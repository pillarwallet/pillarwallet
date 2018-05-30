// @flow
import * as React from 'react';
import { Text } from 'react-native';
import { connect } from 'react-redux';

import { Container, Center } from 'components/Layout';
import Title from 'components/Title';
import PinCode from 'components/PinCode';

import { setPinForNewWalletAction } from 'actions/walletActions';
import { validatePin } from 'utils/validators';

type Props = {
  setPinForNewWallet: (pin: string) => Function,
  wallet: Object,
};

type State = {
  errorMessage: string,
};

class SetWalletPinCode extends React.Component<Props, State> {
  state = {
    errorMessage: '',
  };

  handlePinSubmit = (pin: string) => {
    const validationError = validatePin(pin);

    if (validationError) {
      this.setState({
        errorMessage: validationError,
      });
      return;
    }

    this.props.setPinForNewWallet(pin);
  };

  handlePinChange = () => {
    this.setState({
      errorMessage: '',
    });
  };

  render() {
    return (
      <Container>
        <Center>
          <Title center title="create pincode" />
        </Center>
        <PinCode
          onPinEntered={this.handlePinSubmit}
          onPinChanged={this.handlePinChange}
          pageInstructions="Setup your Pincode"
          showForgotButton={false}
          showNewPincodeText
        />
        {this.state.errorMessage && <Text>{this.state.errorMessage}</Text>}
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
