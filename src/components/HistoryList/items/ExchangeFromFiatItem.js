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
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';

// Types
import type { ExchangeFromFiatEvent } from 'models/History';

// Local
import HistoryListItem, { TokenValue, FiatValue } from './HistoryListItem';

type Props = {|
  event: ExchangeFromFiatEvent,
|};

function ExchangeFromFiat({ event }: Props) {
  const { t } = useTranslation();

  return (
    <HistoryListItem
      iconName="exchange"
      title={t('label.fromToFormat', { from: event.fromValue.currency, to: event.toValue.symbol })}
      rightComponent={
        <RightColumn>
          <FiatValue currency={event.fromValue.currency} value={event.fromValue.value?.negated()} />
          <TokenValue symbol={event.toValue.symbol} value={event.toValue.value} />
        </RightColumn>
      }
      status={event.status}
    />
  );
}

export default ExchangeFromFiat;

const RightColumn = styled.View`
  align-items: flex-end;
`;
