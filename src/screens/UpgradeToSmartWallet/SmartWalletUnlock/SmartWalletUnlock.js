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
import { ASSETS } from 'constants/navigationConstants';
import CheckPin from 'components/CheckPin';
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
  transferTransactions: Object[],
  isChecking: boolean,
  successNavigateScreen?: ?string,
};

class SmartWalletUnlock extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const transferTransactions = this.props.navigation.getParam('transferTransactions', []);
    const successNavigateScreen = this.props.navigation.getParam('successNavigateScreen');
    this.state = {
      transferTransactions,
      successNavigateScreen,
      isChecking: false,
    };
  }

  handleUpgradeStep = (pin: string, wallet: Object) => {
    const {
      initSmartWalletSdk,
      upgradeToSmartWallet,
      navigation,
    } = this.props;
    const {
      transferTransactions = [],
      successNavigateScreen,
    } = this.state;
    this.setState({
      isChecking: true,
    }, async () => {
      await initSmartWalletSdk(wallet.privateKey);
      // perform upgrade step if transferTransactions is given
      if (transferTransactions.length) {
        const upgradeComplete = await upgradeToSmartWallet(wallet, transferTransactions).catch(() => null);
        if (!upgradeComplete) {
          navigation.goBack();
          return;
        }
      }
      navigation.navigate(successNavigateScreen || ASSETS, {});
    });
  };

  handleBack = () => {
    const { navigation, resetIncorrectPassword } = this.props;
    navigation.goBack(null);
    resetIncorrectPassword();
  };

  render() {
    const { isChecking } = this.state;
    return (
      <CheckPin
        onPinValid={this.handleUpgradeStep}
        isChecking={isChecking}
        headerProps={{ onBack: this.handleBack }}
      />
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  initSmartWalletSdk: (walletPrivateKey: string) => dispatch(initSmartWalletSdkAction(walletPrivateKey)),
  upgradeToSmartWallet: (wallet: Object, transferTransactions: Object[]) => dispatch(
    upgradeToSmartWalletAction(wallet, transferTransactions),
  ),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default connect(null, mapDispatchToProps)(SmartWalletUnlock);
