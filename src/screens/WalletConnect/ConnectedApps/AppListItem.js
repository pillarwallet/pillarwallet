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
import { DeviceEventEmitter } from 'react-native';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';
import { useDispatch } from 'react-redux';

// Components
import Text from 'components/core/Text';
import Image from 'components/Image';
import Icon from 'components/core/Icon';
import Toast from 'components/Toast';
import ConnectedAppsMenu, { type itemProps } from 'components/Modals/ConnectedAppsModal/ConnectedAppsMenu';
import SwitchWalletModal from 'components/Modals/ConnectedAppsModal/SwitchWallet';
import SwitchNetworkModal from 'components/Modals/ConnectedAppsModal/SwitchNetwork';

// Hooks
import useWalletConnect, { useWalletConnectAccounts } from 'hooks/useWalletConnect';

// Actions
import { switchAccountAction } from 'actions/accountsActions';
import { updateSessionV2 } from 'actions/walletConnectActions';

// Utils
import { useThemeColors, getColorByTheme } from 'utils/themes';
import { spacing } from 'utils/variables';
import { mapChainToChainId, chainFromChainId } from 'utils/chains';

// Constants
import { WALLET_DROPDOWN_REF } from 'constants/walletConstants';

// Types
import type { Chain } from 'models/Chain';
import type { WalletConnectConnector, WalletConnectV2Session } from 'models/WalletConnect';
import { isEmpty } from 'lodash';

type Props = {|
  title: string,
  chain?: Chain,
  onPress?: () => void,
  iconUrl: ?string,
  connector: WalletConnectConnector,
  v2Session?: ?WalletConnectV2Session,
  rest?: any,
|};

function AppListItem({ title, iconUrl, onPress, v2Session, ...rest }: Props) {
  const colors = useThemeColors();
  const Dropdownref: any = React.useRef();
  const NetworkRef: any = React.useRef();
  const dispatch = useDispatch();
  const { t } = useTranslationWithPrefix('walletConnect.disconnectModal');
  const { connector } = rest;

  const v2SessionInfo = React.useMemo(() => {
    if (isEmpty(v2Session)) return null;
    const { namespaces, requiredNamespaces, topic } = v2Session;

    if (!namespaces || !requiredNamespaces) return null;

    const eipAccounts = Object.values(namespaces)?.[0];
    const eipChainIds = Object.values(requiredNamespaces)?.[0];

    if (isEmpty(eipAccounts) || isEmpty(eipChainIds)) return null;

    const accounts: string[] = eipAccounts?.accounts || [''];
    const v2ChainIds: string[] = eipChainIds?.chains || [''];

    const account = accounts[0].split(':')?.[2];
    const eip155ChainIds = v2ChainIds.map((eip155ChainId) => eip155ChainId.split(':')?.[1]);

    const v2Chains = eip155ChainIds.map((chainId) => chainFromChainId[Number(chainId)]);
    return { account, chains: v2Chains, topic };
  }, [v2Session]);

  const chain = v2SessionInfo ? v2SessionInfo?.chains[0] : chainFromChainId[connector.chainId];
  const walletData = useWalletConnectAccounts(v2SessionInfo ? v2SessionInfo?.account : connector.accounts[0]);

  const { updateConnectorSession, disconnectSessionByUrl, disconnectSessionV2ByTopic } = useWalletConnect();

  const [visibleModal, setVisibleModal] = React.useState(false);
  const [visibleNetworkSwitchModal, setVisibleNetworkSwitchModal] = React.useState(false);
  const [visibleWalletSwitchModal, setVisibleWalletSwitchModal] = React.useState(false);

  const onPressButton = () => {
    onPress && onPress();
    setVisibleModal(!visibleModal);
  };

  const onChangeNetwork = () => {
    setVisibleNetworkSwitchModal(!visibleNetworkSwitchModal);
  };

  React.useEffect(() => {
    DeviceEventEmitter.emit(WALLET_DROPDOWN_REF, Dropdownref);
  }, [Dropdownref, visibleModal, visibleWalletSwitchModal]);

  React.useEffect(() => {
    DeviceEventEmitter.emit(WALLET_DROPDOWN_REF, NetworkRef);
  }, [NetworkRef, visibleNetworkSwitchModal]);

  const onChangeChainSession = (updatedChain: Chain) => {
    const chainId = mapChainToChainId(updatedChain);
    if (v2Session) {
      dispatch(updateSessionV2(chainId, v2Session));
    } else {
      if (chainId === connector.chainId) return;
      updateConnectorSession(connector, { chainId, accounts: connector.accounts });
    }
  };

  const onChangeSessionAccount = (accountId: string) => {
    if (v2Session) return;
    dispatch(switchAccountAction(accountId));
    updateConnectorSession(connector, { chainId: 1, accounts: [accountId] });
  };

  const disconnect = async () => {
    if (v2SessionInfo) {
      disconnectSessionV2ByTopic(v2SessionInfo.topic);
      return;
    }

    const sessionUrl = connector?.peerMeta?.url;
    if (!sessionUrl) {
      Toast.show({
        message: t('toast.missingSessionUrl'),
        emoji: 'hushed',
        supportLink: true,
        autoClose: false,
      });
      setVisibleWalletSwitchModal(false);
      return;
    }

    disconnectSessionByUrl(sessionUrl);
    setVisibleWalletSwitchModal(false);
  };

  return (
    <Container>
      <Line />
      <TouchableContainer ref={Dropdownref} onPress={onPressButton}>
        <IconContainer>{!!iconUrl && <IconImage source={{ uri: iconUrl }} />}</IconContainer>

        <TitleContainer>
          <Text variant="medium" numberOfLines={1}>
            {title}
          </Text>
          <Text color={colors.secondaryText}>{walletData[0]?.label}</Text>
        </TitleContainer>

        <RightAddOn disabled={v2SessionInfo} ref={NetworkRef} onPress={onChangeNetwork}>
          {!v2SessionInfo && <Icon name={chain} width={16} />}
          {v2SessionInfo &&
            v2SessionInfo?.chains?.map((v2chain, index) => {
              return (
                <>
                  <Icon name={v2chain} width={16} />
                  {v2SessionInfo?.chains.length - 1 !== index && <VerticalLine />}
                </>
              );
            })}
        </RightAddOn>
      </TouchableContainer>
      <ConnectedAppsMenu
        isV2WC={!!v2SessionInfo}
        visible={visibleModal}
        onHide={setVisibleModal}
        onSelect={(item: itemProps) => {
          if (item.value === 'Switch wallet') setVisibleWalletSwitchModal(true);
          if (item.value === 'Switch network') setVisibleNetworkSwitchModal(true);
          if (item.value === 'Disconnect') disconnect();
        }}
      />
      <SwitchWalletModal
        visible={visibleWalletSwitchModal}
        onHide={setVisibleWalletSwitchModal}
        onChangeAccount={onChangeSessionAccount}
      />
      <SwitchNetworkModal
        account={walletData[0]}
        visible={visibleNetworkSwitchModal}
        onHide={setVisibleNetworkSwitchModal}
        dropDownStyle={{ right: 20 }}
        onChangeChain={onChangeChainSession}
      />
    </Container>
  );
}

export default AppListItem;

const Container = styled.View`
  width: 100%;
`;

const TouchableContainer = styled.TouchableOpacity`
  flex-direction: row;
  padding: 14px ${spacing.large}px;
  min-height: 64px;
`;

const Line = styled.View`
  width: 100%;
  border-top-width: 1px;
  border-color: ${({ theme }) => theme.colors.basic080};
`;

const VerticalLine = styled.View`
  width: 1;
  margin-horizontal: 6px;
  height: 60%;
  background-color: ${({ theme }) => theme.colors.basic080};
`;

const IconContainer = styled.View`
  justify-content: center;
  align-items: center;
  margin-right: ${spacing.medium}px;
  width: 48px;
`;

const IconImage = styled(Image)`
  width: 48px;
  height: 48px;
  border-radius: 24px;
`;

const TitleContainer = styled.View`
  flex: 1;
  justify-content: center;
`;

const RightAddOn = styled.TouchableOpacity`
  justify-content: center;
  margin-left: ${spacing.medium}px;
  flex-direction: row;
  align-items: center;
  padding: 0px 8px 0px 8px;
  height: 30px;
  border-radius: 10px;
  background-color: ${getColorByTheme({ lightKey: 'basic080', darkKey: 'basic040' })};
`;
