// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';

import { Container } from 'components/Layout';
import { BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';
import Button from 'components/Button';
import { REGISTRATION_FAILED, USERNAME_EXISTS } from 'constants/walletConstants';
import { APP_FLOW } from 'constants/navigationConstants';

const API_FAILURES = [USERNAME_EXISTS, REGISTRATION_FAILED];

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

  if (API_FAILURES.includes(walletState)) {
    statusMessage = 'REGISTRATION FAILED';
    showSpinner = false;
    note = <Button title="Try again" onPress={tryToReRegister} />;
  }

  return (
    <Container center>
      <BaseText style={{ marginBottom: 20 }}>{statusMessage}</BaseText>
      {!!showSpinner && (
        <Spinner />
      )}
      {note}
    </Container>
  );
};

const mapStateToProps = ({ wallet }) => ({ wallet });
export default connect(mapStateToProps)(NewWallet);
