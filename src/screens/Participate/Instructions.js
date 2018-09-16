// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';

// components
import Header from 'components/Header';
import Button from 'components/Button';
import { ICO_CONFIRM } from 'constants/navigationConstants';
import { Container, Wrapper, Footer } from 'components/Layout';
import { BoldText, Label, BaseText } from 'components/Typography';

// utils
import { fontSizes, baseColors, spacing } from 'utils/variables';

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
  alignItems: flex-start;
  justifyContent: space-between;
`;

const InstructionsLabel = styled(Label)`
  text-align:center;
  font-size: ${fontSizes.small};
`;

const SummaryLabel = styled(Label)`
  text-align:center;
  font-size: ${fontSizes.extraSmall};
`;

const Value = styled(BoldText)`
  font-size: ${fontSizes.medium};
`;

const Instructions = styled.View`
  justify-content: center;
  display: flex;
  align-items: center;
  margin: ${spacing.rhythm}px 0;
`;

type Props = {
  navigation: NavigationScreenProp<*>,
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

  render() {
    return (
      <Container>
        <Header
          onBack={this.handleBackNavigation}
          onClose={this.handleDismiss}
          title="funding instructions"
        />
        <Wrapper regularPadding>
          <BaseText style={{ color: baseColors.darkGray }}>
            Fund this bank account to purchase tokens.
            After receiving you will be able to manage tokens within the Pillar Wallet.
          </BaseText>
          <Instructions>
            <Row>
              <InstructionsLabel>Reference Number</InstructionsLabel>
              <Value style={{ color: baseColors.fireEngineRed }}>00000000</Value>
            </Row>
            <Row>
              <InstructionsLabel>Beneficiary</InstructionsLabel>
              <Value>2030</Value>
            </Row>
            <Row>
              <InstructionsLabel>IBAN</InstructionsLabel>
              <Value>B000000000 000000000</Value>
            </Row>
            <Row>
              <InstructionsLabel>BIC</InstructionsLabel>
              <Value>00-00-00</Value>
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
      </Container>
    );
  }
}

export default InstructionsScreen;
