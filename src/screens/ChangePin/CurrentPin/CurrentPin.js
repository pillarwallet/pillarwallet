// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { Container } from 'components/Layout';
import Header from 'components/Header';
import CheckPin from 'components/CheckPin';
import { BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import { DECRYPTING } from 'constants/walletConstants';
import { CHANGE_PIN_NEW_PIN } from 'constants/navigationConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
  resetIncorrectPassword: () => Function,
  walletState: ?string,
};

class CurrentPin extends React.Component<Props> {
  handleScreenDismissal = () => {
    this.props.resetIncorrectPassword();
    this.props.navigation.dismiss();
  };

  render() {
    const { navigation, walletState } = this.props;

    if (walletState === DECRYPTING) {
      return (
        <Container center>
          <BaseText style={{ marginBottom: 20 }}>Checking</BaseText>
          <Spinner />
        </Container>
      );
    }

    return (
      <Container>
        <Header
          title="enter pincode"
          centerTitle
          onClose={this.handleScreenDismissal}
        />
        <CheckPin
          revealMnemonic
          onPinValid={(currentPin) => navigation.navigate(CHANGE_PIN_NEW_PIN, { currentPin })}
        />
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet: { walletState } }) => ({ walletState });

const mapDispatchToProps = (dispatch: Function) => ({
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(CurrentPin);
