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
import { useTranslation } from 'translations/translate';
import { BigNumber } from 'bignumber.js';

// Components
import Button from 'components/modern/Button';
import Text from 'components/modern/Text';
import Image from 'components/Image';
import LargeTokenValueView from 'components/modern/LargeTokenValueView';
import FeeLabel from 'components/modern/FeeLabel';
import { Paragraph } from 'components/Typography';

// Constants
import { ETH } from 'constants/assetsConstants';

// Selectors
import { useRootSelector, supportedAssetsSelector } from 'selectors';
import { accountAssetsSelector } from 'selectors/assets';
import { accountBalancesSelector } from 'selectors/balances';
import { isActiveAccountDeployedOnEthereumSelector } from 'selectors/chains';

// Hooks
import useWalletConnect from 'hooks/useWalletConnect';

// Utils
import { getAssetsAsList, isEnoughBalanceForTransactionFee } from 'utils/assets';
import { getFormattedTransactionFeeValue } from 'utils/common';
import { themedColors } from 'utils/themes';
import { useChainsConfig } from 'utils/uiConfig';
import { spacing } from 'utils/variables';
import { parsePeerName, mapCallRequestToTransactionPayload } from 'utils/walletConnect';

// Types
import { CHAIN } from 'models/Chain';
import type { WalletConnectCallRequest } from 'models/WalletConnect';

// types
import type { TransactionPayload } from 'models/Transaction';

type Props = {|
  request: WalletConnectCallRequest,
  onConfirm: (transactionPayload: TransactionPayload) => mixed,
  onReject: () => mixed,
|};

function TransactionRequestContent({ request, onConfirm, onReject }: Props) {
  const { t } = useTranslation();
  const configs = useChainsConfig();

  const { estimateCallRequestTransaction } = useWalletConnect();
  const supportedAssets = useRootSelector(supportedAssetsSelector);
  const accountAssets = useRootSelector(accountAssetsSelector);

  const isEstimating = useRootSelector((root) => root.transactionEstimate.isEstimating);
  const feeInfo = useRootSelector((root) => root.transactionEstimate.feeInfo);
  const estimateErrorMessage = useRootSelector((root) => root.transactionEstimate.errorMessage);

  const balances = useRootSelector(accountBalancesSelector);
  const isActiveAccountDeployedOnEthereum = useRootSelector(isActiveAccountDeployedOnEthereumSelector);

  React.useEffect(() => {
    estimateCallRequestTransaction(request);
    console.log('EFFECT', request);
  }, [request, estimateCallRequestTransaction]);

  const transactionPayload: TransactionPayload | null = React.useMemo(
    () => mapCallRequestToTransactionPayload(request, getAssetsAsList(accountAssets), supportedAssets),
    [request, accountAssets, supportedAssets],
  );

  const handleConfirm = () => {
    if (!transactionPayload) return;

    onConfirm(transactionPayload);
  };

  const errorMessage: string | null = React.useMemo(() => {
    if (!isActiveAccountDeployedOnEthereum) {
      return t('walletConnectContent.error.smartWalletNeedToBeActivated');
    }

    if (estimateErrorMessage) {
      return estimateErrorMessage;
    }

    if (!isEstimating && !transactionPayload) {
      return t('walletConnectContent.error.unableToShowTransaction');
    }

    if (transactionPayload && feeInfo) {
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
    isActiveAccountDeployedOnEthereum,
    transactionPayload,
    isEstimating,
    estimateErrorMessage,
    feeInfo,
    balances,
    t,
  ]);

  const { title, iconUrl, chain } = getViewData(request);
  const config = configs[chain];

  const isSubmitDisabled = !!errorMessage || isEstimating;

  const { amount, symbol } = transactionPayload ?? {};

  const feeSymbol = feeInfo?.gasToken?.symbol || ETH;
  const feeValue = BigNumber(getFormattedTransactionFeeValue(feeInfo?.fee ?? '', feeInfo?.gasToken)) || null;

  console.log("FEE", feeInfo);

  return (
    <>
      <Text color={config.color}>
        {title} {t('label.dotSeparator')} {config.titleShort}
      </Text>

      <Image source={{ uri: iconUrl }} style={styles.icon} />

      <LargeTokenValueView value={BigNumber(amount)} symbol={symbol} style={styles.tokenValue} />

      {!estimateErrorMessage && (
        <FeeLabel value={feeValue} symbol={feeSymbol} style={styles.fee} isLoading={isEstimating} />
      )}

      {!!errorMessage && <WarningMessage small>{errorMessage}</WarningMessage>}

      <Button title={t('button.confirm')} onPress={handleConfirm} disabled={isSubmitDisabled} style={styles.button} />
      <Button title={t('button.reject')} onPress={onReject} variant="text-destructive" style={styles.button} />
    </>
  );
}

export default TransactionRequestContent;

const getViewData = (request: WalletConnectCallRequest) => {
  console.log('CALL REQUEST', request);
  const title = parsePeerName(request.name);
  const iconUrl = request.icon;
  const chain = CHAIN.ETHEREUM;

  return { title, iconUrl, chain };
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

const WarningMessage = styled(Paragraph)`
  text-align: center;
  color: ${themedColors.negative};
  padding-bottom: ${spacing.rhythm}px;
`;
