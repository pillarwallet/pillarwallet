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
import { Container, Wrapper, ScrollWrapper } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import MnemonicPhrase from 'components/MnemonicPhrase';
import CheckPin from 'components/CheckPin';
import Header from 'components/Header';
import { baseColors } from 'utils/variables';
import { resetIncorrectPasswordAction } from 'actions/authActions';


type Props = {
  checkPin: (pin: string, onValidPin: Function) => Function,
  navigation: NavigationScreenProp<*>,
  resetIncorrectPassword: () => Function,
};

type State = {
  pinIsValid: boolean,
  wallet: Object,
};

const PrivateKeyWrapper = styled(Paragraph)`
  padding: 10px;
  border-radius: 12px;
  border-width: 0.5;
  border-color: ${baseColors.mediumGray};
  border-style: solid;
`;

class RevealBackupPhrase extends React.Component<Props, State> {
  state = {
    pinIsValid: false,
    wallet: {},
  };

  handleScreenDismissal = () => {
    this.props.resetIncorrectPassword();
    this.props.navigation.goBack(null);
  };

  onPinValid = (wallet: Object) => {
    this.setState({ pinIsValid: true, wallet });
  };

  render() {
    const { pinIsValid, wallet } = this.state;

    if (!pinIsValid) {
      return (
        <Container>
          <Header title="enter pincode" centerTitle onClose={this.handleScreenDismissal} />
          <CheckPin revealMnemonic onPinValid={(pin, walletObj) => this.onPinValid(walletObj)} />
        </Container>
      );
    }

    if (wallet.mnemonic) {
      return (
        <Container>
          <Header title="backup phrase" onClose={this.handleScreenDismissal} />
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
        <Header title="backup phrase" onClose={this.handleScreenDismissal} />
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

const mapDispatchToProps = (dispatch: Function) => ({
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default connect(null, mapDispatchToProps)(RevealBackupPhrase);
