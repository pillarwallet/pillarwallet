// @flow
import * as React from 'react';

import { Text, ActivityIndicator } from 'react-native';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { DECRYPTING, INVALID_PASSWORD } from 'constants/walletConstants';
import { checkPinAction } from 'actions/authActions';
import { Container, Center, Wrapper } from 'components/Layout';
import { CloseButton } from 'components/Button/CloseButton';
import Title from 'components/Title';
import ErrorMessage from 'components/ErrorMessage';
import PinCode from 'components/PinCode';
import { UIColors } from 'utils/variables';
import { CHANGE_PIN_NEW_PIN } from 'constants/navigationConstants';

type Props = {
  checkPin: (pin: string, onValidPin: Function) => Function,
  wallet: Object,
  navigation: NavigationScreenProp<*>,
}

type State = {
  pinError: string,
};

class CurrentPin extends React.Component<Props, State> {
  state = {
    pinError: '',
  };

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    const { walletState } = nextProps.wallet;
    if (walletState === INVALID_PASSWORD) {
      return {
        ...prevState,
        pinError: 'Invalid password',
      };
    }
    return null;
  }

  handlePinSubmit = (pin: string) => {
    const { checkPin, navigation } = this.props;
    checkPin(pin, () => navigation.navigate(CHANGE_PIN_NEW_PIN));
  };

  handleScreenDissmisal = () => {
    this.props.navigation.goBack(null);
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
      <Container>
        <CloseButton
          icon="md-close"
          onPress={this.handleScreenDissmisal}
          color={UIColors.primary}
          fontSize={32}
        />
        <Wrapper style={{ marginTop: 40 }}>
          {showError}
          <Center>
            <Title center title="enter current pincode" />
          </Center>
          <PinCode
            onPinEntered={this.handlePinSubmit}
            pageInstructions=""
            showForgotButton={false}
          />
        </Wrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  checkPin: (pin: string, onValidPin: Function) => {
    dispatch(checkPinAction(pin, onValidPin));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(CurrentPin);
