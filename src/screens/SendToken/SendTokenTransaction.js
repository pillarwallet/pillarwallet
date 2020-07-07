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
import { TouchableOpacity } from 'react-native';

import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
// components
import { Container, Wrapper } from 'components/Layout';
import { Paragraph, MediumText } from 'components/Typography';
import Title from 'components/Title';
import Button from 'components/Button';
import Animation from 'components/Animation';
import Toast from 'components/Toast';

// utils
import { fontSizes, spacing, fontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { isPoolTogetherTag } from 'utils/poolTogether';

// actions
import { setDismissTransactionAction } from 'actions/exchangeActions';
import { setDismissApproveAction, setExecutingApproveAction } from 'actions/poolTogetherActions';

// constants
import { SEND_TOKEN_CONFIRM, SEND_COLLECTIBLE_CONFIRM, POOLTOGETHER_DASHBOARD } from 'constants/navigationConstants';
import { COLLECTIBLES, DAI } from 'constants/assetsConstants';
import { EXCHANGE } from 'constants/exchangeConstants';
import { POOLTOGETHER_DEPOSIT_TRANSACTION } from 'constants/poolTogetherConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
  executingExchangeTransaction: boolean,
  setDismissExchangeTransaction: Function,
  setDismissPoolTogetherApprove: Function,
  setExecutingPoolTogetherApprove: Function,
  poolApproveExecuting: { [string]: boolean | string },
}

const animationSuccess = require('assets/animations/transactionSentConfirmationAnimation.json');
const animationFailure = require('assets/animations/transactionFailureAnimation.json');


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

const getTransactionSuccessMessage = (transactionType: ?string) => {
  if (transactionType === EXCHANGE) {
    return 'It may take some time for this transaction to complete';
  } else if (transactionType === POOLTOGETHER_DEPOSIT_TRANSACTION) {
    return 'Watch the pool and let luck be with you';
  }
  return 'It will be settled in a few moments, depending on your gas price settings and Ethereum network load';
};

const getTransactionSuccessTitle = (props) => {
  const { transactionTokenType, transactionType, isAllowanceTransaction } = props;
  if (transactionType === EXCHANGE) {
    if (isAllowanceTransaction) {
      return 'Transaction is on its way';
    }
    return 'Swapping tokens...';
  } else if (transactionTokenType === COLLECTIBLES) {
    return 'Collectible is on its way';
  } else if (transactionType === POOLTOGETHER_DEPOSIT_TRANSACTION) {
    return 'You\'re in the pool!';
  }
  return 'Tokens are on their way';
};

const CancelText = styled(MediumText)`
  color: ${themedColors.negative};
  font-size: ${fontSizes.medium}px;
`;

const ButtonWrapper = styled.View`
  width: 100%;
  margin: 0px ${spacing.layoutSides}px 20px;
`;

const FailureButtonsWrapper = styled.View`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

class SendTokenTransaction extends React.Component<Props> {
  handleDismissal = () => {
    const {
      navigation,
      executingExchangeTransaction,
      setDismissExchangeTransaction,
      setDismissPoolTogetherApprove,
      setExecutingPoolTogetherApprove,
      poolApproveExecuting,
    } = this.props;
    if (executingExchangeTransaction) {
      setDismissExchangeTransaction();
    }

    const { isSuccess, transactionPayload, txHash = null } = navigation.state.params;

    const poolToken = transactionPayload?.extra?.poolTogetherApproval?.symbol;
    if (poolToken && !poolApproveExecuting[poolToken]) {
      if (isSuccess && txHash) {
        setExecutingPoolTogetherApprove(poolToken, txHash);
      } else {
        setDismissPoolTogetherApprove(poolToken);
      }
    }

    const txTag = transactionPayload?.tag || '';
    if (isSuccess && isPoolTogetherTag(txTag)) {
      const { extra: { symbol = DAI } = {} } = transactionPayload;
      navigation.navigate(POOLTOGETHER_DASHBOARD, { symbol });
      if (txTag === POOLTOGETHER_DEPOSIT_TRANSACTION) {
        Toast.show({
          message: 'You\'ve purchased new tickets',
          type: 'success',
          title: 'Success',
          autoClose: true,
        });
      }
      return;
    }

    navigation.dismiss();

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

  renderSuccessButton = () => {
    const { transactionType } = this.props.navigation.state.params;
    const successButtonText = transactionType === EXCHANGE ? 'Finish' : 'Magic!';
    return (
      <ButtonWrapper>
        <Button onPress={this.handleDismissal} title={successButtonText} />
      </ButtonWrapper>
    );
  }

  renderFailureButtons = () => {
    const { noRetry } = this.props.navigation.state.params;
    return (
      <FailureButtonsWrapper>
        {!noRetry && (
          <ButtonWrapper>
            <Button onPress={this.handleNavigationBack} title="Retry" />
          </ButtonWrapper>
        )}
        <TouchableOpacity onPress={this.handleDismissal}>
          <CancelText>Cancel</CancelText>
        </TouchableOpacity>
      </FailureButtonsWrapper>
    );
  }

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
      transactionType,
    } = navigation.state.params;

    const animationSource = isSuccess ? animationSuccess : animationFailure;
    const transactionStatusText = isSuccess
      ? getTransactionSuccessMessage(transactionType)
      : getTransactionErrorMessage(error);
    const isAllowanceTransaction = Object.keys(allowance).length;
    const transactionStatusTitle = isSuccess
      ? getTransactionSuccessTitle({ transactionTokenType, transactionType, isAllowanceTransaction })
      : 'Transaction failed';
    const titleStyle = { ...fontStyles.large, marginTop: 16, marginBottom: 7 };
    const textStyle = { ...fontStyles.regular, marginBottom: 75 };
    return (
      <Container>
        <Wrapper flex={1} center regularPadding>
          <Animation source={animationSource} />
          <Title fullWidth title={transactionStatusTitle} align="center" noBlueDot titleStyles={titleStyle} noMargin />
          <Paragraph light center style={textStyle}>{transactionStatusText}</Paragraph>
          {isSuccess ? this.renderSuccessButton() : this.renderFailureButtons()}
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
  poolTogether: { poolApproveExecuting },
}: RootReducerState): $Shape<Props> => ({
  executingExchangeTransaction,
  poolApproveExecuting,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  setDismissExchangeTransaction: () => dispatch(setDismissTransactionAction()),
  setDismissPoolTogetherApprove: (symbol: string) => dispatch(setDismissApproveAction(symbol)),
  setExecutingPoolTogetherApprove:
    (symbol: string, txHash: string) => dispatch(setExecutingApproveAction(symbol, txHash)),
});

export default connect(mapStateToProps, mapDispatchToProps)(SendTokenTransaction);
