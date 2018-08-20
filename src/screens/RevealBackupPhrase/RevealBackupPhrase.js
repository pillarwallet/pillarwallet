// @flow
import * as React from 'react';

import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { Container, Wrapper } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import MnemonicPhrase from 'components/MnemonicPhrase';
import CheckPin from 'components/CheckPin';
import Header from 'components/Header';

type Props = {
  checkPin: (pin: string, onValidPin: Function) => Function,
  wallet: Object,
  navigation: NavigationScreenProp<*>,
}

type State = {
  pinIsValid: boolean,
};

class RevealBackupPhrase extends React.Component<Props, State> {
  state = {
    pinIsValid: false,
  };

  handleScreenDismissal = () => {
    this.props.navigation.goBack(null);
  };

  render() {
    const { pinIsValid } = this.state;
    const { wallet } = this.props;

    if (!pinIsValid) {
      return (
        <Container>
          <Header title="enter pincode" centerTitle onClose={this.handleScreenDismissal} />
          <CheckPin revealMnemonic onPinValid={() => this.setState({ pinIsValid: true })} />
        </Container>
      );
    }

    return (
      <Container>
        <Header title="backup phrase" onClose={this.handleScreenDismissal} />
        <Wrapper regularPadding>
          <Paragraph>Please use this 12 word backup phrase in order to restore the wallet.</Paragraph>
          <Paragraph light>
            Keep it secure as it&#39;s the only way to recover your account in an emergency.
            Don&#39;t email or screenshot it.
          </Paragraph>
          <MnemonicPhrase phrase={wallet.mnemonic} />
        </Wrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet: { data: wallet } }) => ({ wallet });

export default connect(mapStateToProps)(RevealBackupPhrase);
