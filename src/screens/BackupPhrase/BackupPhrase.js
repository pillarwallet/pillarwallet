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
import styled from 'styled-components/native';
import t from 'translations/translate';

import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import { Paragraph } from 'components/Typography';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper } from 'components/Layout';
import MnemonicPhrase from 'components/MnemonicPhrase';
import Button from 'components/Button';
import CheckAuth from 'components/CheckAuth';

import { generateWalletMnemonicAction } from 'actions/walletActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';

import { BACKUP_PHRASE_VALIDATE } from 'constants/navigationConstants';
import { spacing } from 'utils/variables';
import { themedColors } from 'utils/themes';


const FooterWrapper = styled.View`
  justify-content: center;
  align-items: center;
  padding: ${spacing.large}px;
  width: 100%;
  background-color: ${themedColors.surface};
`;

type Props = {
  wallet: Object,
  navigation: NavigationScreenProp<*>,
  generateWalletMnemonic: (mnemonicPhrase?: string) => void,
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
    generateWalletMnemonic(wallet.mnemonic.phrase);
    this.setState({ pinIsValid: true, wallet });
  };

  render() {
    const { pinIsValid, wallet: unlockedWallet } = this.state;

    const { wallet: onboardingWallet, navigation } = this.props;
    const mnemonic = this._isBackingupViaSettings
      ? unlockedWallet?.mnemonic?.phrase
      : onboardingWallet.onboarding.mnemonic.original;

    if (!pinIsValid) {
      return (
        <CheckAuth
          revealMnemonic
          enforcePin
          onPinValid={(pin, walletObj) => this.onPinValid(walletObj)}
          headerProps={{ onClose: this.handleScreenDismissal }}
        />
      );
    }

    if (!mnemonic) return null;
    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: t('title.backupPhrase') }] }}
        footer={(
          <FooterWrapper>
            <Button
              onPress={() => navigation.navigate(BACKUP_PHRASE_VALIDATE,
                { backupViaSettings: this._isBackingupViaSettings })}
              title={t('button.next')}
            />
          </FooterWrapper>
        )}
      >
        <ScrollWrapper regularPadding>
          <Paragraph style={{ marginTop: spacing.medium }}>
            {t('paragraph.instructionsOnBackingUpBackupPhase')}
          </Paragraph>
          <MnemonicPhrase phrase={mnemonic} />
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({ wallet }: RootReducerState): $Shape<Props> => ({ wallet });

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  generateWalletMnemonic: (mnemonicPhrase?: string) => {
    dispatch(generateWalletMnemonicAction(mnemonicPhrase));
  },
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(BackupPhrase);
