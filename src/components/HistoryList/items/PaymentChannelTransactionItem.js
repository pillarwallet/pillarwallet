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

// Selectors
import { useRootSelector } from 'selectors';

// Utils
import { findEnsNameCaseInsensitive } from 'utils/common';
import { formatHexAddress } from 'utils/format';
import { useThemeColors } from 'utils/themes';

// Types
import type { PaymentChannelHistoryItem } from 'models/History';

// Local
import HistoryListItem, { TokenValue, PaymentChannelValue, MultipleValue } from './HistoryListItem';

type Props = {|
  item: PaymentChannelHistoryItem,
|};

function PaymentChannelTransactionItem({ item }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const ensRegistry = useRootSelector((root) => root.ensRegistry.data);

  if (item.type === 'paymentChannelReceived') {
    const ensName = findEnsNameCaseInsensitive(ensRegistry, item.fromAddress);

    return (
      <HistoryListItem
        iconName="arrow-down"
        iconColor={colors.positive}
        iconBorderColor={colors.positiveWeak}
        title={ensName ?? formatHexAddress(item.fromAddress)}
        rightComponent={<PaymentChannelValue symbol={item.value.symbol} value={item.value.value} />}
        status={item.status}
      />
    );
  }

  if (item.type === 'paymentChannelSent') {
    const ensName = findEnsNameCaseInsensitive(ensRegistry, item.fromAddress);

    return (
      <HistoryListItem
        iconName="arrow-up"
        iconColor={colors.negative}
        iconBorderColor={colors.negativeWeak}
        title={ensName ?? formatHexAddress(item.toAddress)}
        rightComponent={<PaymentChannelValue symbol={item.value.symbol} value={item.value.value?.negated()} />}
        status={item.status}
      />
    );
  }

  if (item.type === 'paymentChannelTopUp') {
    return (
      <HistoryListItem
        iconName="plus"
        iconColor={colors.neutral}
        iconBorderColor={colors.neutralWeak}
        title={t('label.topUp')}
        subtitle={t('label.walletToPillarPay')}
        rightComponent={
          <RightColumn>
            <TokenValue symbol={item.value.symbol} value={item.value.value?.negated()} />
            <TokenValue symbol={item.value.symbol} value={item.value.value} />
          </RightColumn>
        }
        status={item.status}
      />
    );
  }

  if (item.type === 'paymentChannelWithdrawal') {
    return (
      <HistoryListItem
        iconName="withdraw"
        iconColor={colors.neutral}
        iconBorderColor={colors.neutralWeak}
        title={t('label.withdrawal')}
        subtitle={t('label.pillarPayToWallet')}
        rightComponent={
          <RightColumn>
            <TokenValue symbol={item.value.symbol} value={item.value.value?.negated()} color={colors.neutral} />
            <TokenValue symbol={item.value.symbol} value={item.value.value} color={colors.neutral} />
          </RightColumn>
        }
        status={item.status}
      />
    );
  }

  if (item.type === 'paymentChannelSettlement') {
    return (
      <HistoryListItem
        iconName="settlement"
        iconColor={colors.neutral}
        iconBorderColor={colors.neutralWeak}
        title={t('label.settlement')}
        subtitle={t('label.pillarPayToWallet')}
        rightComponent={
          <RightColumn>
            {item.inputValues.length === 1 ? (
              <TokenValue
                symbol={item.inputValues[0].symbol}
                value={item.inputValues[0].value?.negated()}
                color={colors.synthetic140}
              />
            ) : (
              <MultipleValue color={colors.synthetic140} />
            )}
            <TokenValue symbol={item.outputValue.symbol} value={item.outputValue.value} />
          </RightColumn>
        }
        status={item.status}
      />
    );
  }

  return null;
}

export default PaymentChannelTransactionItem;

const RightColumn = styled.View`
  align-items: flex-end;
`;
