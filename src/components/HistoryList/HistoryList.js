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
import styled, { useTheme } from 'styled-components/native';
import { useTranslation } from 'translations/translate';

// Components
import Icon from 'components/modern/Icon';
import Text from 'components/modern/Text';

// Utils
import { humanizeDateString } from 'utils/date';
import { formatHexAddress } from 'utils/format';
import { appFont, spacing } from 'utils/variables';

// Types
import type { HistoryItem } from 'models/History';

// Local
import HistoryListItem, { TextValue, TokenValue } from './HistoryListItem';
import { mapHistoryItemsToSections, type HistorySection } from './utils';

type Props = {|
  items: ?HistoryItem[];
|};

function HistoryList({ items }: Props) {
  const { t } = useTranslation();

  const sections = mapHistoryItemsToSections(items ?? []);

  const safeArea = useSafeAreaInsets();
  const theme = useTheme();

  const renderSectionHeader = (section: HistorySection) => {
    return <SectionHeader>{humanizeDateString(section.date)}</SectionHeader>;
  };

  const renderHistoryItem = (item: HistoryItem) => {
    if (item.type === 'tokenReceived') {
      return (
        <HistoryListItem
          title={formatHexAddress(item.fromAddress)}
          iconName="send-down"
          iconColor={theme.colors.positive}
          iconBorderColor={theme.colors.positiveWeak}
          rightComponent={<TokenValue symbol={item.symbol} value={item.value} />}
        />
      );
    }

    if (item.type === 'tokenSent') {
      return (
        <HistoryListItem
          title={formatHexAddress(item.toAddress)}
          iconName="send"
          iconColor={theme.colors.negative}
          iconBorderColor={theme.colors.negativeWeak}
          rightComponent={<TokenValue symbol={item.symbol} value={item.value?.negated()} />}
        />
      );
    }

    if (item.type === 'collectibleReceived') {
      return <HistoryListItem title={item.asset} rightComponent={<TextValue>{t('label.received')}</TextValue>} />;
    }

    if (item.type === 'collectibleSent') {
      return <HistoryListItem title={item.asset} rightComponent={<TextValue>{t('label.sent')}</TextValue>} />;
    }

    if (item.type === 'walletEvent') {
      return (
        <HistoryListItem
          title={item.title}
          subtitle={item.subtitle}
          iconName="wallet"
          iconColor={theme.colors.neutral}
          iconBorderColor={theme.colors.neutralWeak}
          rightComponent={<TextValue>{item.event}</TextValue>}
        />
      );
    }

    if (item.type === 'ensName') {
      return (
        <HistoryListItem
          title={t('ensName')}
          subtitle={item.ensName}
          iconComponent={<Icon name="profile" color={theme.colors.homeEnsNameIcon} />}
          rightComponent={<TextValue>{t('label.registered')}</TextValue>}
        />
      );
    }

    if (item.type === 'badgeEvent') {
      return (
        <HistoryListItem
          title={item.title}
          subtitle={item.subtitle}
          iconUrl={item.iconUrl}
          rightComponent={<TextValue>{item.event}</TextValue>}
        />
      );
    }

    return <HistoryListItem title="Not supported tx" iconName="question" />;
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
