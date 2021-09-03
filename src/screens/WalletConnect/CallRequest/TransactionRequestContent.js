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
import { View } from 'react-native';
import SwipeButton from 'rn-swipe-button';
import styled, { useTheme } from 'styled-components/native';
import { BigNumber } from 'bignumber.js';
import { useTranslation } from 'translations/translate';

// Components
import Button from 'components/modern/Button';
import FeeLabel from 'components/modern/FeeLabel';
import Image from 'components/Image';
import LargeFiatTokenValueView from 'components/modern/LargeFiatTokenValueView';
import Text from 'components/modern/Text';
import TransactionDeploymentWarning from 'components/other/TransactionDeploymentWarning';
import Icon from 'components/modern/Icon';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Selectors
import {
  useRootSelector,
  supportedAssetsPerChainSelector,
  useActiveAccount,
} from 'selectors';
import { accountAssetsPerChainSelector } from 'selectors/assets';
import { accountAssetsBalancesSelector } from 'selectors/balances';
import { isArchanovaAccountDeployedSelector } from 'selectors/archanova';

// Hooks
import useWalletConnect from 'hooks/useWalletConnect';

// Utils
import { isEnoughBalanceForTransactionFee } from 'utils/assets';
import { wrapBigNumberOrNil } from 'utils/bigNumber';
import { chainFromChainId } from 'utils/chains';
import { getFormattedTransactionFeeValue } from 'utils/common';
import { useChainsConfig } from 'utils/uiConfig';
import { fontSizes, spacing, appFont } from 'utils/variables';
import { parsePeerName, mapCallRequestToTransactionPayload } from 'utils/walletConnect';
import { isArchanovaAccount } from 'utils/accounts';
import { getGasAddress, getGasSymbol } from 'utils/transactions';
import { getThemeColors } from 'utils/themes';

// Types
import type { WalletConnectCallRequest } from 'models/WalletConnect';
import type { TransactionPayload } from 'models/Transaction';

type Props = {|
  request: WalletConnectCallRequest,
  onConfirm: (transactionPayload: TransactionPayload) => mixed,
  onReject: () => mixed,
|};

const SwiperIconComponent = () => {
  return (
    <View style={styles.swiperView}>
      <Icon name="arrow-right" />
    </View>
  );
};

function TransactionRequestContent({ request, onConfirm, onReject }: Props) {
  const { t } = useTranslation();
  const chainConfigs = useChainsConfig();
  const theme = useTheme();
  const colors = getThemeColors(theme);

  const { iconUrl, chain, errorMessage } = useViewData(request);
  const {
    fee,
    gasSymbol,
    gasAddress,
    hasNotEnoughGas,
    isEstimating,
    estimationErrorMessage,
  } = useTransactionFee(request);
  const transactionPayload = useTransactionPayload(request);

  const handleConfirm = () => {
    if (!transactionPayload) return;
    onConfirm(transactionPayload);
  };

  const chainConfig = chainConfigs[chain];
  const value = wrapBigNumberOrNil(transactionPayload?.amount);
  const symbol = transactionPayload?.symbol;
  const assetAddress = transactionPayload?.contractAddress;
  const confirmTitle = !hasNotEnoughGas ? t('button.swipeConfirm') : t('label.notEnoughGas');
  const isConfirmDisabled = isEstimating || hasNotEnoughGas || !!errorMessage;

  return (
    <>
      <IconView>
        <Icon name={chainConfig.iconName} width={64} height={64} style={styles.chainIcon} />
        <ServiceIcon source={{ uri: iconUrl }} />
      </IconView>

      <Text color={colors.secondaryText} style={styles.body}>
        {t('walletConnect.requests.transactionRequest')}
      </Text>

      <LargeFiatTokenValueView
        value={value}
        assetAddress={assetAddress}
        chain={chain}
        symbol={symbol}
        style={styles.tokenValue}
      />

      {!isConfirmDisabled && <TransactionDeploymentWarning chain={chain} style={styles.transactionDeploymentWarning} />}

      {!estimationErrorMessage && (
        <FeeView>
          <FeeLabel
            value={fee}
            assetSymbol={gasSymbol}
            assetAddress={gasAddress}
            isLoading={isEstimating}
            isNotEnough={hasNotEnoughGas}
            chain={chain}
            mode="actual"
          />
          <Icon name="info" width={16} height={16} color={colors.buttonTextTitle} style={styles.infoIcon} />
        </FeeView>
      )}

      {!!errorMessage && <ErrorMessage variant="small">{errorMessage}</ErrorMessage>}

      {!isConfirmDisabled ? (
        <SwipeButton
          width="100%"
          height={72}
          title={confirmTitle}
          titleFontSize={fontSizes.medium}
          titleColor={colors.buttonPrimaryTitle}
          titleStyles={styles.swiperButtonTitle}
          containerStyles={styles.swiperButtonContainer}
          railBorderColor={colors.swiperButtonTrack}
          railBackgroundColor={colors.swiperButtonTrack}
          railFillBackgroundColor="transparent"
          railFillBorderColor={colors.swiperButtonTrack}
          thumbIconComponent={SwiperIconComponent}
          thumbIconWidth={84}
          thumbIconBackgroundColor={colors.swiperButtonThumb}
          thumbIconBorderColor={colors.swiperButtonThumb}
          thumbIconStyles={styles.swiperBtnthumbIcon}
          onSwipeSuccess={handleConfirm}
        />
      ) : (
        <Button title={confirmTitle} disabled size="large" />
      )}
      <Button
        title={t('button.reject')}
        size="large"
        onPress={onReject}
        variant="text"
        style={styles.buttonStyle}
      />
    </>
  );
}

export default TransactionRequestContent;

const useTransactionPayload = (request: WalletConnectCallRequest) => {
  const supportedAssets = useRootSelector(supportedAssetsPerChainSelector);
  const accountAssets = useRootSelector(accountAssetsPerChainSelector);

  const transactionPayload = React.useMemo(
    () => mapCallRequestToTransactionPayload(request, accountAssets, supportedAssets),
    [request, accountAssets, supportedAssets],
  );

  return transactionPayload;
};

const useTransactionFee = (request: WalletConnectCallRequest) => {
  const { t } = useTranslation();
  const feeInfo = useRootSelector((root) => root.transactionEstimate.feeInfo);
  const isEstimating = useRootSelector((root) => root.transactionEstimate.isEstimating);
  let estimationErrorMessage = useRootSelector((root) => root.transactionEstimate.errorMessage);

  const chain = chainFromChainId[request.chainId];
  if (!chain && !estimationErrorMessage) {
    estimationErrorMessage = t('error.walletConnect.cannotDetermineEthereumChain');
  }

  const txFeeInWei = feeInfo?.fee;
  const fee = BigNumber(getFormattedTransactionFeeValue(chain, txFeeInWei, feeInfo?.gasToken)) || null;
  const gasSymbol = getGasSymbol(chain, feeInfo?.gasToken);
  const gasAddress = getGasAddress(chain, feeInfo?.gasToken);

  const accountAssetsBalances = useRootSelector(accountAssetsBalancesSelector);
  const walletBalances = accountAssetsBalances[chain]?.wallet ?? {};

  const { amount, symbol, decimals } = useTransactionPayload(request);

  const balanceCheckTransaction = {
    amount,
    symbol,
    decimals,
    txFeeInWei,
    gasToken: feeInfo?.gasToken,
  };
  const hasNotEnoughGas = !isEnoughBalanceForTransactionFee(walletBalances, balanceCheckTransaction, chain);

  const { estimateCallRequestTransaction, callRequests } = useWalletConnect();

  React.useEffect(() => {
    // perform additional check to avoid estimate on request dismiss
    const requestExists = callRequests.some(({ callId }) => callId === request.callId);
    if (!requestExists) return;

    estimateCallRequestTransaction(request);
  }, [request, estimateCallRequestTransaction, callRequests]);

  return {
    fee,
    gasSymbol,
    gasAddress,
    hasNotEnoughGas,
    isEstimating,
    estimationErrorMessage,
  };
};

const useViewData = (request: WalletConnectCallRequest) => {
  const { t } = useTranslation();
  const activeAccount = useActiveAccount();
  const isArchanovaAccountDeployed = useRootSelector(isArchanovaAccountDeployedSelector);

  const isArchanovaAccountActive = isArchanovaAccount(activeAccount);

  let errorMessage = null;
  const chain = chainFromChainId[request.chainId];
  if (!chain) {
    errorMessage = t('error.walletConnect.cannotDetermineEthereumChain');
  }

  if (isArchanovaAccountActive && chain !== CHAIN.ETHEREUM) {
    errorMessage = t('error.walletConnect.activeAccountDoesNotSupportSelectedChain');
  }

  const estimationErrorMessage = useRootSelector((root) => root.transactionEstimate.errorMessage);

  /**
   * Archanova account needs to be deployed for all types call requests.
   * Etherspot account doesn't need to be deployed for transaction type call requests only.
   */
  const requiresDeployedAccount = isArchanovaAccountActive && !isArchanovaAccountDeployed;

  if (!errorMessage) {
    errorMessage = requiresDeployedAccount
      ? t('walletConnectContent.error.smartWalletNeedToBeActivated')
      : estimationErrorMessage;
  }

  const title = parsePeerName(request.name);
  const iconUrl = request.icon;

  return { title, iconUrl, chain, errorMessage };
};

const styles = {
  chainIcon: {
    position: 'absolute',
    marginTop: 6,
  },
  body: {
    marginTop: spacing.largePlus,
    fontSize: fontSizes.medium,
  },
  tokenValue: {
    marginTop: spacing.small,
  },
  fee: {
    fontSize: fontSizes.regular,
  },
  infoIcon: {
    justifyContent: 'center',
    paddingLeft: spacing.medium,
  },
  transactionDeploymentWarning: {
    marginTop: spacing.mediumLarge,
  },
  swiperView: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  swiperButtonTitle: {
    paddingLeft: spacing.extraPlusLarge,
    fontFamily: appFont.medium,
  },
  swiperButtonContainer: {
    borderRadius: 14,
  },
  swiperBtnthumbIcon: {
    borderRadius: 12,
  },
  buttonStyle: {
    marginTop: spacing.mediumLarge,
  },
};

const ErrorMessage = styled(Text)`
  margin: ${spacing.extraSmall}px 0 ${spacing.mediumLarge}px;
  text-align: center;
  color: ${({ theme }) => theme.colors.negative};
`;

const IconView = styled.View`
  margin-top: ${spacing.largePlus}px;
  text-align: center;
  flexDirection: row;
`;

const ServiceIcon = styled(Image)`
  width: 76px;
  height: 76px;
  border-radius: 39px;
  margin-left: -48px;
  borderWidth: 6px;
  borderColor: ${({ theme }) => theme.colors.basic050};
  overflow: hidden;
`;

const FeeView = styled.View`
  flex-direction: row;
  margin-top: ${spacing.largePlus}px;
  margin-bottom: ${spacing.large}px;
`;
