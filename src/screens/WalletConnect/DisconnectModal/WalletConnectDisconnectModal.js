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
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import BottomModal from 'components/modern/BottomModal';
import Button from 'components/modern/Button';
import Text from 'components/modern/Text';
import Image from 'components/Image';

// Utils
import { spacing } from 'utils/variables';
import { useChainsConfig } from 'utils/uiConfig';
import { parseWalletConnectAppName, parseWalletConnectAppIcon } from 'utils/walletConnect';

// Types
import { chainFromChainId } from 'models/Chain';
import type { WalletConnectConnector } from 'models/WalletConnect';

type Props = {|
  connector: WalletConnectConnector,
|};

function WalletConnectDisconnectModal({ connector }: Props) {
  const { t, tRoot } = useTranslationWithPrefix('walletConnect.disconnectModal');
  const configs = useChainsConfig();

  console.log("Disconnect", connector);

  const ref = React.useRef();

  const { app, chain, iconUrl } = getViewData(connector);

  const config = configs[chain];

  const confirmRequest = () => {
    // TODO: perform actual confirmation
    ref.current?.close();
  };

  const rejectRequest = () => {
    // TODO: perform actual rejection
    ref.current?.close();
  };

  return (
    <BottomModal ref={ref} title={t('title')}>
      <Text color={config.color} style={styles.summary}>
        {app} {tRoot('label.dotSeparator')} {config.titleShort}
      </Text>

      <Image source={{ uri: iconUrl }} style={styles.icon} />

      <Text style={styles.body}>{t('body', { app, chain: config.titleShort })}</Text>

      <Button title={t('disconnect')} onPress={confirmRequest} style={styles.button} />
      <Button title={tRoot('button.reject')} onPress={rejectRequest} variant="text" style={styles.button} />
    </BottomModal>
  );
}

export default WalletConnectDisconnectModal;

const getViewData = (connector: WalletConnectConnector) => {
  const app = parseWalletConnectAppName(connector.peerMeta?.name);
  const chain = chainFromChainId[connector.chainId];
  const iconUrl = parseWalletConnectAppIcon(connector.peerMeta?.icons);
  return { app, chain, iconUrl };
};

const styles = {
  summary: {
    textAlign: 'center',
  },
  icon: {
    width: 64,
    height: 64,
    marginVertical: spacing.largePlus,
    borderRadius: 32,
  },
  body: {
    textAlign: 'center',
    marginBottom: spacing.extraLarge,
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
