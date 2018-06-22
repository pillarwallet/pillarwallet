// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { Text, ActivityIndicator } from 'react-native';

import { registerOnBackendAction } from 'actions/onboardingActions';
import { Container } from 'components/Layout';
import Button from 'components/Button';
import { API_REGISTRATION_FAILED } from 'constants/walletConstants';

type Props = {
  wallet: Object,
  registerOnBackend: () => Function,
};

class RetryApiRegistration extends React.Component<Props> {
  componentDidMount() {
    const { registerOnBackend } = this.props;
    registerOnBackend();
  }

  render() {
    const { registerOnBackend, wallet: { walletState } } = this.props;
    return (
      <Container center>
        <Text style={{ marginBottom: 20 }}>Registering on backend</Text>
        {walletState !== API_REGISTRATION_FAILED && (
          <ActivityIndicator
            animating
            color="#111"
            size="large"
          />
        )}
        {walletState === API_REGISTRATION_FAILED && (
          <Button title="Try again" onPress={registerOnBackend} />
        )}
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });
const mapDispatchToProps = (dispatch: Function) => ({
  registerOnBackend: () => {
    dispatch(registerOnBackendAction());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(RetryApiRegistration);
