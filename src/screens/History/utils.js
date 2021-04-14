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
import { orderBy, groupBy } from 'lodash';
import t from 'translations/translate';

// Components
import Icon from 'components/modern/Icon';

// Models
import type { Theme } from 'models/Theme';

// Utils
import { formatHexAddress } from 'utils/format';
import { humanizeDateString, formatDate } from 'utils/date';

// Types
import type { SectionBase } from 'utils/types/react-native';
import type { HistoryItem } from 'models/History';

// Local
import HistoryListItem, { TextValue, TokenValue } from './HistoryListItem';

export type HistorySection = {
  ...SectionBase<HistoryItem>,
  title: string,
};

export function mapHistoryItemsToSections(items: HistoryItem[]): HistorySection[] {
  const sortedItems = orderBy(items, ['date'], ['desc']);
  const groups = groupBy(sortedItems, (item) => formatDate(item.date, 'YYYY-MM-DD'));

  return Object.keys(groups).map((key: string) => ({
    title: humanizeDateString(key),
    data: groups[key],
  }));
}

export function renderHistoryItem(item: HistoryItem, theme: Theme): React.Element<any> {
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
}
