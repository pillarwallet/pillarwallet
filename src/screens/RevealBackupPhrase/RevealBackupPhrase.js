// @flow
import * as React from 'react';

import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { Wrapper } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import Title from 'components/Title';
import MnemonicPhrase from 'components/MnemonicPhrase';
import FullScreenModal from 'components/Modals/FullScreenModal';
import CheckPin from 'components/CheckPin';

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

  render() {
    const { pinIsValid } = this.state;
    const { navigation, wallet } = this.props;

    if (!pinIsValid) {
      return (
        <FullScreenModal navigation={navigation}>
          <Wrapper style={{ marginTop: 40 }}>
            <CheckPin onPinValid={() => this.setState({ pinIsValid: true })} />
          </Wrapper>
        </FullScreenModal>
      );
    }

    return (
      <FullScreenModal navigation={navigation}>
        <Wrapper style={{ marginTop: 40 }}>
          <Title title="backup phrase" />
          <Paragraph>Please use this 12 word backup phrase in order to restore the wallet.</Paragraph>
          <Paragraph light>
            Keep it secure as it&#39;s the only way to recover your account in an emergency.
            Don&#39;t email or screenshot it.
          </Paragraph>

          <MnemonicPhrase phrase={wallet.mnemonic} />
        </Wrapper>
      </FullScreenModal>
    );
  }
}

const mapStateToProps = ({ wallet: { data: wallet } }) => ({ wallet });

export default connect(mapStateToProps)(RevealBackupPhrase);
