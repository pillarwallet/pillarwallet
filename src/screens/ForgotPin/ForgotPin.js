// @flow
import * as React from 'react';

import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { Container, Wrapper, Footer } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import Header from 'components/Header';
import Button from 'components/Button';
import styled from 'styled-components/native/index';
import { spacing } from 'utils/variables';
import { IMPORT_WALLET, FORGOT_PIN } from 'constants/navigationConstants';

type Props = {
  checkPin: (pin: string, onValidPin: Function) => Function,
  wallet: Object,
  navigation: NavigationScreenProp<*>,
}

export const FooterParagraph = styled(Paragraph)`
  margin-bottom: ${spacing.rhythm}px;
`;

class ForgotPin extends React.Component<Props, {}> {
  goBackToPin = () => {
    this.props.navigation.goBack(null);
  };

  toImportWallet = () => {
    this.props.navigation.navigate(IMPORT_WALLET, { navigateTo: FORGOT_PIN });
  };

  render() {
    return (
      <Container>
        <Header centerTitle title="forgot pin" onClose={this.goBackToPin} />
        <Wrapper regularPadding>
          <Paragraph>You can restore access to your wallet by re-importing
                it using 12-word backup phrase private key
                generated for you during the wallet creation.
          </Paragraph>
          <Paragraph light>
                Please have the private key ready and re-import your wallet.
          </Paragraph>
        </Wrapper>
        <Footer>
          <FooterParagraph>
                It is impossible to restore your wallet without the backup, be careful.
          </FooterParagraph>
          <Button
            icon="down-arrow"
            block
            danger
            marginBottom={`${spacing.rhythm}px`}
            onPress={this.toImportWallet}
            title="Import wallet"
          />
          <Button block onPress={this.goBackToPin} secondary title="Try entering PIN again" />
        </Footer>
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet: { data: wallet } }) => ({ wallet });

export default connect(mapStateToProps)(ForgotPin);
