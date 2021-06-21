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
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { TouchableOpacity } from 'react-native';
import t from 'translations/translate';

// components
import { Container, Wrapper } from 'components/Layout';
import { Paragraph, MediumText } from 'components/Typography';
import Title from 'components/Title';
import Button from 'components/Button';
import Animation from 'components/Animation';
import Toast from 'components/Toast';

// utils
import { fontSizes, spacing, objectFontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { isLiquidityPoolsTransactionTag } from 'utils/liquidityPools';

// constants
import {
  SEND_TOKEN_CONFIRM,
  SEND_COLLECTIBLE_CONFIRM,
  LIQUIDITY_POOL_DASHBOARD,
} from 'constants/navigationConstants';
import {
  LIQUIDITY_POOLS_ADD_LIQUIDITY_TRANSACTION,
  LIQUIDITY_POOLS_REMOVE_LIQUIDITY_TRANSACTION,
  LIQUIDITY_POOLS_STAKE_TRANSACTION,
  LIQUIDITY_POOLS_UNSTAKE_TRANSACTION,
  LIQUIDITY_POOLS_REWARDS_CLAIM_TRANSACTION,
} from 'constants/liquidityPoolsConstants';
import { COLLECTIBLES } from 'constants/assetsConstants';
import { TRANSACTION_TYPE, ERROR_TYPE } from 'constants/transactionsConstants';


type Props = {
  navigation: NavigationScreenProp<*>,
};

const animationSuccess = require('assets/animations/transactionSentConfirmationAnimation.json');
const animationFailure = require('assets/animations/transactionFailureAnimation.json');


const getTransactionErrorMessage = (error: string): string => {
  const TRANSACTION_ERRORS = {
    [ERROR_TYPE.TRANSACTION_UNDERPRISED]: t('error.transactionFailed.notEnoughGas'),
    [ERROR_TYPE.REPLACEMENT_TRANSACTION_UNDERPRISED]: t('error.transactionFailed.notEnoughGas'),
    [ERROR_TYPE.NOT_OWNED]: t('error.transactionFailed.notOwnedCollectible'),
    [ERROR_TYPE.CANT_BE_TRANSFERRED]: t('error.transactionFailed.collectibleCantBeTransferred'),
  };
  const transactionFailureText = t('error.transactionFailed.default');
  return TRANSACTION_ERRORS[error] || transactionFailureText;
};

const getTransactionSuccessMessage = (transactionType: ?string) => {
  if (transactionType === TRANSACTION_TYPE.EXCHANGE) {
    return t('transactions.paragraph.exchangeTransactionSuccess');
  }
  return t('transactions.paragraph.transactionSuccess');
};

const getTransactionSuccessTitle = (props) => {
  const { transactionTokenType, transactionType, isAllowanceTransaction } = props;
  if (transactionType === TRANSACTION_TYPE.EXCHANGE) {
    if (isAllowanceTransaction) {
      return t('transactions.title.allowanceTransactionSuccess');
    }
    return t('transactions.title.exchangeTransactionSuccess');
  } else if (transactionTokenType === COLLECTIBLES) {
    return t('transactions.title.collectibleTransactionSuccess');
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
    const { navigation } = this.props;

    const { isSuccess, transactionPayload, goBackDismiss } = navigation.state.params;

    const txTag = transactionPayload?.tag || '';

    if (isLiquidityPoolsTransactionTag(txTag)) {
      let toastMessage = null;
      const {
        extra: {
          amount, pool,
        } = {},
      } = transactionPayload;
      navigation.navigate(LIQUIDITY_POOL_DASHBOARD, { pool });
      if (txTag === LIQUIDITY_POOLS_ADD_LIQUIDITY_TRANSACTION) {
        toastMessage = t('toast.liquidityPoolsAddLiquidity', { value: amount, token: pool.symbol });
      } else if (txTag === LIQUIDITY_POOLS_REMOVE_LIQUIDITY_TRANSACTION) {
        toastMessage = t('toast.liquidityPoolsRemoveLiquidity', { value: amount, token: pool.symbol });
      } else if (txTag === LIQUIDITY_POOLS_STAKE_TRANSACTION) {
        toastMessage = t('toast.liquidityPoolsStake', { value: amount, token: pool.symbol });
      } else if (txTag === LIQUIDITY_POOLS_UNSTAKE_TRANSACTION) {
        toastMessage = t('toast.liquidityPoolsUnstake', { value: amount, token: pool.symbol });
      } else if (txTag === LIQUIDITY_POOLS_REWARDS_CLAIM_TRANSACTION) {
        toastMessage = t('toast.liquidityPoolsClaimRewards', {
          value: amount,
          token: pool.rewards[0].symbol,
        });
      }
      if (toastMessage) {
        Toast.show({
          message: toastMessage,
          emoji: 'ok_hand',
          autoClose: true,
        });
      }
      return;
    }

    if (goBackDismiss) {
      navigation.goBack(null);
    } else {
      navigation.dismiss();
    }

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
    const successButtonText = transactionType === TRANSACTION_TYPE.EXCHANGE
      ? t('button.finish')
      : t('button.magic', { exclamation: true });
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
      : t('error.transactionFailed.default');
    const titleStyle = { ...objectFontStyles.large, marginTop: 16, marginBottom: 7 };
    const textStyle = { ...objectFontStyles.regular, marginBottom: 75 };
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

export default SendTokenTransaction;
