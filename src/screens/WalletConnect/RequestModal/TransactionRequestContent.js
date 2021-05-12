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
import { useTranslation } from 'translations/translate';

// Components
import Button from 'components/modern/Button';
import Text from 'components/modern/Text';
import Image from 'components/Image';
import LargeTokenValueView from 'components/modern/LargeTokenValueView';
import FeeLabel from 'components/modern/FeeLabel';

// Selectors
import { useRootSelector, supportedAssetsSelector } from 'selectors';
import { accountAssetsSelector } from 'selectors/assets';

// Hooks
import useWalletConnect from 'hooks/useWalletConnect';

// Utils
import { getAssetsAsList } from 'utils/assets';
import { useChainsConfig } from 'utils/uiConfig';
import { spacing } from 'utils/variables';
import { parsePeerName } from 'utils/walletConnect';

// Types
import { CHAIN } from 'models/Chain';
import type { WalletConnectCallRequest } from 'models/WalletConnect';

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

  const { title, iconUrl, chain, value, fee } = getViewData(request);
  const config = configs[chain];

  React.useEffect(() => {
    estimateCallRequestTransaction(request);
    console.log('EFFECT', request);
  }, [request, estimateCallRequestTransaction]);

  return (
    <>
      <Text color={config.color}>
        {title} {t('label.dotSeparator')} {config.titleShort}
      </Text>

      <Image source={{ uri: iconUrl }} style={styles.icon} />

      {value && <LargeTokenValueView value={value.value} symbol={value.symbol} style={styles.tokenValue} />}
      {fee && <FeeLabel value={fee.value} symbol={fee.symbol} style={styles.fee} />}

      <Button title={t('button.confirm')} onPress={onConfirm} style={styles.button} />
      <Button title={t('button.reject')} onPress={onReject} variant="text-destructive" style={styles.button} />
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
