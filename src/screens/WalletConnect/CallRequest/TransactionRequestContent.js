// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';
import { BigNumber } from 'bignumber.js';

// Components
import Button from 'components/modern/Button';
import Text from 'components/modern/Text';
import Image from 'components/Image';
import LargeTokenValueView from 'components/modern/LargeTokenValueView';
import FeeLabel from 'components/modern/FeeLabel';
import { Footer, ScrollWrapper } from 'components/Layout';
import { Label, Paragraph, MediumText } from 'components/Typography';
import Spinner from 'components/Spinner';
import Toast from 'components/Toast';

// Constants
import { ETH } from 'constants/assetsConstants';
import { REQUEST_TYPE } from 'constants/walletConnectConstants';
import { WALLETCONNECT_PIN_CONFIRM_SCREEN } from 'constants/navigationConstants';

// Selectors
import { useRootSelector, activeAccountSelector, supportedAssetsSelector } from 'selectors';
import { accountAssetsSelector } from 'selectors/assets';
import { accountBalancesSelector } from 'selectors/balances';
import { isActiveAccountDeployedOnEthereumSelector } from 'selectors/chains';

// Hooks
import useWalletConnect from 'hooks/useWalletConnect';

// Utils
import { getAssetsAsList, isEnoughBalanceForTransactionFee } from 'utils/assets';
import { formatTransactionFee, getFormattedTransactionFeeValue } from 'utils/common';
import { useThemedImages } from 'utils/images';
import { themedColors, useThemeColors } from 'utils/themes';
import { useChainsConfig } from 'utils/uiConfig';
import { spacing, fontSizes, fontStyles } from 'utils/variables';
import {
  parsePeerName,
  getWalletConnectCallRequestType,
  mapCallRequestToTransactionPayload,
  parseMessageSignParamsFromCallRequest,
} from 'utils/walletConnect';

// Types
import { CHAIN } from 'models/Chain';
import type { WalletConnectCallRequest } from 'models/WalletConnect';

// types
import type { Asset } from 'models/Asset';
import type { TransactionPayload } from 'models/Transaction';

type Props = {|
  request: WalletConnectCallRequest,
  onConfirm: () => mixed,
  onReject: () => mixed,
|};

function TransactionRequestContent({ request, onConfirm, onReject }: Props) {
  const { t } = useTranslation();
  const configs = useChainsConfig();

  const { estimateCallRequestTransaction } = useWalletConnect();
  const supportedAssets = useRootSelector(supportedAssetsSelector);
  const accountAssets = useRootSelector(accountAssetsSelector);

  const { title, iconUrl, chain } = getViewData(request);
  const config = configs[chain];

  const callRequest = request;
  const requestType = REQUEST_TYPE.TRANSACTION;

  const isEstimating = useRootSelector((root) => root.transactionEstimate.isEstimating);
  const feeInfo = useRootSelector((root) => root.transactionEstimate.feeInfo);
  const estimateErrorMessage = useRootSelector((root) => root.transactionEstimate.errorMessage);

  const balances = useRootSelector(accountBalancesSelector);
  const isActiveAccountDeployedOnEthereum = useRootSelector(isActiveAccountDeployedOnEthereumSelector);
  const activeAccount = useRootSelector(activeAccountSelector);

  React.useEffect(() => {
    estimateCallRequestTransaction(request);
    console.log('EFFECT', request);
  }, [request, estimateCallRequestTransaction]);

  const navigation = useNavigation();
  const { rejectCallRequest } = useWalletConnect();

  React.useEffect(() => {
    if (requestType !== REQUEST_TYPE.TRANSACTION) return;
    estimateCallRequestTransaction(callRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const colors = useThemeColors();
  const { genericToken } = useThemedImages();

  const transactionPayload: TransactionPayload | null = React.useMemo(() => {
    if (requestType !== REQUEST_TYPE.TRANSACTION) return null;
    return mapCallRequestToTransactionPayload(callRequest, getAssetsAsList(accountAssets), supportedAssets);
  }, [callRequest, accountAssets, supportedAssets, requestType]);

  const errorMessage: string | null = React.useMemo(() => {
    if (requestType === REQUEST_TYPE.UNSUPPORTED) {
      return t('walletConnectContent.error.unsupportedRequestCallRequestType');
    }

    if (!isActiveAccountDeployedOnEthereum) {
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
      if (
        !isEnoughBalanceForTransactionFee(balances, {
          amount,
          symbol,
          decimals,
          txFeeInWei: feeInfo?.fee,
          gasToken: feeInfo?.gasToken,
        })
      ) {
        return t('error.notEnoughTokenForFee', { token: feeInfo.gasToken || ETH });
      }
    }

    return null;
  }, [
    requestType,
    isActiveAccountDeployedOnEthereum,
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
            <LabelSub>{t('walletConnectContent.paragraph.finalFeeMightBeHigher')}</LabelSub>
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

  const { amount, symbol, decimals } = transactionPayload ?? {};

  const feeSymbol = feeInfo?.gasToken || ETH;
  const feeValue = BigNumber(getFormattedTransactionFeeValue(feeInfo?.fee, feeInfo?.gasToken));

  console.log("FEE", feeInfo);

  return (
    <>
      <Text color={config.color}>
        {title} {t('label.dotSeparator')} {config.titleShort}
      </Text>

      <Image source={{ uri: iconUrl }} style={styles.icon} />

      {<LargeTokenValueView value={BigNumber(amount)} symbol={symbol} style={styles.tokenValue} />}
      {<FeeLabel value={feeValue} symbol={feeSymbol} style={styles.fee} />}

      <Button title={t('button.confirm')} onPress={onConfirm} style={styles.button} />
      <Button title={t('button.reject')} onPress={onReject} variant="text-destructive" style={styles.button} />

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
              title={t([
                `walletConnectContent.button.approveType.${requestType}`,
                'walletConnectContent.button.approveType.default',
              ])}
            />
          )}
          <OptionButton danger transparent onPress={onRejectPress} title={t('button.reject')} />
        </FooterWrapper>
      </Footer>
    </>
  );
}

export default TransactionRequestContent;

const getViewData = (callRequest: WalletConnectCallRequest) => {
  console.log('CALL REQUEST', callRequest);
  const title = parsePeerName(callRequest.name);
  const iconUrl = callRequest.icon;
  const chain = CHAIN.ETHEREUM;

  return { title, iconUrl, chain };
};

const getTransactionPayload = (request: WalletConnectCallRequest, accountAssets: Asset[], supportedAssets: Asset[]) => {
  const type = getWalletConnectCallRequestType(request);
  if (type !== REQUEST_TYPE.TRANSACTION) return null;

  return mapCallRequestToTransactionPayload(request, accountAssets, supportedAssets);
};

const styles = {
  icon: {
    width: 64,
    height: 64,
    marginVertical: spacing.largePlus,
    borderRadius: 32,
  },
  tokenValue: {
    marginBottom: spacing.largePlus,
  },
  fee: {
    marginBottom: spacing.medium,
  },
  button: {
    marginVertical: spacing.small / 2,
  },
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
