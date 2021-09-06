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
import TokenValueView from 'components/display/TokenValueView';
import { ColumnRight } from 'components/layout/Layout';

// Types
import type { TokenExchangeEvent } from 'models/History';

// Local
import HistoryListItem from './HistoryListItem';

type Props = {|
  event: TokenExchangeEvent,
  onPress?: () => mixed,
|};

function TokenExchangeItem({ event, onPress }: Props) {
  const { t } = useTranslation();

  return (
    <HistoryListItem
      iconName="exchange"
      title={t('label.fromToFormat', { from: event.fromValue.symbol, to: event.toValue.symbol })}
      valueComponent={
        <ColumnRight>
          <TokenValueView
            value={event.fromValue.value?.negated()}
            symbol={event.fromValue.symbol}
            variant="medium"
            mode="change"
          />
          <TokenValueView value={event.toValue.value} symbol={event.toValue.symbol} variant="medium" mode="change" />
        </ColumnRight>
      }
      status={event.status}
      onPress={onPress}
    />
  );
}

export default TokenExchangeItem;
