// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import QRCode from 'react-native-qrcode';

// components
import Header from 'components/Header';
import Button from 'components/Button';
import { ICO_CONFIRM } from 'constants/navigationConstants';
import { Container, Wrapper, Footer } from 'components/Layout';
import { BoldText, Label, BaseText } from 'components/Typography';

// models
import type { ICOFundingInstructions } from 'models/ICO';

// utils
import { fontSizes, baseColors, spacing } from 'utils/variables';

const BANK_TRANSFER = 'bank_transfer';

const Row = styled.View`
  margin: ${spacing.rhythm / 2}px 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const FooterRow = styled.View`
  margin: ${spacing.rhythm / 2}px 0;
  flexDirection: row;
  alignItems: center;
  justifyContent: space-between;
`;

const InstructionsLabel = styled(Label)`
  text-align:center;
  font-size: ${fontSizes.extraSmall};
  margin-bottom: 4px;
`;

const SummaryLabel = styled(Label)`
  text-align:center;
  font-size: ${fontSizes.extraSmall};
`;

const Value = styled(BoldText)`
  font-size: ${fontSizes.small};
`;

const Instructions = styled.View`
  justify-content: center;
  display: flex;
  align-items: center;
  margin: ${spacing.rhythm}px 0;
`;

type Props = {
  navigation: NavigationScreenProp<*>,
  instructions: ICOFundingInstructions,
}
type State = {};

class InstructionsScreen extends React.Component<Props, State> {
  handleBackNavigation = () => {
    this.props.navigation.goBack(null);
  };

  handleDismiss = () => {
    this.props.navigation.dismiss();
  }

  navigateToConfirm = () => {
    this.props.navigation.navigate(ICO_CONFIRM);
  };

  handleShare = () => {

  }

  handleCopyToClipBoard = () => {

  }

  renderFiatInstructions() {
    const { instructions } = this.props;
    return (
      <React.Fragment>
        <Wrapper regularPadding>
          <BaseText style={{ color: baseColors.darkGray }}>
            Fund this bank account to purchase tokens.
            After receiving you will be able to manage tokens within the Pillar Wallet.
          </BaseText>
          <Instructions>
            <Row>
              <InstructionsLabel>Reference Number</InstructionsLabel>
              <Value style={{ color: baseColors.fireEngineRed }}>{instructions.reference}</Value>
            </Row>
            <Row>
              <InstructionsLabel>Beneficiary</InstructionsLabel>
              <Value>{instructions.beneficiary}</Value>
            </Row>
            <Row>
              <InstructionsLabel>IBAN</InstructionsLabel>
              <Value>{instructions.iban}</Value>
            </Row>
            <Row>
              <InstructionsLabel>BIC</InstructionsLabel>
              <Value>{instructions.bic}</Value>
            </Row>
            <Row>
              <InstructionsLabel>Bank</InstructionsLabel>
              <Value>{instructions.bankName}</Value>
            </Row>
          </Instructions>
        </Wrapper>
        <Footer style={{
          backgroundColor: baseColors.snowWhite,
          alignItems: 'stretch',
          borderTopWidth: 1,
          padding: 20,
          borderTopColor: '#EBEBEB',
        }}
        >
          <FooterRow>
            <SummaryLabel>AMOUNT IN GBP</SummaryLabel>
            <Value>00-00-00</Value>
          </FooterRow>
          <FooterRow>
            <SummaryLabel>TOKENS TO RECEIVE</SummaryLabel>
            <Value>00-00-00</Value>
          </FooterRow>
          <Button style={{ marginTop: 20 }} title="Share Instructions" onPress={this.handleShare} />
        </Footer>
      </React.Fragment>
    );
  }

  renderCryptoInstructions() {
    const { instructions } = this.props;
    return (
      <React.Fragment>
        <Wrapper regularPadding>
          <Instructions>
            <Row>
              <InstructionsLabel>{instructions.currency} address to receive tokens</InstructionsLabel>
              <Value style={{ fontSize: fontSizes.small }}>{instructions.address}</Value>
            </Row>
            <Row style={{ marginTop: spacing.rhythm * 2 }}>
              <QRCode value={instructions.address} size={140} />
            </Row>
          </Instructions>
        </Wrapper>
        <Footer style={{
          backgroundColor: baseColors.snowWhite,
          alignItems: 'stretch',
          borderTopWidth: 1,
          padding: 20,
          borderTopColor: '#EBEBEB',
        }}
        >
          <FooterRow>
            <SummaryLabel>AMOUNT TO FUND</SummaryLabel>
            <Value>00-00-00</Value>
          </FooterRow>
          <FooterRow>
            <SummaryLabel>TOKENS TO RECEIVE</SummaryLabel>
            <Value>00-00-00</Value>
          </FooterRow>
          <FooterRow>
            <SummaryLabel>CONVERTING TO BTC</SummaryLabel>
            <Value>00-00-00</Value>
          </FooterRow>
          <Button style={{ marginTop: 20 }} title="Share Address" onPress={this.handleCopyToClipBoard} />
          <Button style={{ marginTop: 20 }} title="Share Address" onPress={this.handleShare} />
        </Footer>
      </React.Fragment>
    );
  }

  render() {
    const { instructions } = this.props;
    return (
      <Container>
        <Header
          onBack={this.handleBackNavigation}
          onClose={this.handleDismiss}
          title="funding instructions"
        />
        {instructions.paymentType === BANK_TRANSFER ? this.renderFiatInstructions() : this.renderCryptoInstructions()}
      </Container>
    );
  }
}

const mapDispatchToProps = ({ icos: { instructions } }) => ({
  instructions,
});

export default connect(mapDispatchToProps)(InstructionsScreen);
