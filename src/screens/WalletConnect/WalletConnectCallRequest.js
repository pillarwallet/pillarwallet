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
import React, { useEffect } from 'react';
import styled, { withTheme } from 'styled-components/native';
import { connect } from 'react-redux';
import { utils } from 'ethers';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';
import { useNavigation } from 'react-navigation-hooks';

// components
import { Footer, ScrollWrapper } from 'components/Layout';
import { Label, Paragraph, MediumText } from 'components/Typography';
import Button from 'components/Button';
import Image from 'components/Image';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Spinner from 'components/Spinner';
import Toast from 'components/Toast';

// utils
import { spacing, fontSizes, fontStyles } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';
import {
  getAssetsAsList,
  isEnoughBalanceForTransactionFee,
} from 'utils/assets';
import { images } from 'utils/images';
import { formatTransactionFee } from 'utils/common';

// constants
import { ETH } from 'constants/assetsConstants';
import {
  PERSONAL_SIGN,
  ETH_SEND_TX,
  ETH_SIGN_TX,
  REQUEST_TYPE,
  ETH_SIGN_TYPED_DATA,
  ETH_SIGN,
} from 'constants/walletConnectConstants';

// utils
import { mapCallRequestToTransactionPayload } from 'utils/walletConnect';
import { isArchanovaAccount } from 'utils/accounts';

// hooks
import useWalletConnect from 'hooks/useWalletConnect';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { isArchanovaWalletActivatedSelector } from 'selectors/archanova';
import { activeAccountSelector, supportedAssetsSelector } from 'selectors';
import { accountAssetsSelector } from 'selectors/assets';

// types
import type { Asset, Assets, Balances } from 'models/Asset';
import type { Theme } from 'models/Theme';
import type { TransactionFeeInfo } from 'models/Transaction';
import type { RootReducerState } from 'reducers/rootReducer';
import type { Account } from 'models/Account';


type Props = {
  balances: Balances,
  theme: Theme,
  isEstimating: boolean,
  feeInfo: ?TransactionFeeInfo,
  estimateErrorMessage: ?string,
  isArchanovaWalletActivated: boolean,
  activeAccount: ?Account,
  accountAssets: Assets,
  supportedAssets: Asset[],
};

const FooterWrapper = styled.View`
  flex-direction: column;
  width: 100%;
`;

const LabeledRow = styled.View`
  margin: 10px 0;
`;

const Value = styled(MediumText)`
  font-size: ${fontSizes.big}px;
`;

const LabelSub = styled(Label)`
  ${fontStyles.tiny};
`;

const WarningMessage = styled(Paragraph)`
  text-align: center;
  color: ${themedColors.negative};
  padding-bottom: ${spacing.rhythm}px;
`;

const OptionButton = styled(Button)`
  margin-top: 4px;
  flex-grow: 1;
`;

const WalletConnectCallRequestScreen = ({
  theme,
  isEstimating,
  balances,
  feeInfo,
  estimateErrorMessage,
  isArchanovaWalletActivated,
  estimateTransaction,
  activeAccount,
  accountAssets,
  supportedAssets,
} : Props) => {
  const navigation = useNavigation();
  const {
    callRequests,
    cancelCallRequest,
    approveCallRequest,
    estimateCallRequestTransaction,
  } = useWalletConnect();

  const callRequestId = navigation.getParam('callId');
  const callRequest = callRequests.find(({ callId }) => callId === +callRequestId);
  const callRequestMethod = callRequest?.method;

  let requestType;
  switch (callRequestMethod) {
    case ETH_SEND_TX:
    case ETH_SIGN_TX:
      requestType = REQUEST_TYPE.TRANSACTION;
      break;
    case ETH_SIGN:
    case ETH_SIGN_TYPED_DATA:
    case PERSONAL_SIGN:
      requestType = REQUEST_TYPE.MESSAGE;
      break;
    default:
      requestType = REQUEST_TYPE.UNSUPPORTED;
  }

  const transactionPayload = requestType === REQUEST_TYPE.TRANSACTION
    ? mapCallRequestToTransactionPayload(callRequest, getAssetsAsList(accountAssets), supportedAssets)
    : null;

  useEffect(() => {
    if (requestType !== REQUEST_TYPE.TRANSACTION) return;
    estimateCallRequestTransaction(callRequest);
  }, [callRequestMethod]);

  const colors = getThemeColors(theme);

  let errorMessage = requestType === REQUEST_TYPE.UNSUPPORTED
   ? t('walletConnectContent.error.unsupportedRequestCallRequestType')
   : estimateErrorMessage;

  if (!errorMessage && isArchanovaAccount(activeAccount) || !isArchanovaWalletActivated) {
    errorMessage = t('walletConnectContent.error.smartWalletNeedToBeActivated');
  }

  if (requestType === REQUEST_TYPE.TRANSACTION) {
      const { amount, symbol, decimals } = transactionPayload;
      if (!errorMessage && feeInfo && !isEnoughBalanceForTransactionFee(balances, {
        amount,
        symbol,
        decimals,
        txFeeInWei: feeInfo?.fee,
        gasToken: feeInfo?.gasToken,
      })) {
      errorMessage = t('error.notEnoughTokenForFee', { token: gasToken || ETH });
    }
  }

  const onApprovePress = () => {
    if (!callRequest) {
      Toast.show({
        message: t('toast.walletConnectCallRequestApproveFailed'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });
    } else {
      approveCallRequest(callRequest, transactionPayload);
    }

    navigation.dismiss();
  };

  const onRejectPress = () => {
    if (!callRequest) {
      Toast.show({
        message: t('toast.walletConnectCallRequestRejectFailed'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });
    }

    cancelCallRequest(callRequest);
    navigation.dismiss();
  };

  const renderTransactionDetails = () => {
    const feeDisplayValue = formatTransactionFee(feeInfo?.fee, feeInfo?.gasToken);
    const { genericToken } = images(theme);
    const { icon, name } = callRequest;
    const { amount, symbol, to } = transactionPayload;

    return (
      <>
        <LabeledRow>
          <Label>{t('walletConnectContent.label.requestFrom')}</Label>
          <Value>{name}</Value>
        </LabeledRow>
        {!!icon && (
          <Image
            key={name}
            style={{
              height: 55,
              width: 55,
              marginBottom: spacing.mediumLarge,
            }}
            source={{ uri: icon }}
            fallbackSource={genericToken}
            resizeMode="contain"
          />
        )}
        <LabeledRow>
          <Label>{t('transactions.label.amount')}</Label>
          <Value>{t('tokenValue', { value: amount, token: symbol })}</Value>
        </LabeledRow>
        <LabeledRow>
          <Label>{t('transactions.label.recipientAddress')}</Label>
          <Value>{to}</Value>
        </LabeledRow>
        <LabeledRow>
          <Label>{t('transactions.label.transactionFee')}</Label>
          <LabelSub>
            {t('walletConnectContent.paragraph.finalFeeMightBeHigher')}
          </LabelSub>
          {!!isEstimating && <Spinner style={{ marginTop: 5 }} size={20} trackWidth={2} />}
          {!isEstimating && <Value>{feeDisplayValue}</Value>}
        </LabeledRow>
      </>
    );
  };

  const renderMessageDetails = () => {
    const { params = [] } = callRequest;

    const preparedParams = callRequestMethod === PERSONAL_SIGN
      ? params.reverse() // different param order on PERSONAL_SIGN
      : params;

    const [address] = preparedParams;

    let message;
    if (callRequestMethod === PERSONAL_SIGN) {
      try {
        message = utils.toUtf8String(preparedParams[1])
      } catch (e) {
        ([,message] = preparedParams);
      }
    } else if (callRequestMethod === ETH_SIGN_TYPED_DATA) {
      message = t('transactions.paragraph.typedDataMessage');
    } else {
      ([,message] = preparedParams);
    }

    return (
      <>
        <LabeledRow>
          <Label>{t('transactions.label.address')}</Label>
          <Value>{address}</Value>
        </LabeledRow>
        <LabeledRow>
          <Label>{t('transactions.label.message')}</Label>
          <Value>{message}</Value>
        </LabeledRow>
      </>
    );
  };

  const isSubmitDisabled = !!errorMessage || (requestType === REQUEST_TYPE.TRANSACTION && isEstimating)

  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [{
          title: t([
            `walletConnectContent.title.requestType.${requestType}`,
            'walletConnectContent.title.requestType.default',
          ]),
        }],
      }}
    >
      {requestType !== REQUEST_TYPE.UNSUPPORTED && (
        <ScrollWrapper regularPadding>
          {requestType === REQUEST_TYPE.TRANSACTION && renderTransactionDetails()}
          {requestType === REQUEST_TYPE.MESSAGE && renderMessageDetails()}
        </ScrollWrapper>
      )}
      <Footer keyboardVerticalOffset={40} backgroundColor={colors.basic070}>
        {!!errorMessage && <WarningMessage small>{errorMessage}</WarningMessage>}
        <FooterWrapper>
          {requestType !== REQUEST_TYPE.UNSUPPORTED && (
            <OptionButton
              onPress={onApprovePress}
              disabled={isSubmitDisabled}
              title={
                t([
                  `walletConnectContent.button.approveType.${requestType}`,
                  'walletConnectContent.button.approveType.default',
                ])
              }
            />
          )}
          <OptionButton
            danger
            transparent
            onPress={onRejectPress}
            title={t('button.reject')}
          />
        </FooterWrapper>
      </Footer>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  transactionEstimate: { feeInfo, isEstimating, errorMessage: estimateErrorMessage },
}: RootReducerState): $Shape<Props> => ({
  isEstimating,
  feeInfo,
  estimateErrorMessage,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  isArchanovaWalletActivated: isArchanovaWalletActivatedSelector,
  activeAccount: activeAccountSelector,
  supportedAssets: supportedAssetsSelector,
  accountAssets: accountAssetsSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default withTheme(connect(combinedMapStateToProps)(WalletConnectCallRequestScreen));
