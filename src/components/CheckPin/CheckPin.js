// @flow
import * as React from 'react';

import { Text, ActivityIndicator } from 'react-native';
import { connect } from 'react-redux';
import { DECRYPTING, INVALID_PASSWORD } from 'constants/walletConstants';
import { checkPinAction } from 'actions/authActions';
import { Container, Center, Wrapper } from 'components/Layout';
import Title from 'components/Title';
import ErrorMessage from 'components/ErrorMessage';
import PinCode from 'components/PinCode';

type Props = {
  checkPin: (pin: string, onValidPin: Function) => Function,
  wallet: Object,
  onPinValid: Function,
}

type State = {
  pinError: string,
};

class CheckPin extends React.Component<Props, State> {
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
    const { checkPin, onPinValid } = this.props;
    checkPin(pin, () => onPinValid());
  };

  render() {
    const { pinError } = this.state;

    const showError = pinError ? <ErrorMessage>{pinError}</ErrorMessage> : null;
    const { walletState } = this.props.wallet;

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

    return (
      <Wrapper>
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
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  checkPin: (pin: string, onValidPin: Function) => {
    dispatch(checkPinAction(pin, onValidPin));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(CheckPin);
