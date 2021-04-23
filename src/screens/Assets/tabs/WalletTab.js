// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

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
import { useNavigation } from 'react-navigation-hooks';
import { SectionList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import AddFundsModal from 'components/AddFundsModal';
import AssetListItem from 'components/modern/AssetListItem';
import BalanceView from 'components/BalanceView';
import FloatingButtons from 'components/FloatingButtons';
import Modal from 'components/Modal';
import Text from 'components/modern/Text';
import WalletAddress from 'components/WalletAddress';

// Contants
import { ASSET, EXCHANGE_FLOW, SEND_TOKEN_FROM_HOME_FLOW } from 'constants/navigationConstants';

// Selectors
import { useRootSelector, activeAccountAddressSelector } from 'selectors';
import { visibleActiveAccountAssetsWithBalanceSelector, assetRegistrySelector } from 'selectors/assets';
import { walletBalanceSelector } from 'selectors/balances';

// Utils
import { defaultSortAssetOptions, getAssetFromRegistry } from 'utils/assets';
import { appFont, fontSizes, spacing } from 'utils/variables';
import { useChainsConfig } from 'utils/uiConfig';

// Types
import type { SectionBase } from 'utils/types/react-native';
import type { Chain, ChainRecord } from 'models/Asset';

// Local
import { buildAssetDataNavigationParam } from '../utils';

function WalletTab() {
  const { t, tRoot } = useTranslationWithPrefix('assets.wallet');
  const navigation = useNavigation();

  const balance = useRootSelector(walletBalanceSelector);
  const items = useChainItems();
  const assetRegistry = useRootSelector(assetRegistrySelector);
  const accountAddress = useRootSelector(activeAccountAddressSelector);

  const config = useChainsConfig();
  const safeArea = useSafeAreaInsets();

  const hasBalance = balance.gt(0);

  const navigateAddFunds = () => {
    Modal.open(() => <AddFundsModal receiveAddress={accountAddress} />);
  };

  const navigateToAssetDetails = (item: Item) => {
    const asset = getAssetFromRegistry(assetRegistry, item.symbol);
    if (!asset) return;

    const assetData = buildAssetDataNavigationParam(asset, { accountAddress });
    navigation.navigate(ASSET, { assetData });
  };

  const renderListHeader = () => {
    return (
      <ListHeader>
        <BalanceView balance={balance} />
        <WalletAddress />
      </ListHeader>
    );
  };

  const renderSectionHeader = ({ title, chain }: Section) => {
    const chainConfig = config[chain];
    return (
      <SectionHeader>
        <SectionTitle>{title}</SectionTitle>
        <SectionChain color={chainConfig.color}>{chainConfig.title}</SectionChain>
      </SectionHeader>
    );
  };

  const renderItem = (item: Item) => {
    return (
      <AssetListItem
        name={item.title}
        iconUrl={item.iconUrl}
        balance={item.value}
        symbol={item.symbol}
        onPress={() => navigateToAssetDetails(item)}
      />
    );
  };

  const buttons = [
    { title: t('addFunds'), iconName: 'plus', onPress: navigateAddFunds },
    hasBalance && {
      title: tRoot('button.exchange'),
      iconName: 'exchange',
      onPress: () => navigation.navigate(EXCHANGE_FLOW),
    },
    hasBalance && {
      title: tRoot('button.send'),
      iconName: 'send',
      onPress: () => navigation.navigate(SEND_TOKEN_FROM_HOME_FLOW),
    },
  ];

  const sections = Object.keys(items).map((chain) => ({
    key: chain,
    chain,
    title: t('tokens'),
    data: items[chain] ?? [],
  }));

  return (
    <Container>
      <SectionList
        sections={sections}
        renderSectionHeader={({ section }) => renderSectionHeader(section)}
        renderItem={({ item }) => renderItem(item)}
        contentContainerStyle={{ paddingBottom: safeArea.bottom + FloatingButtons.SCROLL_VIEW_BOTTOM_INSET }}
        ListHeaderComponent={renderListHeader()}
        scrollIndicatorInsets={{ top: 0 }}
      />

      <FloatingButtons items={buttons} />
    </Container>
  );
}

export default WalletTab;

type Section = {
  ...SectionBase<Item>,
  title: string,
  chain: Chain,
};

type Item = {|
  key: string,
  title: string,
  iconUrl: ?string,
  symbol: string,
  value: BigNumber,
|};

const useChainItems = (): ChainRecord<Item[]> => {
  const assets = useRootSelector(visibleActiveAccountAssetsWithBalanceSelector);

  const ethereum = defaultSortAssetOptions(assets).map((asset) => ({
    key: `ethereum-${asset.symbol}`,
    title: asset.name,
    iconUrl: asset.imageUrl,
    symbol: asset.symbol,
    value: BigNumber(asset.balance?.balance ?? 0),
  }));

  return { ethereum };
};

const Container = styled.View`
  flex: 1;
`;

const ListHeader = styled.View`
  align-items: center;
  margin: ${spacing.largePlus}px 0;
`;

const SectionHeader = styled.View`
  flex-direction: row;
  align-items: baseline;
  padding: ${spacing.medium}px ${spacing.large}px ${spacing.medium}px;
  background-color: ${({ theme }) => theme.colors.background};
`;

const SectionTitle = styled(Text)`
  font-family: '${appFont.medium}';
  font-size: ${fontSizes.big}px;
`;

const SectionChain = styled(Text)`
  margin-left: ${spacing.medium}px;
  font-size: ${fontSizes.small}px;
`;
