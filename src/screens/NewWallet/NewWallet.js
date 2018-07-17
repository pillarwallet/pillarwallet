// @flow
import * as React from 'react';
import { Text, ActivityIndicator } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';

import { Container } from 'components/Layout';
import Button from 'components/Button';
import { API_REGISTRATION_FAILED } from 'constants/walletConstants';
import { APP_FLOW } from 'constants/navigationConstants';
// import Spinner from 'components/Spinner';

type Props = {
  navigation: NavigationScreenProp<*>,
  wallet: Object,
};

const NewWallet = (props: Props) => {
  const { walletState } = props.wallet;
  let statusMessage = walletState || '';
  let showSpinner = true;
  let note = null;

  const tryToReRegister = () => {
    props.navigation.navigate(APP_FLOW);
  };

  if (walletState === API_REGISTRATION_FAILED) {
    statusMessage = 'REGISTRATION FAILED';
    showSpinner = false;
    note = <Button title="Try again" onPress={tryToReRegister} />;
  }

  return (
    <Container center>
      <BaseText style={{ marginBottom: 20 }}>{statusMessage}</BaseText>
      {!!showSpinner && (
        <ActivityIndicator
          animating
          color="#111"
          size="large"
        />
      )}
      {note}
    </Container>
  );
};

const mapStateToProps = ({ wallet }) => ({ wallet });
export default connect(mapStateToProps)(NewWallet);
