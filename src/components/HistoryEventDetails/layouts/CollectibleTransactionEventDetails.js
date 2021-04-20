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
import Button from 'components/modern/Button';
import FeeLabel from 'components/modern/FeeLabel';
import Text from 'components/modern/Text';
import TransactionStatusIcon from 'components/modern/TransactionStatusIcon';
import TransactionStatusText from 'components/modern/TransactionStatusText';
import { Spacing } from 'components/Layout';
import { Row } from 'components/modern/Layout';

// Selectors
import { useRootSelector } from 'selectors';

// Utils
import { findEnsNameCaseInsensitive } from 'utils/common';
import { formatHexAddress } from 'utils/format';
import { viewOnBlockchain } from 'utils/linking';
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

// Types
import { TRANSACTION_STATUS, type CollectibleTransactionEvent } from 'models/History';

// Local
import BaseEventDetails from './BaseEventDetails';

type Props = {|
  event: CollectibleTransactionEvent,
|};

function CollectibleTransactionEventDetails({ event }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const ensRegistry = useRootSelector((root) => root.ensRegistry.data);
  const isPending = event.status === TRANSACTION_STATUS.PENDING;

  if (event.type === 'collectibleReceived') {
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

        <Button variant="secondary" title={t('button.viewOnBlockchain')} onPress={() => viewOnBlockchain(event.hash)} />
      </BaseEventDetails>
    );
  }

  if (event.type === 'collectibleSent') {
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

        <FeeLabel value={event.fee.value} symbol={event.fee.symbol} mode="actual" />
        <Spacing h={spacing.mediumLarge} />

        <Button variant="secondary" title={t('button.viewOnBlockchain')} onPress={() => viewOnBlockchain(event.hash)} />
      </BaseEventDetails>
    );
  }

  return null;
}

export default CollectibleTransactionEventDetails;
