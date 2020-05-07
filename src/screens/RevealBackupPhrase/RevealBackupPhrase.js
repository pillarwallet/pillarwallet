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
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import get from 'lodash.get';
import type { Dispatch } from 'reducers/rootReducer';
import { Container, Wrapper, ScrollWrapper } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import MnemonicPhrase from 'components/MnemonicPhrase';
import CheckAuth from 'components/CheckAuth';
import Header from 'components/Header';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import { themedColors } from 'utils/themes';


type Props = {
  checkPin: (pin: string, onValidPin: Function) => Function,
  navigation: NavigationScreenProp<*>,
  resetIncorrectPassword: () => void,
};

type State = {
  pinIsValid: boolean,
  wallet: Object,
};

const PrivateKeyWrapper = styled(Paragraph)`
  padding: 10px;
  border-radius: 12px;
  border-width: 0.5;
  border-color: ${themedColors.border};
  border-style: solid;
`;

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

  onPinValid = (wallet: Object) => {
    this.setState({ pinIsValid: true, wallet });
  };

  render() {
    const { pinIsValid, wallet } = this.state;
    const showPrivateKey = get(this.props, 'navigation.state.params.showPrivateKey', false);
    if (!pinIsValid) {
      return (
        <CheckAuth
          revealMnemonic
          onPinValid={(pin, walletObj) => this.onPinValid(walletObj)}
          headerProps={{ onClose: this.handleScreenDismissal }}
        />
      );
    }

    if (wallet.mnemonic && !showPrivateKey) {
      return (
        <Container>
          <Header title="Backup phrase" onClose={this.handleScreenDismissal} />
          <ScrollWrapper regularPadding>
            <Paragraph>Please use this 12 word backup phrase in order to restore the wallet.</Paragraph>
            <Paragraph light>
              Keep it secure as it&#39;s the only way to recover your account in an emergency.
              Don&#39;t email or screenshot it.
            </Paragraph>
            <MnemonicPhrase phrase={wallet.mnemonic} />
          </ScrollWrapper>
        </Container>
      );
    }

    return (
      <Container>
        <Header title="Private key" onClose={this.handleScreenDismissal} />
        <Wrapper regularPadding>
          <Paragraph>Please use this private key in order to restore the wallet.</Paragraph>
          <Paragraph light>
            Keep it secure as it&#39;s the only way to recover your account in an emergency.
            Don&#39;t email or screenshot it.
          </Paragraph>
          <PrivateKeyWrapper>
            {wallet.privateKey}
          </PrivateKeyWrapper>
        </Wrapper>
      </Container>
    );
  }
}

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default connect(null, mapDispatchToProps)(RevealBackupPhrase);
