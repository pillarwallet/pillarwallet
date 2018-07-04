// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { ActivityIndicator } from 'react-native';
import { CHECKING_USERNAME } from 'constants/walletConstants';

type Props = {
  walletState: ?string,
};

const NextButton = (props: Props) => {
  const { walletState } = props;
  if (walletState === CHECKING_USERNAME) {
    return <ActivityIndicator animating color="#111" />;
  }
  return <React.Fragment>Next</React.Fragment>;
};

const mapStateToProps = ({ wallet: { walletState } }) => ({ walletState });
export default connect(mapStateToProps)(NextButton);
