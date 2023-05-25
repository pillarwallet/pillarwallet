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
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components/native';
import t from 'translations/translate';
import { Keyboard } from 'react-native';
import { isEmpty } from 'lodash';

// Components
import BottomModal from 'components/layout/BottomModal';
import Button from 'components/core/Button';
import Image from 'components/Image';
import Text from 'components/core/Text';

// Hooks
import useWalletConnect, { useWalletConnectAccounts } from 'hooks/useWalletConnect';
import { useDeploymentStatus } from 'hooks/deploymentStatus';

// Types
import type { WalletConnectConnector } from 'models/WalletConnect';
import type { Account } from 'models/Account';

// Utils
import { chainFromChainId, mapChainToChainId } from 'utils/chains';
import { spacing, fontStyles } from 'utils/variables';
import { useThemedImages } from 'utils/images';
import { parsePeerName, pickPeerIcon } from 'utils/walletConnect';
import { useChainsConfig } from 'utils/uiConfig';
import { getActiveAccount, findKeyBasedAccount, isEtherspotAccount } from 'utils/accounts';

// Constants
import { CHAIN } from 'constants/chainConstants';
import { ETHERSPOT } from 'constants/walletConstants';

// Selectors
import { useRootSelector } from 'selectors';

// Actions
import { switchAccountAction } from 'actions/accountsActions';
import { dismissSwitchAccountTooltipAction } from 'actions/appSettingsActions';

// Local
import WalletConnectSwitchNetwork from './WalletConnectSwitchNetwork';

type Props = {|
  connector: any,
  chainId: number,
  isV2WC?: ?boolean,
|};

function WalletConnectConnectorRequestModal({ isV2WC, connector, chainId }: Props) {
  const ref = React.useRef();
  const { genericToken } = useThemedImages();
  const chainsConfig = useChainsConfig();
  const dispatch = useDispatch();
  const chain = chainFromChainId[chainId] ?? CHAIN.ETHEREUM;
  const currentProposal = useRootSelector((root) => root.walletConnect.currentProposal);

  const accounts = useWalletConnectAccounts();
  const { isDeployedOnChain } = useDeploymentStatus();

  const keyBasedAccount: ?Account = findKeyBasedAccount(accounts);
  const activeAccount: ?Account = getActiveAccount(accounts);
  const isActiveEtherspotAccount = isEtherspotAccount(activeAccount);

  const [selectedChain, setSelectedChain] = React.useState(chain);
  const { title: chainName } = chainsConfig[selectedChain];

  // Note: this will map chain id to testnet in test env.
  const mappedChainId = mapChainToChainId(selectedChain);

  const { approveConnectorRequest, approveV2ConnectorRequest, rejectConnectorRequest, rejectV2ConnectorRequest } =
    useWalletConnect();
  const { app: appName, description, peerID, iconUrl } = getViewData(connector);

  const currentProposalInfo = React.useMemo(() => {
    if (isEmpty(currentProposal) || !isV2WC) return null;
    const {
      name: v2AppName,
      icons: v2AppIcons,
      description: v2Description,
    } = currentProposal?.params?.proposer?.metadata;
    const chains = currentProposal?.params?.requiredNamespaces?.eip155?.chains;

    return { v2AppName, v2AppIcons, v2Description, chains };
  }, [isV2WC, currentProposal]);

  useEffect(() => {
    if (activeAccount !== keyBasedAccount && appName === ETHERSPOT) {
      if (keyBasedAccount?.id) {
        dispatch(switchAccountAction(keyBasedAccount.id));
        dispatch(dismissSwitchAccountTooltipAction(false));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAccount, appName, keyBasedAccount]);

  const onApprovePress = () => {
    Keyboard.dismiss();
    if (isV2WC) {
      approveV2ConnectorRequest(connector?.id, connector?.namespaces);
    } else {
      approveConnectorRequest(peerID, mappedChainId);
    }
    ref.current?.close();
  };

  const onRejectPress = () => {
    Keyboard.dismiss();
    if (isV2WC) {
      rejectV2ConnectorRequest(connector?.id);
    } else {
      rejectConnectorRequest(peerID);
    }
    ref.current?.close();
  };

  return (
    <BottomModal
      ref={ref}
      title={t('walletConnectContent.title.walletConnectRequests', {
        app: isV2WC ? currentProposalInfo?.v2AppName : appName,
        chain: chainName,
      })}
      style={styles.title}
    >
      {(!!iconUrl || !isEmpty(currentProposalInfo?.v2AppIcons)) && (
        <Image
          key={isV2WC ? currentProposalInfo?.v2AppName : appName}
          source={{ uri: isV2WC ? currentProposalInfo?.v2AppIcons[0] : iconUrl }}
          style={styles.icon}
          fallbackSource={genericToken}
          resizeMode="contain"
        />
      )}

      {(!!description || !!currentProposalInfo?.v2Description) && (
        <Description>{isV2WC ? currentProposalInfo?.v2Description : description}</Description>
      )}

      <WalletConnectSwitchNetwork
        isV2WC={isV2WC}
        chain={chain}
        chains={currentProposalInfo?.chains}
        onChangeChain={setSelectedChain}
      />

      <Button
        disabled={isActiveEtherspotAccount ? !isDeployedOnChain[selectedChain] : false}
        title={t('button.approve')}
        size="large"
        onPress={onApprovePress}
      />
      <Button title={t('button.reject')} size="large" onPress={onRejectPress} variant="text" />
    </BottomModal>
  );
}

export default WalletConnectConnectorRequestModal;

const getViewData = (connector: WalletConnectConnector) => {
  const app = parsePeerName(connector.peerMeta?.name);
  const description = connector.peerMeta?.description;
  const peerID = connector.peerId;
  const iconUrl = pickPeerIcon(connector.peerMeta?.icons);
  return { app, peerID, description, iconUrl };
};

const styles = {
  icon: {
    width: 64,
    height: 64,
    marginTop: spacing.largePlus,
    marginBottom: spacing.largePlus,
    borderRadius: 32,
  },
  title: {
    textAlign: 'center',
  },
};

const Description = styled(Text)`
  text-align: center;
  margin-bottom: ${spacing.largePlus}px;
  color: ${({ theme }) => theme.colors.tertiaryText};
  ${fontStyles.medium};
`;
