// @flow
import * as React from 'react';

import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { Container, Wrapper } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import Header from 'components/Header';
import Button from 'components/Button';
import styled from 'styled-components/native/index';
import { baseColors } from 'utils/variables';
import { IMPORT_WALLET, FORGOT_PIN } from 'constants/navigationConstants';

type Props = {
  checkPin: (pin: string, onValidPin: Function) => Function,
  wallet: Object,
  navigation: NavigationScreenProp<*>,
}

const BlackText = styled.Text`
  color: ${baseColors.black}
`;

const InnerWrapper = styled.View`
  justify-content: space-between;
  align-items: center;
  height: 100%;
`;

const Body = styled.View`
`;
const Footer = styled.View`
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: 0 20px 40px;
  width: 100%
`;

export const FooterParagraph = styled(Paragraph)`
  margin-bottom: 60px;
  color: ${baseColors.burningFire};
  text-align: center;
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
        <Wrapper regularPadding flex={1}>
          <InnerWrapper>
            <Body>
              <Paragraph light>You can restore access to your wallet by <BlackText>re-importing </BlackText>
                it using 12-word backup phrase (<BlackText>private key</BlackText>)
                generated for you during the wallet creation.
              </Paragraph>
              <Paragraph light>
                Please have the private key ready and re-import your wallet.
              </Paragraph>
            </Body>
            <Footer>
              <FooterParagraph>
                It is impossible to restore your wallet without the backup, be careful.
              </FooterParagraph>
              <Button block danger marginBottom="20px" onPress={this.toImportWallet} title="Import wallet" />
              <Button onPress={this.goBackToPin} secondary title="Try entering PIN again" />
            </Footer>
          </InnerWrapper>
        </Wrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet: { data: wallet } }) => ({ wallet });

export default connect(mapStateToProps)(ForgotPin);
