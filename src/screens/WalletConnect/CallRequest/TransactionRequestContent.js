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

  const balances = useRootSelector(accountBalancesSelector);
  const supportedAssets = useRootSelector(supportedAssetsSelector);
  const accountAssets = useRootSelector(accountAssetsSelector);
  const isActiveAccountDeployedOnEthereum = useRootSelector(isActiveAccountDeployedOnEthereumSelector);
  const feeInfo = useRootSelector((root) => root.transactionEstimate.feeInfo);
  const isEstimating = useRootSelector((root) => root.transactionEstimate.isEstimating);
  const estimateErrorMessage = useRootSelector((root) => root.transactionEstimate.errorMessage);

  React.useEffect(() => {
    estimateCallRequestTransaction(request);
    console.log('EFFECT', request);
  }, [request, estimateCallRequestTransaction]);

  const transactionPayload = React.useMemo(
    () => mapCallRequestToTransactionPayload(request, getAssetsAsList(accountAssets), supportedAssets),
    [request, accountAssets, supportedAssets],
  );

  const getErrorMessage = () => {
    if (!isActiveAccountDeployedOnEthereum) {
      return t('walletConnectContent.error.smartWalletNeedToBeActivated');
    }

    if (estimateErrorMessage) {
      return estimateErrorMessage;
    }

    if (!transactionPayload && !isEstimating) {
      return t('walletConnectContent.error.unableToShowTransaction');
    }

    return null;
  };

  const handleConfirm = () => {
    if (!transactionPayload) return;
    onConfirm(transactionPayload);
  };

  const { amount, symbol, decimals } = transactionPayload ?? {};
  const hasNotEnoughtGas = !isEnoughBalanceForTransactionFee(balances, {
    amount,
    symbol,
    decimals,
    txFeeInWei: feeInfo?.fee,
    gasToken: feeInfo?.gasToken,
  });

  const errorMessage = getErrorMessage();

  const { title, iconUrl, chain } = getViewData(request);
  const config = configs[chain];

  const feeValue = BigNumber(getFormattedTransactionFeeValue(feeInfo?.fee ?? '', feeInfo?.gasToken)) || null;
  const feeSymbol = feeInfo?.gasToken?.symbol || ETH;

  console.log("FEE", feeInfo);

  const confirmTitle = !hasNotEnoughtGas ? t('button.confirm') : t('button.notEnoughGas');
  const isConfirmDisabled = isEstimating || hasNotEnoughtGas || !!errorMessage;

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

      <Button title={confirmTitle} onPress={handleConfirm} disabled={isConfirmDisabled} style={styles.button} />
      <Button title={t('button.reject')} onPress={onReject} variant="text-destructive" style={styles.button} />
    </>
  );
}

export default TransactionRequestContent;

const getViewData = (request: WalletConnectCallRequest) => {
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
