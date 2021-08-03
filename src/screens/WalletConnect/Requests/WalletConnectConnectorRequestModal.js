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
import t from 'translations/translate';
import { Keyboard } from 'react-native';

// Components
import BottomModal from 'components/modern/BottomModal';
import Button from 'components/modern/Button';
import Image from 'components/Image';
import Text from 'components/modern/Text';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Hooks
import useWalletConnect from 'hooks/useWalletConnect';

// Types
import type { WalletConnectConnector } from 'models/WalletConnect';

// Utils
import { chainFromChainId, mapChainToChainId } from 'utils/chains';
import { spacing, fontStyles, fontSizes } from 'utils/variables';
import { useThemedImages } from 'utils/images';
import { parsePeerName, pickPeerIcon } from 'utils/walletConnect';

type Props = {|
  connector: WalletConnectConnector,
|};

function WalletConnectDisconnectModal({ connector }: Props) {
  const ref = React.useRef();
  const { genericToken } = useThemedImages();
  const { approveConnectorRequest, rejectConnectorRequest } = useWalletConnect();
  const { app: appName, peerID, chain, iconUrl } = getViewData(connector);

  // Note: this will map chain id to testnet in test env.
  const chainId = mapChainToChainId(chain);

  const onApprovePress = () => {
    Keyboard.dismiss();
    approveConnectorRequest(peerID, chainId);
    ref.current?.close();
  };

  const onRejectPress = () => {
    Keyboard.dismiss();
    rejectConnectorRequest(peerID);
    ref.current?.close();
  };

  return (
    <BottomModal
      ref={ref}
      title={t('walletConnectContent.title.walletConnectRequests', { app: appName })}
      titleStyle={styles.title}
    >
      {!!iconUrl && (
        <Image
          key={appName}
          source={{ uri: iconUrl }}
          style={styles.icon}
          fallbackSource={genericToken}
          resizeMode="contain"
        />
      )}

      <Description>{t('walletConnectContent.title.description')}</Description>

      <Button title={t('button.approve')} onPress={onApprovePress} style={styles.button} />
      <Button title={t('button.reject')} onPress={onRejectPress} variant="text" style={styles.button} />
    </BottomModal>
  );
}

export default WalletConnectDisconnectModal;

const getViewData = (connector: WalletConnectConnector) => {
  const app = parsePeerName(connector.peerMeta?.name);
  const peerID = connector.peerId;
  const chain = chainFromChainId[connector.chainId] ?? CHAIN.ETHEREUM;
  const iconUrl = pickPeerIcon(connector.peerMeta?.icons);
  return { app, peerID, chain, iconUrl };
};

const styles = {
  title: {
    fontSize: fontSizes.big,
  },
  icon: {
    width: 64,
    height: 64,
    marginTop: spacing.large,
    marginBottom: spacing.extraLarge,
    borderRadius: 32,
  },
  button: {
    height: 72,
    borderRadius: 14,
  },
};

const Description = styled(Text)`
 text-align: center;
 margin-bottom: ${spacing.extraLarge}px;
 color: ${({ theme }) => theme.colors.walletConnectRequestBody};
 ${fontStyles.medium};
`;
