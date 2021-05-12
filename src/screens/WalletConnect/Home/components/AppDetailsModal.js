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
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import BottomModal from 'components/modern/BottomModal';
import Text from 'components/modern/Text';

// Utils
import { useChainsConfig } from 'utils/uiConfig';
import { appFont, fontStyles, spacing } from 'utils/variables';

// Types
import type { Chain } from 'models/Chain';
import type { WalletConnectApp } from 'models/WalletConnect';

type Props = {|
  app: WalletConnectApp,
|};

function AppDetailsModal({ app }: Props) {
  const { t } = useTranslationWithPrefix('walletConnect.home');
  const configs = useChainsConfig();

  const connectedChains = useConnectedChains();
  const availableChains = useAvailableChains(app);

  const connectOnChain = (chain: Chain) => {
    // TODO: implement actual connect logic
    // eslint-disable-next-line no-console, i18next/no-literal-string
    console.log('Connect on', chain);
  };

  const renderConnectedItem = (chain: Chain) => {
    const config = configs[chain];
    return (
      <ConnectedItem key={chain} color={config.color}>
        {t('connectedOnFormat', { title: config.title })}
      </ConnectedItem>
    );
  };

  const renderAvailableItem = (chain: Chain) => {
    const config = configs[chain];
    return (
      <TouchableOpacity key={chain} onPress={() => connectOnChain(chain)}>
        <AvailableItem color={config.color}>{t('connectOnFormat', { title: config.title })}</AvailableItem>
      </TouchableOpacity>
    );
  };

  return (
    <BottomModal iconSource={{ uri: app.iconUrl }}>
      <Title>{app.title}</Title>

      {!!connectedChains.length && (
        <ConnectedItemsContainer>{connectedChains.map(renderConnectedItem)}</ConnectedItemsContainer>
      )}

      {!!app.description && <Description>{app.description}</Description>}

      {!!availableChains.length && (
        <AvailableItemsContainer>{availableChains.map(renderAvailableItem)}</AvailableItemsContainer>
      )}
    </BottomModal>
  );
}

export default AppDetailsModal;

// TODO: replace with actual connected chains for given app
const useConnectedChains = () => {
  return [];
};

// TODO: replace with actual avilable chains for given app
const useAvailableChains = (app: WalletConnectApp) => {
  return app.chains;
};

const Title = styled(Text)`
  font-family: ${appFont.medium};
  font-size: 20px;
`;

const ConnectedItemsContainer = styled.View`
  align-items: center;
  margin: ${spacing.medium}px 0 10px;
`;

const ConnectedItem = styled(Text)`
  padding: ${spacing.extraSmall}px 0;
`;

const Description = styled(Text)`
  margin-top: ${spacing.large}px;
  text-align: center;
  color: ${({ theme }) => theme.colors.secondaryText};
`;

const AvailableItemsContainer = styled.View`
  width: 100%;
  align-items: stretch;
  margin-top: ${spacing.large}px;
`;

const AvailableItem = styled(Text)`
  padding: ${spacing.medium}px 0;
  text-align: center;
  font-family: ${appFont.medium};
  ${fontStyles.big};
`;
