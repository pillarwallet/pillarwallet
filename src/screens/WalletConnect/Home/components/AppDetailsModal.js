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
import { type Chain, CHAIN } from 'models/Chain';
import type { WalletConnectApp } from 'models/WalletConnect';


type Props = {|
  app: WalletConnectApp,
|};

function AppDetailsModal({ app }: Props) {
  const { t } = useTranslationWithPrefix('walletConnect.home');
  const configs = useChainsConfig();
  const activeChains = useActiveChains();
  const inactiveChains = useInactiveChains();

  const connectOnChain = (chain: Chain) => {
    // TODO: implement actual connect logic
    // eslint-disable-next-line no-console, i18next/no-literal-string
    console.log('Connect on', chain);
  };

  const renderActiveItem = (chain: Chain) => {
    const config = configs[chain];
    return (
      <ActiveItem key={chain} color={config.color}>
        {t('connectedOnFormat', { title: config.title })}
      </ActiveItem>
    );
  };

  const renderInactiveItem = (chain: Chain) => {
    const config = configs[chain];
    return (
      <TouchableOpacity key={chain} onPress={() => connectOnChain(chain)}>
        <InactiveItem color={config.color}>{t('connectOnFormat', { title: config.title })}</InactiveItem>
      </TouchableOpacity>
    );
  };

  return (
    <BottomModal iconSource={{ uri: app.iconUrl }}>
      <Title>{app.title}</Title>

      {!!activeChains.length && <ActiveItemsContainer>{activeChains.map(renderActiveItem)}</ActiveItemsContainer>}

      <Description>
        Decentralized, community-run ecosystem built on top of Ethereum and other blockchains. The core products include
        an automated market-making (AMM), decentralized exchange (DEX), Decentralized Money Market (DMM), Yield
        Instruments, and Staking Derivatives.
      </Description>

      {!!inactiveChains.length && (
        <InactiveItemsContainer>{inactiveChains.map(renderInactiveItem)}</InactiveItemsContainer>
      )}
    </BottomModal>
  );
}

export default AppDetailsModal;

// TODO: replace with actual active chains for given app
const useActiveChains = () => {
  return [CHAIN.POLYGON];
};

// TODO: replace with actual active chains for given app
const useInactiveChains = () => {
  return [CHAIN.XDAI, CHAIN.BINANCE, CHAIN.ETHEREUM];
};

const Title = styled(Text)`
  font-family: ${appFont.medium};
  font-size: 20px;
`;

const ActiveItemsContainer = styled.View`
  align-items: center;
  margin: ${spacing.medium}px 0 10px;
`;

const ActiveItem = styled(Text)`
  padding: ${spacing.extraSmall}px 0;
`;

const Description = styled(Text)`
  margin-top: ${spacing.large}px;
  text-align: center;
  color: ${({ theme }) => theme.colors.secondaryText};
`;

const InactiveItemsContainer = styled.View`
  width: 100%;
  align-items: stretch;
  margin-top: ${spacing.large}px;
`;

const InactiveItem = styled(Text)`
  padding: ${spacing.medium}px 0;
  text-align: center;
  font-family: ${appFont.medium};
  ${fontStyles.big};
`;
