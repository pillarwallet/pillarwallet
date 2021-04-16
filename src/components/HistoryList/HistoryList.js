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
import { SectionList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

// Components
import Text from 'components/modern/Text';

// Utils
import { humanizeDateString } from 'utils/date';
import { appFont, spacing } from 'utils/variables';

// Types
import type { HistoryItem } from 'models/History';

// Local
import { mapHistoryItemsToSections, type HistorySection } from './utils';
import TokenTransactionItem from './items/TokenTransactionItem';
import CollectibleTransactionItem from './items/CollectibleTransactionItem';
import WalletEventItem from './items/WalletEventItem';
import EnsNameItem from './items/EnsNameItem';
import BadgeReceivedItem from './items/BadgeReceivedItem';
import HistoryListItem from './items/HistoryListItem';

type Props = {|
  items: ?HistoryItem[];
|};

function HistoryList({ items }: Props) {
  const safeArea = useSafeAreaInsets();

  const sections = mapHistoryItemsToSections(items ?? []);

  const renderSectionHeader = (section: HistorySection) => {
    return <SectionHeader>{humanizeDateString(section.date)}</SectionHeader>;
  };

  const renderHistoryItem = (item: HistoryItem) => {
    switch (item.type) {
      case 'tokenReceived':
      case 'tokenSent':
        return <TokenTransactionItem item={item} />;
      case 'collectibleReceived':
      case 'collectibleSent':
        return <CollectibleTransactionItem item={item} />;
      case 'walletEvent':
        return <WalletEventItem item={item} />;
      case 'ensName':
        return <EnsNameItem item={item} />;
      case 'badgeReceived':
        return <BadgeReceivedItem item={item} />;
      default:
        // Temporary debug item
        return <HistoryListItem title="Not supported tx" iconName="question" />;
    }
  };

  return (
    <SectionList
      contentContainerStyle={{ paddingBottom: safeArea.bottom }}
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => renderSectionHeader(section)}
      renderItem={({ item }) => renderHistoryItem(item)}
    />
  );
}

export default HistoryList;

const SectionHeader = styled(Text)`
  padding: ${spacing.large}px ${spacing.large}px ${spacing.small}px;
  font-family: '${appFont.medium}';
  color: ${({ theme }) => theme.colors.basic020};
  background-color: ${({ theme }) => theme.colors.basic070};
`;
