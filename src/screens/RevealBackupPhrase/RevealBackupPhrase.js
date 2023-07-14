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
import { Image } from 'react-native';
import SafeAreaView from 'react-native-safe-area-view';
import Clipboard from '@react-native-community/clipboard';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import get from 'lodash.get';
import t from 'translations/translate';

// Actions
import { resetIncorrectPasswordAction } from 'actions/authActions';

// Components
import { Container } from 'components/layout/Layout';
import MnemonicPhrase from 'components/MnemonicPhrase';
import CheckAuth from 'components/CheckAuth';
import HeaderBlock from 'components/HeaderBlock';
import Button from 'components/core/Button';
import Toast from 'components/Toast';
import Text from 'components/core/Text';

// Utils
import { appFont, spacing, fontSizes } from 'utils/variables';

// Types
import type { Dispatch } from 'reducers/rootReducer';
import type { OnValidPinCallback } from 'models/Wallet';


type Props = {
  checkPin: (pin: string, onValidPin: ?OnValidPinCallback) => Function,
  navigation: NavigationScreenProp<*>,
  resetIncorrectPassword: () => void,
};

type State = {
  pinIsValid: boolean,
  wallet: Object,
};

// Assets
const walletBackupImage = require('assets/images/logo-wallet-backup.png');

class RevealBackupPhrase extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    const wallet = get(props, 'navigation.state.params.wallet', null);
    this.state = {
      pinIsValid: !!wallet,
      wallet: wallet || {},
    };
  }

  handleScreenDismissal = () => {
    this.props.resetIncorrectPassword();
    this.props.navigation.goBack(null);
  };

  handleCopyToClipboard = (copiedText: string, isPrivateKey?: boolean) => {
    Clipboard.setString(copiedText);
    Toast.show({
      message: isPrivateKey ? t('toast.privateKeyCopiedToClipboard') : t('toast.seedPhraseCopiedToClipboard'),
      emoji: 'ok_hand',
      autoClose: true,
    });
  };

  onPinValid = (wallet: Object) => {
    this.setState({ pinIsValid: true, wallet });
  };

  render() {
    const { pinIsValid, wallet } = this.state;
    const showPrivateKey = get(this.props, 'navigation.state.params.showPrivateKey', false);
    const mnemonicPhrase = wallet?.mnemonic;
    const privateKey = wallet?.privateKey;
    if (!pinIsValid) {
      return (
        <CheckAuth
          revealMnemonic
          onPinValid={(pin, walletObj) => this.onPinValid(walletObj)}
          headerProps={{ onClose: this.handleScreenDismissal }}
        />
      );
    }

    if (mnemonicPhrase && !showPrivateKey) {
      return (
        <Container>
          <HeaderBlock
            centerItems={[{ title: t('title.seedPhrase') }]}
            leftItems={[{ close: true }]}
            onClose={this.handleScreenDismissal}
            noPaddingTop
          />
          <NonScrollableContent>
            <Content style={{ flex: 1, justifyContent: 'center' }}>
              <Logo source={walletBackupImage} />
              <MnemonicPhrase phrase={mnemonicPhrase} />
            </Content>
          </NonScrollableContent>
        </Container>
      );
    }

    return (
      <Container>
        <HeaderBlock
          centerItems={[{ title: t('title.privateKey') }]}
          leftItems={[{ close: true }]}
          onClose={this.handleScreenDismissal}
          noPaddingTop
        />
        <NonScrollableContent>
          <Content>
            <Logo source={walletBackupImage} />
            <PrivateKeyWrapper>{privateKey}</PrivateKeyWrapper>
          </Content>
          <Button
            title={t('button.copyToClipboard')}
            style={styles.button}
            size="large"
            onPress={() => this.handleCopyToClipboard(privateKey, true)}
          />
        </NonScrollableContent>
      </Container>
    );
  }
}

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default connect(null, mapDispatchToProps)(RevealBackupPhrase);

const styles = {
  button: {
    marginBottom: spacing.large,
  },
};

const PrivateKeyWrapper = styled(Text)`
  padding: 10px;
  font-family: ${appFont.medium};
  font-size: ${fontSizes.large}px;
  color: ${({ theme }) => theme.colors.tertiaryText};
  text-align: center;
`;

const NonScrollableContent = styled(SafeAreaView)`
  flex: 1;
  padding: 0 ${spacing.large}px;
`;

const Logo = styled(Image)`
  align-self: center;
`;

const Content = styled.View`
  flex: 1;
  justify-content: center;
`;
