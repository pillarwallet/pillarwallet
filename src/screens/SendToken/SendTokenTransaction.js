// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { View, TouchableOpacity } from 'react-native';

// components
import { Container, Wrapper, Footer } from 'components/Layout';
import { Paragraph, BoldText } from 'components/Typography';
import Title from 'components/Title';
import Button from 'components/Button';
import Animation from 'components/Animation';
import ShareSocial from 'components/ShareSocial';

// utils
import { baseColors, fontSizes } from 'utils/variables';

// constants
import { SEND_TOKEN_CONFIRM } from 'constants/navigationConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
}

type State = {}

const animationSuccess = require('assets/animations/transactionSentConfirmationAnimation.json');
const animationFailure = require('assets/animations/transactionFailureAnimation.json');

const transactionSuccessText =
  'It will be settled in a few moments, depending on your gas price settings and Ethereum network load';

const getTransactionErrorMessage = (error: string): string => {
  const TRANSACTION_ERRORS = {
    'transaction underpriced': 'Not enough gas to cover the transaction fee. Top up your ETH balance',
    'replacement transaction underpriced': 'Not enough gas to cover the transaction fee. Top up your ETH balance',
  };
  const transactionFailureText = 'Something went wrong';
  return TRANSACTION_ERRORS[error] || transactionFailureText;
};

const CancelText = styled(BoldText)`
  color: ${baseColors.burningFire};
  font-size: ${fontSizes.small};
`;

class SendTokenTransaction extends React.Component<Props, State> {
  handleDismissal = () => {
    const { navigation } = this.props;
    navigation.dismiss();
  };

  handleNavigationBack = () => {
    const { navigation } = this.props;
    navigation.navigate(SEND_TOKEN_CONFIRM);
  }

  render() {
    const { navigation } = this.props;
    const { isSuccess, error } = navigation.state.params;
    const animationSource = isSuccess ? animationSuccess : animationFailure;
    const transactionStatusText = isSuccess ? transactionSuccessText : getTransactionErrorMessage(error);
    const transactionStatusTitle = isSuccess ? 'Money is on its way' : 'Transaction failed';
    return (
      <Container>
        <Wrapper flex={1} center regularPadding>
          <Animation source={animationSource} />
          <Title title={transactionStatusTitle} align="center" noBlueDot />
          <Paragraph small light center style={{ marginBottom: 40 }}>{transactionStatusText}</Paragraph>
          {isSuccess ?
            <Button marginBottom="20px" onPress={this.handleDismissal} title="Magic!" /> :
            <View style={{ justifyContent: 'center', display: 'flex', alignItems: 'center' }}>
              <Button marginBottom="20px" onPress={this.handleNavigationBack} title="Retry" />
              <TouchableOpacity onPress={this.handleDismissal}>
                <CancelText>Cancel</CancelText>
              </TouchableOpacity>
            </View>
          }
        </Wrapper>
        {isSuccess &&
          <Footer>
            <ShareSocial label="Share the love" facebook instagram twitter />
          </Footer>
        }
      </Container>
    );
  }
}

export default SendTokenTransaction;
