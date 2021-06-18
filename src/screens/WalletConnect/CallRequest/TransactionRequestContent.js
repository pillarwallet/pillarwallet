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
import styled from 'styled-components/native';
import { BigNumber } from 'bignumber.js';
import { useTranslation } from 'translations/translate';

// Components
import Button from 'components/modern/Button';
import FeeLabel from 'components/modern/FeeLabel';
import Image from 'components/Image';
import LargeTokenValueView from 'components/modern/LargeTokenValueView';
import Text from 'components/modern/Text';
import TransactionDeploymentWarning from 'components/other/TransactionDeploymentWarning';

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
import { spacing } from 'utils/variables';
import { parsePeerName, mapCallRequestToTransactionPayload } from 'utils/walletConnect';
import { isArchanovaAccount } from 'utils/accounts';
import { getGasSymbol } from 'utils/transactions';

// Types
import type { WalletConnectCallRequest } from 'models/WalletConnect';
import type { TransactionPayload } from 'models/Transaction';

type Props = {|
  request: WalletConnectCallRequest,
  onConfirm: (transactionPayload: TransactionPayload) => mixed,
  onReject: () => mixed,
|};

function TransactionRequestContent({ request, onConfirm, onReject }: Props) {
  const { t } = useTranslation();
  const chainConfigs = useChainsConfig();

  const { title, iconUrl, chain, errorMessage } = useViewData(request);
  const { fee, gasSymbol, hasNotEnoughGas, isEstimating, estimationErrorMessage } = useTransactionFee(request);
  const transactionPayload = useTransactionPayload(request);

  const handleConfirm = () => {
    if (!transactionPayload) return;
    onConfirm(transactionPayload);
  };

  const chainConfig = chainConfigs[chain];
  const value = wrapBigNumberOrNil(transactionPayload?.amount);
  const symbol = transactionPayload?.symbol;
  const confirmTitle = !hasNotEnoughGas ? t('button.confirm') : t('label.notEnoughGas');
  const isConfirmDisabled = isEstimating || hasNotEnoughGas || !!errorMessage;

  return (
    <>
      <Text color={chainConfig.color}>
        {title} {t('label.dotSeparator')} {chainConfig.titleShort}
      </Text>

      <Image source={{ uri: iconUrl }} style={styles.icon} />

      <LargeTokenValueView value={value} symbol={symbol} style={styles.tokenValue} />

      {!estimationErrorMessage && (
        <FeeLabel
          value={fee}
          symbol={gasSymbol}
          isLoading={isEstimating}
          isNotEnough={hasNotEnoughGas}
          style={styles.fee}
          chain={chain}
        />
      )}

      {!!errorMessage && <ErrorMessage variant="small">{errorMessage}</ErrorMessage>}

      {!isConfirmDisabled && <TransactionDeploymentWarning chain={chain} style={styles.transactionDeploymentWarning} />}

      <Button title={confirmTitle} onPress={handleConfirm} disabled={isConfirmDisabled} style={styles.button} />
      <Button title={t('button.reject')} onPress={onReject} variant="text-destructive" style={styles.button} />
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

  const { estimateCallRequestTransaction } = useWalletConnect();

  React.useEffect(() => estimateCallRequestTransaction(request), [request, estimateCallRequestTransaction]);

  return { fee, gasSymbol, hasNotEnoughGas, isEstimating, estimationErrorMessage };
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
  icon: {
    width: 64,
    height: 64,
    marginTop: spacing.largePlus,
    marginBottom: spacing.mediumLarge,
    borderRadius: 32,
  },
  tokenValue: {
    marginBottom: spacing.largePlus,
  },
  fee: {
    marginBottom: spacing.mediumLarge,
  },
  button: {
    marginVertical: spacing.small / 2,
  },
  transactionDeploymentWarning: {
    marginBottom: spacing.mediumLarge,
  },
};

const ErrorMessage = styled(Text)`
  margin: ${spacing.extraSmall}px 0 ${spacing.mediumLarge}px;
  text-align: center;
  color: ${({ theme }) => theme.colors.negative};
`;
