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
import { useNavigation } from 'react-navigation-hooks';
import { useTranslation } from 'translations/translate';

// Components
import Button from 'components/modern/Button';
import TokenValueView from 'components/modern/TokenValueView';
import { Spacing } from 'components/Layout';

// Constants
import { SEND_TOKEN_FROM_HOME_FLOW } from 'constants/navigationConstants';

// Selectors
import { useRootSelector } from 'selectors';

// Utils
import { findEnsNameCaseInsensitive } from 'utils/common';
import { formatHexAddress } from 'utils/format';
import { viewOnTheBlockchain } from 'utils/linking';
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

// Types
import type { TokenTransactionEvent } from 'models/History';

// Local
import BaseEventDetails from './BaseEventDetails';

type Props = {|
  event: TokenTransactionEvent,
|};

function BadgeReceivedEventDetails({ event }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const colors = useThemeColors();

  const ensRegistry = useRootSelector((root) => root.ensRegistry.data);

  const sendTokensToAddress = (address: string) => {
    navigation.navigate(SEND_TOKEN_FROM_HOME_FLOW, {
      contact: {
        ethAddress: address,
        name: ensRegistry[address] ?? address,
        ensName: ensRegistry[address],
      },
    });
  };

  if (event.type === 'tokenReceived') {
    const ensName = findEnsNameCaseInsensitive(ensRegistry, event.fromAddress);

    return (
      <BaseEventDetails
        date={event.date}
        title={ensName ?? formatHexAddress(event.fromAddress)}
        iconName="arrow-down"
        iconColor={colors.positive}
        iconBorderColor={colors.positiveWeak}
      >
        <TokenValueView value={event.value.value} symbol={event.value.symbol} variant="large" mode="change" />
        <Spacing h={spacing.extraLarge} />

        <Button
          variant="secondary"
          title={t('button.sendBack')}
          onPress={() => sendTokensToAddress(event.fromAddress)}
        />
        <Spacing h={spacing.small} />
        <Button variant="text" title={t('button.viewOnBlockchain')} onPress={() => viewOnTheBlockchain(event.hash)} />
      </BaseEventDetails>
    );
  }

  if (event.type === 'tokenSent') {
    const ensName = findEnsNameCaseInsensitive(ensRegistry, event.toAddress);

    return (
      <BaseEventDetails
        date={event.date}
        title={ensName ?? formatHexAddress(event.toAddress)}
        iconName="arrow-up"
        iconColor={colors.negative}
        iconBorderColor={colors.negativeWeak}
      >
        <TokenValueView value={event.value.value.negated()} symbol={event.value.symbol} variant="large" mode="change" />
        <Spacing h={spacing.extraLarge} />

        <Button
          variant="secondary"
          title={t('button.viewOnBlockchain')}
          onPress={() => viewOnTheBlockchain(event.hash)}
        />
      </BaseEventDetails>
    );
  }

  return null;
}

export default BadgeReceivedEventDetails;
