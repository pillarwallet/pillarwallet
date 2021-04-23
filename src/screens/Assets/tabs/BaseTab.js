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
import { SectionList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { BigNumber } from 'bignumber.js';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import AssetListItem from 'components/modern/AssetListItem';
import BalanceView from 'components/BalanceView';
import FiatValueView from 'components/modern/FiatValueView';
import FloatingButtons from 'components/FloatingButtons';
import Modal from 'components/Modal';
import Text from 'components/modern/Text';

// Selectors
import { useRootSelector, useFiatCurrency } from 'selectors';
import { walletBalanceSelector } from 'selectors/balances';

// Utils
import { appFont, fontSizes, spacing } from 'utils/variables';
import { useChainsConfig } from 'utils/uiConfig';

// Types
import type { SectionBase } from 'utils/types/react-native';
import type { Chain, ChainRecord } from 'models/Asset';

function BaseTab() {
  const { t } = useTranslationWithPrefix('assets.deposits');

  const balance = useRootSelector(walletBalanceSelector);
  const balanceChange = BigNumber(10);
  const items = useChainItems();
  const currency = useFiatCurrency();

  const config = useChainsConfig();
  const safeArea = useSafeAreaInsets();

  const navigateToDeposit = () => {};

  const buttons = [{ title: t('deposit'), iconName: 'plus', onPress: navigateToDeposit }];

  const renderListHeader = () => {
    return (
      <ListHeader>
        <BalanceView balance={balance} />
        <FiatValueView value={balanceChange} currency={currency} mode="change" />
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
    return <AssetListItem name={item.title} iconUrl={item.iconUrl} balance={item.value} symbol={item.symbol} />;
  };

  const sections = Object.keys(items).map((chain) => ({
    key: chain,
    chain,
    title: t('tokens'),
    data: items[chain] ?? [],
  }));

  return (
    <>
      <SectionList
        sections={sections}
        renderSectionHeader={({ section }) => renderSectionHeader(section)}
        renderItem={({ item }) => renderItem(item)}
        ListHeaderComponent={renderListHeader()}
        contentContainerStyle={{ paddingBottom: safeArea.bottom + FloatingButtons.SCROLL_VIEW_BOTTOM_INSET }}
      />

      <FloatingButtons items={buttons} />
    </>
  );
}

export default BaseTab;

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
  return {
    ethereum: [
      { key: '1', title: 'Pillar', iconUrl: '', symbol: 'PLR', value: BigNumber(14.245) },
      { key: '2', title: 'Ethereum', iconUrl: '', symbol: 'ETH', value: BigNumber(0.87) },
    ],
    xdai: [{ key: '3', title: 'xDai', iconUrl: '', symbol: 'DAI', value: BigNumber(1000) }],
  };
};

const Container = styled.View`
  flex: 1;
`;

const ListHeader = styled.View`
  align-items: center;
  margin: ${spacing.largePlus}px 0;
`;

const BalanceChange = styled(Text)``;

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
