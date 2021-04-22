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

/* eslint-disable object-curly-newline */

import * as React from 'react';
import { SectionList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { BigNumber } from 'bignumber.js';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import AddFundsModal from 'components/AddFundsModal';
import AssetListItem from 'components/modern/AssetListItem';
import FloatingButtons from 'components/FloatingButtons';
import Modal from 'components/Modal';
import Text from 'components/modern/Text';

// Selectors
import { useRootSelector, activeAccountAddressSelector } from 'selectors';

// Utils
import { appFont, fontSizes, spacing } from 'utils/variables';
import { useChainsConfig } from 'utils/uiConfig';

// Types
import type { SectionBase } from 'utils/types/react-native';
import type { Chain, ChainRecord } from 'models/Asset';

function BaseTab() {
  const { t } = useTranslationWithPrefix('assets.wallet');

  const accountAddress = useRootSelector(activeAccountAddressSelector);
  const items = useChainItems();

  const config = useChainsConfig();
  const safeArea = useSafeAreaInsets();

  const showAddFunds = () => {
    Modal.open(() => <AddFundsModal receiveAddress={accountAddress} />);
  };

  const buttons = [{ title: t('addFunds'), iconName: 'plus', onPress: showAddFunds }];

  const renderSectionHeader = ({ title, chain }: Section) => {
    const chainTitle = config[chain].title;
    return <SectionHeader>{title} - {chainTitle}</SectionHeader>;
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
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => renderSectionHeader(section)}
        renderItem={({ item }) => renderItem(item)}
        contentContainerStyle={{ paddingBottom: safeArea.bottom }}
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
  title: string,
  iconUrl: string,
  symbol: string,
  value: BigNumber,
|};

const useChainItems = (): ChainRecord<Item[]> => {
  return {
    ethereum: [
      { title: 'Pillar', iconUrl: '', symbol: 'PLR', value: BigNumber(14.245) },
      { title: 'Ethereum', iconUrl: '', symbol: 'ETH', value: BigNumber(0.87) },
    ],
    xdai: [{ title: 'xDai', iconUrl: '', symbol: 'DAI', value: BigNumber(1000) }],
  };
};

const SectionHeader = styled(Text)`
  padding: ${spacing.large}px ${spacing.large}px ${spacing.small}px;
  font-family: '${appFont.medium}';
  font-size: ${fontSizes.big}px;
  background-color: ${({ theme }) => theme.colors.background};
`;
