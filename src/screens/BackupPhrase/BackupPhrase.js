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
import { connect } from 'react-redux';
import type { NavigationScreenProp, NavigationEventSubscription } from 'react-navigation';

import { Paragraph } from 'components/Typography';
import Header from 'components/Header';
import { Container, ScrollWrapper, Footer } from 'components/Layout';
import MnemonicPhrase from 'components/MnemonicPhrase';
import Button from 'components/Button';
import CheckPin from 'components/CheckPin';

import { generateWalletMnemonicAction } from 'actions/walletActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';

import { BACKUP_PHRASE_VALIDATE } from 'constants/navigationConstants';

type Props = {
  wallet: Object,
  navigation: NavigationScreenProp<*>,
  generateWalletMnemonic: (mnemonicPhrase?: string) => Function,
  resetIncorrectPassword: Function,
};

type State = {
  pinIsValid: boolean,
  wallet: Object,
}

class BackupPhrase extends React.Component<Props, State> {
  _willFocus: NavigationEventSubscription;
  _isBackingupViaSettings: boolean;

  constructor(props) {
    super(props);
    const { generateWalletMnemonic, navigation, wallet } = this.props;
    this._isBackingupViaSettings = navigation.getParam('backupViaSettings', false);
    this._willFocus = navigation.addListener(
      'willFocus',
      () => {
        if (this._isBackingupViaSettings) {
          if (this.state.wallet.mnemonic) {
            generateWalletMnemonic(this.state.wallet.mnemonic);
          }
        } else {
          generateWalletMnemonic(wallet.onboarding.mnemonic.original);
        }
      },
    );
    this.state = {
      pinIsValid: !this._isBackingupViaSettings,
      wallet: this._isBackingupViaSettings ? {} : wallet,
    };
  }

  componentWillUnmount() {
    this._willFocus.remove();
  }

  handleScreenDismissal = () => {
    const { resetIncorrectPassword, navigation } = this.props;
    resetIncorrectPassword();
    navigation.goBack(null);
  };

  onPinValid = (wallet: Object) => {
    const { generateWalletMnemonic } = this.props;
    generateWalletMnemonic(wallet.mnemonic);
    this.setState({ pinIsValid: true, wallet });
  };

  render() {
    const { pinIsValid, wallet } = this.state;

    const { wallet: wlt, navigation } = this.props;
    const mnemonic = this._isBackingupViaSettings
      ? wallet.mnemonic
      : wlt.onboarding.mnemonic.original;

    if (!pinIsValid) {
      return (
        <Container>
          <Header title="enter pincode" centerTitle onClose={this.handleScreenDismissal} />
          <CheckPin revealMnemonic onPinValid={(pin, walletObj) => this.onPinValid(walletObj)} />
        </Container>
      );
    }

    if (!mnemonic) return null;
    return (
      <Container>
        <Header title="backup phrase" onBack={() => navigation.goBack(null)} />
        <ScrollWrapper regularPadding>
          <Paragraph>Write down your 12 word backup phrase in the correct order.</Paragraph>
          <MnemonicPhrase phrase={mnemonic} />
        </ScrollWrapper>
        <Footer>
          <Button
            onPress={() => navigation.navigate(BACKUP_PHRASE_VALIDATE,
              { backupViaSettings: this._isBackingupViaSettings })}
            title="Next"
          />
        </Footer>
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  generateWalletMnemonic: (mnemonicPhrase?: string) => {
    dispatch(generateWalletMnemonicAction(mnemonicPhrase));
  },
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(BackupPhrase);
