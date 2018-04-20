// @flow
import * as React from 'react';
import {
  Text,
  ActivityIndicator,
} from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';

import Container from 'components/Container';

type Props = {
  navigation: NavigationScreenProp<*>,
  wallet: Object,
};

const NewWallet = (props: Props) =>  {
  const { walletState } = props.wallet;
  return (
    <Container center>
      <Text style={{ marginBottom: 20 }}>{walletState || ''}</Text>
      <ActivityIndicator
        animating
        color="#111"
        size="large"
      />
    </Container>
  );
};

const mapStateToProps = ({ wallet }) => ({ wallet });
export default connect(mapStateToProps)(NewWallet);
