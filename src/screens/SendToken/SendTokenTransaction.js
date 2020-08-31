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
import t from 'translations/translate';

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
import { isSablierTransactionTag } from 'utils/sablier';
import { formatUnits } from 'utils/common';

// actions
import { setDismissTransactionAction } from 'actions/exchangeActions';
import { setDismissApproveAction, setExecutingApproveAction } from 'actions/poolTogetherActions';
import { setExecutingSablierApproveAction, setDismissSablierApproveAction } from 'actions/sablierActions';

// constants
import {
  SEND_TOKEN_CONFIRM,
  SEND_COLLECTIBLE_CONFIRM,
  POOLTOGETHER_DASHBOARD,
  SABLIER_STREAMS,
} from 'constants/navigationConstants';
import { COLLECTIBLES, DAI } from 'constants/assetsConstants';
import { EXCHANGE } from 'constants/exchangeConstants';
import { POOLTOGETHER_DEPOSIT_TRANSACTION } from 'constants/poolTogetherConstants';
import { SABLIER_CREATE_STREAM } from 'constants/sablierConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
  executingExchangeTransaction: boolean,
  setDismissExchangeTransaction: Function,
  setDismissPoolTogetherApprove: Function,
  setExecutingPoolTogetherApprove: Function,
  poolApproveExecuting: { [string]: boolean | string },
  setDismissSablierApprove: Function,
  sablierApproveExecuting: { [string]: string | boolean },
  setExecutingSablierApprove: Function,
};

const animationSuccess = require('assets/animations/transactionSentConfirmationAnimation.json');
const animationFailure = require('assets/animations/transactionFailureAnimation.json');


const getTransactionErrorMessage = (error: string): string => {
  const TRANSACTION_ERRORS = {
    'transaction underpriced': t('error.transactionFailed.notEnoughGas'),
    'replacement transaction underpriced': t('error.transactionFailed.notEnoughGas'),
    'is not owned': t('error.transactionFailed.notOwnedCollectible'),
    'can not be transferred': t('error.transactionFailed.collectibleCantBeTransferred'),
  };
  const transactionFailureText = t('error.transactionFailed.default');
  return TRANSACTION_ERRORS[error] || transactionFailureText;
};

const getTransactionSuccessMessage = (transactionType: ?string, extra?: Object) => {
  if (transactionType === EXCHANGE) {
    return t('transactions.paragraph.exchangeTransactionSuccess');
  } else if (transactionType === POOLTOGETHER_DEPOSIT_TRANSACTION) {
    return t('transactions.paragraph.poolTogetherDepositTransactionSuccess');
  } else if (transactionType === SABLIER_CREATE_STREAM) {
    return t('transactions.paragraph.sablierStreamTransactionSuccess', {
      address: extra?.contactAddress || '',
    });
  }
  return t('transactions.paragraph.transactionSuccess');
};

const getTransactionSuccessTitle = (props) => {
  const { transactionTokenType, transactionType, isAllowanceTransaction } = props;
  if (transactionType === EXCHANGE) {
    if (isAllowanceTransaction) {
      return t('transactions.title.allowanceTransactionSuccess');
    }
    return t('transactions.title.exchangeTransactionSuccess');
  } else if (transactionTokenType === COLLECTIBLES) {
    return t('transactions.title.collectibleTransactionSuccess');
  } else if (transactionType === POOLTOGETHER_DEPOSIT_TRANSACTION) {
    return t('transactions.title.poolTogetherTransactionSuccess');
  } else if (transactionType === SABLIER_CREATE_STREAM) {
    return t('transactions.title.sablierTransactionSuccess');
  }
  return t('transactions.title.transactionSuccess');
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
      sablierApproveExecuting,
      setExecutingSablierApprove,
      setDismissSablierApprove,
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

    const sablierAsset = transactionPayload?.extra?.sablierApproval?.symbol;
    if (sablierAsset && !sablierApproveExecuting[sablierAsset]) {
      if (isSuccess && txHash) {
        setExecutingSablierApprove(sablierAsset, txHash);
      } else {
        setDismissSablierApprove(sablierAsset);
      }
    }

    const txTag = transactionPayload?.tag || '';
    if (isSuccess && isPoolTogetherTag(txTag)) {
      const { extra: { symbol = DAI, amount, decimals = 18 } = {} } = transactionPayload;
      navigation.navigate(POOLTOGETHER_DASHBOARD, { symbol });
      const ticketsCount = parseFloat(formatUnits(amount, decimals));
      if (txTag === POOLTOGETHER_DEPOSIT_TRANSACTION) {
        Toast.show({
          message: t('toast.purchasedPoolTogetherTickets', { count: ticketsCount }),
          emoji: 'ok_hand',
          autoClose: true,
        });
      }
      return;
    }

    if (isSablierTransactionTag(txTag)) {
      navigation.navigate(SABLIER_STREAMS);
      return;
    }

    navigation.dismiss();

    if (transactionPayload.usePPN && isSuccess) {
      const { amount, symbol } = transactionPayload;
      const paymentInfo = `${amount} ${symbol}`;
      Toast.show({
        message: t('toast.transactionStarted', { paymentInfo }),
        emoji: 'ok_hand',
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
            <Button onPress={this.handleNavigationBack} title={t('button.retry')} />
          </ButtonWrapper>
        )}
        <TouchableOpacity onPress={this.handleDismissal}>
          <CancelText>{t('button.cancel')}</CancelText>
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
        extra,
      },
      transactionType,
    } = navigation.state.params;

    const animationSource = isSuccess ? animationSuccess : animationFailure;
    const transactionStatusText = isSuccess
      ? getTransactionSuccessMessage(transactionType, extra)
      : getTransactionErrorMessage(error);
    const isAllowanceTransaction = Object.keys(allowance).length;
    const transactionStatusTitle = isSuccess
      ? getTransactionSuccessTitle({ transactionTokenType, transactionType, isAllowanceTransaction })
      : t('error.transactionFailed.default');
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
  sablier: { sablierApproveExecuting },
}: RootReducerState): $Shape<Props> => ({
  executingExchangeTransaction,
  poolApproveExecuting,
  sablierApproveExecuting,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  setDismissExchangeTransaction: () => dispatch(setDismissTransactionAction()),
  setDismissPoolTogetherApprove: (symbol: string) => dispatch(setDismissApproveAction(symbol)),
  setExecutingPoolTogetherApprove:
    (symbol: string, txHash: string) => dispatch(setExecutingApproveAction(symbol, txHash)),
  setExecutingSablierApprove:
    (symbol: string, txHash: string) => dispatch(setExecutingSablierApproveAction(symbol, txHash)),
  setDismissSablierApprove: (symbol: string) => dispatch(setDismissSablierApproveAction(symbol)),
});

export default connect(mapStateToProps, mapDispatchToProps)(SendTokenTransaction);
