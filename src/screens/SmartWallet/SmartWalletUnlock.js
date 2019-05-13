// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { UPGRADE_REVIEW, ASSETS } from 'constants/navigationConstants';
import { Container } from 'components/Layout';
import CheckPin from 'components/CheckPin';
import Header from 'components/Header';
import {
  initSmartWalletSdkAction,
  upgradeToSmartWalletAction,
} from 'actions/smartWalletActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';

type Props = {
  navigation: NavigationScreenProp<*>,
  resetIncorrectPassword: () => Function,
  initSmartWalletSdk: Function,
  upgradeToSmartWallet: Function,
}

type State = {
  isChecking: boolean,
};

class SmartWalletUnlock extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isChecking: false,
    };
  }

  handleUpgradeStep = (pin: string, wallet: Object) => {
    const {
      initSmartWalletSdk,
      upgradeToSmartWallet,
      navigation,
    } = this.props;
    this.setState({
      isChecking: true,
    }, async () => {
      await initSmartWalletSdk(wallet.privateKey);
      await upgradeToSmartWallet();
      // TODO: show any error or show success screen/modal?
      navigation.navigate(ASSETS, {});
    });
  };

  handleBack = () => {
    const { navigation, resetIncorrectPassword } = this.props;
    // navigation.goBack(null);
    navigation.navigate(UPGRADE_REVIEW, {});
    resetIncorrectPassword();
  };

  render() {
    const { isChecking } = this.state;
    return (
      <Container>
        <Header
          onBack={this.handleBack}
          title="enter pincode"
        />
        <CheckPin onPinValid={this.handleUpgradeStep} isChecking={isChecking} />
      </Container>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  initSmartWalletSdk: (walletPrivateKey: string) => dispatch(initSmartWalletSdkAction(walletPrivateKey)),
  upgradeToSmartWallet: () => dispatch(upgradeToSmartWalletAction()),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default connect(null, mapDispatchToProps)(SmartWalletUnlock);
