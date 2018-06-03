// @flow
import * as React from 'react';
import { connect } from 'react-redux';

import { Container, Center } from 'components/Layout';
import Title from 'components/Title';
import PinCode from 'components/PinCode';
import ErrorMessage from 'components/ErrorMessage';

import { setPinForNewWalletAction } from 'actions/walletActions';
import { validatePin } from 'utils/validators';

type Props = {
  setPinForNewWallet: (pin: string) => Function,
  wallet: Object,
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
        {error && <ErrorMessage>{error}</ErrorMessage>}
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
