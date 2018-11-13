// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { Container, Wrapper } from 'components/Layout';
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
