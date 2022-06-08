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
import BottomModal from 'components/layout/BottomModal';
import Button from 'components/core/Button';
import Image from 'components/Image';
import Toast from 'components/Toast';
import Text from 'components/core/Text';

// Hooks
import useWalletConnect from 'hooks/useWalletConnect';

// Utils
import { chainFromChainId } from 'utils/chains';
import { spacing } from 'utils/variables';
import { useChainsConfig } from 'utils/uiConfig';
import { parsePeerName, pickPeerIcon } from 'utils/walletConnect';

// Types
import type { WalletConnectConnector } from 'models/WalletConnect';

type Props = {|
  connector: WalletConnectConnector,
|};

function WalletConnectDisconnectModal({ connector }: Props) {
  const { t, tRoot } = useTranslationWithPrefix('walletConnect.disconnectModal');
  const configs = useChainsConfig();

  const ref = React.useRef();

  const { disconnectSessionByUrl } = useWalletConnect();

  const disconnect = () => {
    const sessionUrl = connector.peerMeta?.url;
    if (!sessionUrl) {
      Toast.show({
        message: t('toast.missingSessionUrl'),
        emoji: 'hushed',
        supportLink: true,
        autoClose: false,
      });
      return;
    }

    disconnectSessionByUrl(sessionUrl);
    ref.current?.close();
  };

  const close = () => {
    ref.current?.close();
  };

  const { app, chain, iconUrl }: any = getViewData(connector);
  const config = configs[chain];

  return (
    <BottomModal ref={ref} title={t('title')} variant="destructive">
      <Text color={config.color} style={styles.summary}>
        {app} {tRoot('label.dotSeparator')} {config.titleShort}
      </Text>

      <Image source={{ uri: iconUrl }} style={styles.icon} />

      <Text style={styles.body}>{t('body', { app, chain: config.title })}</Text>

      <Button title={t('disconnect')} onPress={disconnect} style={styles.button} variant="destructive" />
      <Button title={tRoot('button.cancel')} onPress={close} variant="text" style={styles.button} />
    </BottomModal>
  );
}

export default WalletConnectDisconnectModal;

const getViewData = (connector: WalletConnectConnector) => {
  const app = parsePeerName(connector.peerMeta?.name);
  const chain = chainFromChainId[connector.chainId];
  const iconUrl = pickPeerIcon(connector.peerMeta?.icons);
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
