// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { Paragraph } from 'components/Typography';
import HeaderLink from 'components/HeaderLink';
import Title from 'components/Title';
import { Container, Wrapper } from 'components/Layout';
import MnemonicPhrase from 'components/MnemonicPhrase';

import { generateWalletMnemonicAction } from 'actions/walletActions';
import { BACKUP_PHRASE_VALIDATE } from 'constants/navigationConstants';

type Props = {
  wallet: Object,
  navigation: NavigationScreenProp<*>,
  generateWalletMnemonic: () => Function,
};

class BackupPhrase extends React.Component<Props, {}> {
  static navigationOptions = ({ navigation }) => ({
    headerRight: (
      <HeaderLink
        onPress={() => navigation.navigate(BACKUP_PHRASE_VALIDATE)}
      >
       Next
      </HeaderLink>
    ),
  });

  componentDidMount() {
    this.props.generateWalletMnemonic();
  }

  render() {
    const { onboarding: wallet } = this.props.wallet;
    if (!wallet.mnemonic) return null;

    return (
      <Container>
        <Wrapper regularPadding>
          <Title title="backup phrase" />
          <Paragraph>Write down all 12 words in the order shown.</Paragraph>
          <Paragraph light>
            Don’t take a screenshot; write them down carefully, make a few copies, and put them in different places.
          </Paragraph>
          <MnemonicPhrase phrase={wallet.mnemonic.original} />
        </Wrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  generateWalletMnemonic: () => {
    dispatch(generateWalletMnemonicAction());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(BackupPhrase);
