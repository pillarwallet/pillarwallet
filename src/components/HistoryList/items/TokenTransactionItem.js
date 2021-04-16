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

// Utils
import { formatHexAddress } from 'utils/format';
import { useThemeColors } from 'utils/themes';

// Types
import type { TokenReceivedHistoryItem, TokenSentHistoryItem } from 'models/History';

// Local
import HistoryListItem, { TokenValue } from './HistoryListItem';

type Props = {|
  item: TokenReceivedHistoryItem | TokenSentHistoryItem,
|};

function TokenTransactionItem({ item }: Props) {
  const colors = useThemeColors();

  if (item.type === 'tokenReceived') {
    return (
      <HistoryListItem
        title={formatHexAddress(item.fromAddress)}
        iconName="send-down"
        iconColor={colors.positive}
        iconBorderColor={colors.positiveWeak}
        rightComponent={<TokenValue symbol={item.symbol} value={item.value} />}
      />
    );
  }

  if (item.type === 'tokenSent') {
    return (
      <HistoryListItem
        title={formatHexAddress(item.toAddress)}
        iconName="send"
        iconColor={colors.negative}
        iconBorderColor={colors.negativeWeak}
        rightComponent={<TokenValue symbol={item.symbol} value={item.value?.negated()} />}
      />
    );
  }

  return null;
}

export default TokenTransactionItem;
