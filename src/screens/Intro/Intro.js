// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { checkIfWalletExistsAction } from 'actions/walletActions';
import { EMPTY } from 'constants/walletConstants';
import { BACKUP_PHRASE, LOGIN, IMPORT_WALLET } from 'constants/navigationConstants';
import Container from 'components/Container';
import Button from 'components/Button';
import IntroImage from 'components/IntroImage';
import MultiButtonWrapper from 'components/MultiButtonWrapper';

const introImage = require('assets/images/logo_pillar_intro.png');

type Props = {
  navigation: NavigationScreenProp<*>,
  checkIfWalletExists: () => Function,
  wallet: Object,
};

class Intro extends React.Component<Props> {
  componentWillMount() {
    const { checkIfWalletExists } = this.props;
    checkIfWalletExists();
  }

  createNewWallet = () => {
    this.props.navigation.navigate(BACKUP_PHRASE);
  };

  unlockExistingWallet = () => {
    this.props.navigation.navigate(LOGIN);
  };

  importOldWallet = () => {
    this.props.navigation.navigate(IMPORT_WALLET);
  };

  render() {
    const { wallet: { walletState } } = this.props;
    return (
      <Container center>
        <IntroImage source={introImage} />
        <MultiButtonWrapper>
          <Button
            title="Create new wallet"
            onPress={this.createNewWallet}
            marginBottom
          />
          <Button
            title="Unlock existing"
            onPress={this.unlockExistingWallet}
            disabled={walletState === EMPTY}
            marginBottom
          />
          <Button
            title="Import old wallet"
            onPress={this.importOldWallet}
            secondary
          />
        </MultiButtonWrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  checkIfWalletExists: () => dispatch(checkIfWalletExistsAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Intro);
