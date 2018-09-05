// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import NewProfile from 'screens/NewProfile';
import { BaseText } from 'components/Typography';
import { registerOnBackendAction } from 'actions/onboardingActions';
import { Container } from 'components/Layout';
import Button from 'components/Button';
import Spinner from 'components/Spinner';
import { API_REGISTRATION_FAILED, USERNAME_EXISTS, USERNAME_OK, CHECKING_USERNAME } from 'constants/walletConstants';

type Props = {
  wallet: Object,
  registerOnBackend: () => Function,
};

const USERNAME_STATUS = [USERNAME_EXISTS, CHECKING_USERNAME, USERNAME_OK];

class RetryApiRegistration extends React.Component<Props> {
  componentDidMount() {
    const { registerOnBackend } = this.props;
    registerOnBackend();
  }

  render() {
    const { registerOnBackend, wallet: { walletState } } = this.props;
    if (USERNAME_STATUS.includes(walletState)) {
      return <NewProfile retry />;
    }
    return (
      <Container center>
        <BaseText style={{ marginBottom: 20 }}>Registering on backend</BaseText>
        {walletState !== API_REGISTRATION_FAILED && (
          <Spinner />
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
