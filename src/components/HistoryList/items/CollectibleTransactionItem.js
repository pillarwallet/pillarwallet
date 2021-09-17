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
import { useTranslation } from 'translations/translate';

// Components
import Text from 'components/core/Text';

// Utils
import { useThemeColors } from 'utils/themes';

// Types
import { type CollectibleTransactionEvent, EVENT_TYPE, TRANSACTION_STATUS } from 'models/History';

// Local
import HistoryListItem from './HistoryListItem';

type Props = {|
  event: CollectibleTransactionEvent,
  onPress?: () => mixed,
|};

function CollectibleTransactionItem({ event, onPress }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const isPending = event.status === TRANSACTION_STATUS.PENDING;

  if (event.type === EVENT_TYPE.COLLECTIBLE_RECEIVED) {
    const statusText = isPending ? t('label.receiving') : t('label.received');
    return (
      <HistoryListItem
        iconUrl={event.imageUrl}
        title={event.title}
        valueComponent={<Text color={colors.basic030}>{statusText}</Text>}
        status={event.status}
        onPress={onPress}
      />
    );
  }

  if (event.type === EVENT_TYPE.COLLECTIBLE_SENT) {
    const statusText = isPending ? t('label.sending') : t('label.sent');
    return (
      <HistoryListItem
        iconUrl={event.imageUrl}
        title={event.title}
        valueComponent={<Text color={colors.basic030}>{statusText}</Text>}
        status={event.status}
        onPress={onPress}
      />
    );
  }

  return null;
}

export default CollectibleTransactionItem;
