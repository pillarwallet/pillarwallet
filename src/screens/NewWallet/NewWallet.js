// @flow
import * as React from 'react';
import {
  Text,
  ActivityIndicator,
} from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';

import { Container, Wrapper } from 'components/Layout';
import Button from 'components/Button';
import { API_REGISTRATION_FAILED } from 'constants/walletConstants';
import { ASSETS } from 'constants/navigationConstants';

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
    props.navigation.navigate(ASSETS);
  };

  if (walletState === API_REGISTRATION_FAILED) {
    statusMessage = 'REGISTRATION FAILED';
    showSpinner = false;
    note = (
      <Wrapper padding>
        <Button block title="Try again" onPress={tryToReRegister} />
      </Wrapper>
    );
  }

  return (
    <Container center>
      <Text style={{ marginBottom: 20 }}>{statusMessage}</Text>
      {showSpinner && (
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
