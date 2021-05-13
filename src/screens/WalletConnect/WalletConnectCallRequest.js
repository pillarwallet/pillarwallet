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
import React, { useEffect, useMemo } from 'react';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
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
import { themedColors, useThemeColors } from 'utils/themes';
import { getAssetsAsList, isEnoughBalanceForTransactionFee } from 'utils/assets';
import { useThemedImages } from 'utils/images';
import { formatTransactionFee } from 'utils/common';

// constants
import { ETH } from 'constants/assetsConstants';
import { REQUEST_TYPE } from 'constants/walletConnectConstants';
import { WALLETCONNECT_PIN_CONFIRM_SCREEN } from 'constants/navigationConstants';

// utils
import {
  getWalletConnectCallRequestType,
  mapCallRequestToTransactionPayload,
  parseMessageSignParamsFromCallRequest,
} from 'utils/walletConnect';
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
import type { TransactionFeeInfo, TransactionPayload } from 'models/Transaction';
import type { RootReducerState } from 'reducers/rootReducer';
import type { Account } from 'models/Account';


type Props = {
  balances: Balances,
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
  isEstimating,
  balances,
  feeInfo,
  estimateErrorMessage,
  isArchanovaWalletActivated,
  activeAccount,
  accountAssets,
  supportedAssets,
}: Props) => {
  const navigation = useNavigation();
  const { rejectCallRequest, estimateCallRequestTransaction } = useWalletConnect();

  const callRequest = navigation.getParam('callRequest');
  const requestType = getWalletConnectCallRequestType(callRequest);

  useEffect(() => {
    if (requestType !== REQUEST_TYPE.TRANSACTION) return;
    estimateCallRequestTransaction(callRequest);
  }, []);

  const colors = useThemeColors();
  const { genericToken } = useThemedImages();

  const transactionPayload: TransactionPayload | null = useMemo(() => {
    if (requestType !== REQUEST_TYPE.TRANSACTION) return null;
    return mapCallRequestToTransactionPayload(callRequest, getAssetsAsList(accountAssets), supportedAssets);
  }, [callRequest, accountAssets, supportedAssets, requestType]);

  const errorMessage: string | null = useMemo(() => {
    if (requestType === REQUEST_TYPE.UNSUPPORTED) {
      return t('walletConnectContent.error.unsupportedRequestCallRequestType');
    }

    if (isArchanovaAccount(activeAccount) && !isArchanovaWalletActivated) {
      return t('walletConnectContent.error.smartWalletNeedToBeActivated');
    }

    if (requestType === REQUEST_TYPE.TRANSACTION && estimateErrorMessage) {
      return estimateErrorMessage;
    }


    if (requestType === REQUEST_TYPE.TRANSACTION && !isEstimating && !transactionPayload) {
      return t('walletConnectContent.error.unableToShowTransaction');
    }

    if (requestType === REQUEST_TYPE.TRANSACTION && transactionPayload && feeInfo) {
      const { amount, symbol, decimals } = transactionPayload;
      if (!isEnoughBalanceForTransactionFee(balances, {
        amount,
        symbol,
        decimals,
        txFeeInWei: feeInfo?.fee,
        gasToken: feeInfo?.gasToken,
      })) {
        return t('error.notEnoughTokenForFee', { token: feeInfo.gasToken || ETH });
      }
    }

    return null;
  }, [
    requestType,
    activeAccount,
    isArchanovaWalletActivated,
    transactionPayload,
    isEstimating,
    estimateErrorMessage,
    feeInfo,
    balances,
  ]);

  const onApprovePress = () => {
    if (!callRequest) {
      Toast.show({
        message: t('toast.walletConnectCallRequestApproveFailed'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });
      navigation.dismiss();
      return;
    }

    navigation.navigate(WALLETCONNECT_PIN_CONFIRM_SCREEN, { callRequest, transactionPayload });
  };

  const onRejectPress = () => {
    if (!callRequest) {
      Toast.show({
        message: t('toast.walletConnectCallRequestRejectFailed'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });
    }

    rejectCallRequest(callRequest);
    navigation.dismiss();
  };

  const renderTransactionDetails = () => {
    if (!transactionPayload) return null; // edge case, error message is handled

    const feeDisplayValue = feeInfo?.fee && formatTransactionFee(feeInfo.fee, feeInfo?.gasToken);
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
        {!estimateErrorMessage && (
          <LabeledRow>
            <Label>{t('transactions.label.transactionFee')}</Label>
            <LabelSub>
              {t('walletConnectContent.paragraph.finalFeeMightBeHigher')}
            </LabelSub>
            {!!isEstimating && <Spinner style={{ marginTop: 15, alignSelf: 'flex-start' }} size={20} trackWidth={2} />}
            {!isEstimating && <Value>{feeDisplayValue}</Value>}
          </LabeledRow>
        )}
      </>
    );
  };

  const renderMessageDetails = () => {
    const { address, message } = parseMessageSignParamsFromCallRequest(callRequest);

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

  const isSubmitDisabled = !!errorMessage || (requestType === REQUEST_TYPE.TRANSACTION && isEstimating);

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

export default connect(combinedMapStateToProps)(WalletConnectCallRequestScreen);
