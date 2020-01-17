// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { View, TouchableOpacity } from 'react-native';

import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
// components
import { Container, Wrapper } from 'components/Layout';
import { Paragraph, MediumText } from 'components/Typography';
import Title from 'components/Title';
import Button from 'components/Button';
import Animation from 'components/Animation';
import Toast from 'components/Toast';

// utils
import { fontSizes } from 'utils/variables';
import { themedColors } from 'utils/themes';

// actions
import { setDismissTransactionAction } from 'actions/exchangeActions';

// constants
import { SEND_TOKEN_CONFIRM, SEND_COLLECTIBLE_CONFIRM } from 'constants/navigationConstants';
import { COLLECTIBLES } from 'constants/assetsConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
  executingExchangeTransaction: boolean,
  setDismissExchangeTransaction: Function,
}

const animationSuccess = require('assets/animations/transactionSentConfirmationAnimation.json');
const animationFailure = require('assets/animations/transactionFailureAnimation.json');

const transactionSuccessText =
  'It will be settled in a few moments, depending on your gas price settings and Ethereum network load';

const getTransactionErrorMessage = (error: string): string => {
  const TRANSACTION_ERRORS = {
    'transaction underpriced': 'Not enough gas to cover the transaction fee. Top up your ETH balance',
    'replacement transaction underpriced': 'Not enough gas to cover the transaction fee. Top up your ETH balance',
    'is not owned': 'You do not longer own this collectible',
    'can not be transferred': 'This collectible can not be transferred',
  };
  const transactionFailureText = 'Something went wrong';
  return TRANSACTION_ERRORS[error] || transactionFailureText;
};

const CancelText = styled(MediumText)`
  color: ${themedColors.negative};
  font-size: ${fontSizes.medium}px;
`;

class SendTokenTransaction extends React.Component<Props> {
  handleDismissal = () => {
    const {
      navigation,
      executingExchangeTransaction,
      setDismissExchangeTransaction,
    } = this.props;
    if (executingExchangeTransaction) {
      setDismissExchangeTransaction();
    }
    navigation.dismiss();

    const { isSuccess, transactionPayload } = navigation.state.params;
    if (transactionPayload.usePPN && isSuccess) {
      Toast.show({
        message: 'Transaction was successfully sent!',
        type: 'success',
        title: 'Success',
        autoClose: true,
      });
    }
  };

  handleNavigationBack = () => {
    const { navigation } = this.props;
    const { transactionPayload } = navigation.state.params;

    if (transactionPayload.tokenType === COLLECTIBLES) {
      navigation.navigate(SEND_COLLECTIBLE_CONFIRM, { transactionPayload });
      return;
    }
    navigation.navigate(SEND_TOKEN_CONFIRM, { transactionPayload });
  };

  render() {
    const { navigation } = this.props;
    const {
      isSuccess,
      error,
      transactionPayload: {
        tokenType: transactionTokenType,
        extra: {
          allowance = {},
        } = {},
      },
      noRetry,
    } = navigation.state.params;

    const animationSource = isSuccess ? animationSuccess : animationFailure;
    const transactionStatusText = isSuccess ? transactionSuccessText : getTransactionErrorMessage(error);

    let successText;
    const isAllowanceTransaction = Object.keys(allowance).length;
    if (transactionTokenType === COLLECTIBLES) {
      successText = 'Collectible is on its way';
    } else {
      successText = isAllowanceTransaction
        ? 'Transaction is on it\'s way'
        : 'Tokens are on their way';
    }
    const transactionStatusTitle = isSuccess ? successText : 'Transaction failed';

    return (
      <Container>
        <Wrapper flex={1} center regularPadding>
          <Animation source={animationSource} />
          <Title fullWidth title={transactionStatusTitle} align="center" noBlueDot />
          <Paragraph small light center style={{ marginBottom: 40 }}>{transactionStatusText}</Paragraph>
          {isSuccess ?
            <Button marginBottom="20px" onPress={this.handleDismissal} title="Magic!" /> :
            <View style={{ justifyContent: 'center', display: 'flex', alignItems: 'center' }}>
              {!noRetry && <Button marginBottom="20px" onPress={this.handleNavigationBack} title="Retry" />}
              <TouchableOpacity onPress={this.handleDismissal}>
                <CancelText>Cancel</CancelText>
              </TouchableOpacity>
            </View>
          }
        </Wrapper>
        {/*
        {isSuccess &&
          <Footer>
            <ShareSocial label="Share the love" facebook instagram twitter />
          </Footer>
        }
        */}
      </Container>
    );
  }
}

const mapStateToProps = ({
  exchange: { data: { executingTransaction: executingExchangeTransaction } },
}: RootReducerState): $Shape<Props> => ({
  executingExchangeTransaction,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  setDismissExchangeTransaction: () => dispatch(setDismissTransactionAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(SendTokenTransaction);
