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
import { useDispatch } from 'react-redux';

// Actions
import { viewTransactionOnBlockchainAction } from 'actions/historyActions';

// Components
import { Row, Spacing } from 'components/layout/Layout';
import Button from 'components/core/Button';
import FeeLabel from 'components/display/FeeLabel';
import Text from 'components/core/Text';
import TransactionStatusIcon from 'components/display/TransactionStatusIcon';
import TransactionStatusText from 'components/display/TransactionStatusText';

// Selectors
import { useRootSelector } from 'selectors';

// Utils
import { findEnsNameCaseInsensitive } from 'utils/common';
import { formatHexAddress } from 'utils/format';
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

// Types
import { type CollectibleTransactionEvent, EVENT_TYPE, TRANSACTION_STATUS } from 'models/History';
import type { Chain } from 'models/Chain';

// Local
import BaseEventDetails from './BaseEventDetails';

type Props = {|
  event: CollectibleTransactionEvent,
  chain: Chain,
|};

function CollectibleTransactionEventDetails({ event, chain }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const colors = useThemeColors();

  const ensRegistry = useRootSelector((root) => root.ensRegistry.data);
  const isPending = event.status === TRANSACTION_STATUS.PENDING;

  const viewOnBlockchain = () => dispatch(viewTransactionOnBlockchainAction(chain, event));

  if (event.type === EVENT_TYPE.COLLECTIBLE_RECEIVED) {
    const ensName = findEnsNameCaseInsensitive(ensRegistry, event.fromAddress);
    const username = ensName ?? formatHexAddress(event.fromAddress);
    const statusText = isPending ? t('label.receiving') : t('label.received');

    return (
      <BaseEventDetails
        date={event.date}
        title={event.title}
        subtitle={t('label.collectibleFromUser', { username })}
        iconUrl={event.imageUrl}
      >
        <Row>
          <Text variant="large">{statusText}</Text>
          <TransactionStatusIcon status={event.status} size={24} />
        </Row>
        <TransactionStatusText status={event.status} color={colors.basic030} variant="medium" />
        <Spacing h={spacing.extraLarge} />

        <Button variant="secondary" title={t('button.viewOnBlockchain')} onPress={viewOnBlockchain} />
      </BaseEventDetails>
    );
  }

  if (event.type === EVENT_TYPE.COLLECTIBLE_SENT) {
    const ensName = findEnsNameCaseInsensitive(ensRegistry, event.toAddress);
    const username = ensName ?? formatHexAddress(event.toAddress);
    const statusText = isPending ? t('label.sending') : t('label.sent');

    return (
      <BaseEventDetails
        date={event.date}
        title={event.title}
        subtitle={t('label.collectibleToUser', { username })}
        iconUrl={event.imageUrl}
      >
        <Row>
          <Text variant="large">{statusText}</Text>
          <TransactionStatusIcon status={event.status} size={24} />
        </Row>
        <TransactionStatusText status={event.status} color={colors.basic030} variant="medium" />
        <Spacing h={spacing.extraLarge} />

        {!!event?.fee && (
          <FeeLabel
            value={event.fee.value}
            assetSymbol={event.fee.symbol}
            assetAddress={event.fee.address}
            mode="actual"
            chain={chain}
          />
        )}
        <Spacing h={spacing.mediumLarge} />

        <Button variant="secondary" title={t('button.viewOnBlockchain')} onPress={viewOnBlockchain} />
      </BaseEventDetails>
    );
  }

  return null;
}

export default CollectibleTransactionEventDetails;
