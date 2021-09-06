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

// Components
import TokenValueView from 'components/display/TokenValueView';

// Selectors
import { useRootSelector } from 'selectors';

// Utils
import { findEnsNameCaseInsensitive } from 'utils/common';
import { formatHexAddress } from 'utils/format';
import { useThemeColors } from 'utils/themes';

// Types
import { type TokenTransactionEvent, EVENT_TYPE } from 'models/History';

// Local
import HistoryListItem from './HistoryListItem';


type Props = {|
  event: TokenTransactionEvent,
  onPress?: () => mixed,
|};

function TokenTransactionItem({ event, onPress }: Props) {
  const colors = useThemeColors();

  const ensRegistry = useRootSelector((root) => root.ensRegistry.data);

  if (event.type === EVENT_TYPE.TOKEN_RECEIVED) {
    const ensName = findEnsNameCaseInsensitive(ensRegistry, event.fromAddress);
    const { value, symbol } = event.value;
    return (
      <HistoryListItem
        iconName="arrow-down"
        iconColor={colors.positive}
        iconBorderColor={colors.positiveWeak}
        title={ensName ?? formatHexAddress(event.fromAddress)}
        valueComponent={<TokenValueView value={value} symbol={symbol} variant="medium" mode="change" />}
        status={event.status}
        onPress={onPress}
      />
    );
  }

  if (event.type === EVENT_TYPE.TOKEN_SENT) {
    const ensName = findEnsNameCaseInsensitive(ensRegistry, event.toAddress);
    const { value, symbol } = event.value;
    return (
      <HistoryListItem
        iconName="arrow-up"
        iconColor={colors.negative}
        iconBorderColor={colors.negativeWeak}
        title={ensName ?? formatHexAddress(event.toAddress)}
        valueComponent={<TokenValueView value={value?.negated()} symbol={symbol} variant="medium" mode="change" />}
        status={event.status}
        onPress={onPress}
      />
    );
  }

  return null;
}

export default TokenTransactionItem;
