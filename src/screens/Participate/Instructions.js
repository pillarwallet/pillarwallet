// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import { Clipboard, Share } from 'react-native';
import QRCode from 'react-native-qrcode';

// components
import Header from 'components/Header';
import Button from 'components/Button';
import { Container, Wrapper, ScrollWrapper, Footer } from 'components/Layout';
import { BoldText, Label } from 'components/Typography';
import ListItemUnderlined from 'screens/Participate/ListItemUnderlined';

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

const InstructionsLabel = styled(Label)`
  text-align:center;
  font-size: ${fontSizes.extraSmall};
  margin-bottom: 4px;
`;

const IntroText = styled(BoldText)`
  font-size: ${fontSizes.extraSmall}px;
  line-height: ${fontSizes.medium}px;
  color: ${baseColors.darkGray};
`;

const Value = styled(BoldText)`
  font-size: ${props => props.xl ? fontSizes.large : fontSizes.small};
  text-align: center;
`;

const Instructions = styled.View`
  justify-content: center;
  display: flex;
  align-items: center;
  margin: ${spacing.rhythm}px 0;
`;

const ListWrapper = styled.View`
  width: 100%;
  border-top-width: 1px;
  border-top-color: ${baseColors.gallery};
  background-color: ${baseColors.snowWhite};
  padding: ${spacing.rhythm / 2}px ${spacing.rhythm}px;
`;

const FooterInner = styled.View`
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
`;

type Props = {
  navigation: NavigationScreenProp<*>,
  instructions: ICOFundingInstructions,
}

class InstructionsScreen extends React.Component<Props, {}> {
  handleBackNavigation = () => {
    this.props.navigation.goBack(null);
  };

  handleDismiss = () => {
    this.props.navigation.dismiss();
  };


  handleShare = () => {
    const instructionsCopy = this.getFiatInstructionsCopy(); // for now only fiat is available
    Share.share({
      message: instructionsCopy,
      subject: 'Funding instructions',
    }, {
      dialogTitle: 'Share Funding instructions',
      excludedActivityTypes: [
        'com.apple.UIKit.activity.PostToTwitter',
        'com.apple.UIKit.activity.PostToFacebook',
      ],
    });
  };

  handleCopyToClipBoard = () => {
    const instructionsCopy = this.getFiatInstructionsCopy();
    Clipboard.setString(instructionsCopy);
  };

  getFiatInstructionsCopy = (): string => {
    const { instructions, navigation } = this.props;
    const { amountToFund } = navigation.state.params;
    const listedInstructions = [
      ['Reference Number', instructions.reference],
      ['Beneficiary', instructions.beneficiary],
      ['IBAN', instructions.iban],
      ['BIC', instructions.bic],
      ['Bank', instructions.bankName],
      ['Amount in GBP', amountToFund],
    ];
    return listedInstructions
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }

  renderFiatInstructions() {
    const { instructions, navigation } = this.props;
    const { amountToFund, tokensToReceive } = navigation.state.params;
    return (
      <React.Fragment>
        <ScrollWrapper style={{ flex: 1 }}>
          <Wrapper regularPadding>
            <IntroText>
              Fund this bank account to purchase tokens.
              After receiving you will be able to manage tokens within the Pillar Wallet.
            </IntroText>
            <Instructions>
              <Row>
                <InstructionsLabel>Reference Number</InstructionsLabel>
                <Value xl style={{ color: baseColors.fireEngineRed }}>{instructions.reference}</Value>
              </Row>
              <Row>
                <InstructionsLabel>Beneficiary</InstructionsLabel>
                <Value xl>{instructions.beneficiary}</Value>
              </Row>
              <Row>
                <InstructionsLabel>IBAN</InstructionsLabel>
                <Value xl>{instructions.iban}</Value>
              </Row>
              <Row>
                <InstructionsLabel>BIC</InstructionsLabel>
                <Value xl>{instructions.bic}</Value>
              </Row>
              <Row>
                <InstructionsLabel>Bank</InstructionsLabel>
                <Value xl>{instructions.bankName}</Value>
              </Row>
            </Instructions>
          </Wrapper>
          <ListWrapper>
            <ListItemUnderlined
              label="AMOUNT IN GBP"
              value={amountToFund}
            />
            <ListItemUnderlined
              label="TOKENS TO RECEIVE"
              value={tokensToReceive}
            />
          </ListWrapper>
        </ScrollWrapper>
        <Footer
          backgroundColor={baseColors.snowWhite}
        >
          <FooterInner>
            <Button block title="Share Instructions" onPress={this.handleShare} />
          </FooterInner>
        </Footer>
      </React.Fragment>
    );
  }

  renderCryptoInstructions() {
    const { instructions } = this.props;
    return (
      <React.Fragment>
        <ScrollWrapper style={{ flex: 1 }}>
          <Wrapper regularPadding>
            <Instructions>
              <Row>
                <InstructionsLabel>{instructions.currency} address to receive tokens</InstructionsLabel>
                <Value style={{ fontSize: fontSizes.small }}>{instructions.address}</Value>
              </Row>
              <Row style={{ marginTop: spacing.rhythm }}>
                <QRCode value={instructions.address} size={125} />
              </Row>
            </Instructions>
          </Wrapper>
          <ListWrapper>
            <ListItemUnderlined
              label="AMOUNT TO FUND"
              value="00-00-00"
            />
            <ListItemUnderlined
              label="TOKENS TO RECEIVE"
              value="00-00-00"
            />
            <ListItemUnderlined
              label="CONVERTING TO BTC"
              value="00-00-00"
            />
          </ListWrapper>
        </ScrollWrapper>
        <Footer
          backgroundColor={baseColors.snowWhite}
        >
          <FooterInner>
            <Button block title="Copy to clipboard" onPress={this.handleCopyToClipBoard} />
            <Button block style={{ marginTop: 20 }} title="Share Address" onPress={this.handleShare} />
          </FooterInner>
        </Footer>
      </React.Fragment>
    );
  }

  render() {
    const { instructions } = this.props;
    return (
      <Container color={baseColors.white}>
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
