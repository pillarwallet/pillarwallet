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
import { useDispatch } from 'react-redux';

// Actions
import { viewTransactionOnBlockchainAction } from 'actions/historyActions';

// Components
import { Row, Spacing } from 'components/layout/Layout';
import Button from 'components/core/Button';
import FeeLabel from 'components/display/FeeLabel';
import TokenValueView from 'components/display/TokenValueView';
import TransactionStatusIcon from 'components/display/TransactionStatusIcon';
import TransactionStatusText from 'components/display/TransactionStatusText';

// Constants
import { SEND_TOKEN_FROM_HOME_FLOW } from 'constants/navigationConstants';

// Selectors
import { useRootSelector } from 'selectors';

// Utils
import { findEnsNameCaseInsensitive } from 'utils/common';
import { formatHexAddress } from 'utils/format';
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

// Types
import { EVENT_TYPE, type TokenTransactionEvent } from 'models/History';
import type { Chain } from 'models/Chain';

// Local
import BaseEventDetails from './BaseEventDetails';

type Props = {|
  event: TokenTransactionEvent,
  chain: Chain,
|};

function TokenTransactionEventDetails({ event, chain }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const colors = useThemeColors();

  const ensRegistry = useRootSelector((root) => root.ensRegistry.data);

  const viewOnBlockchain = () => dispatch(viewTransactionOnBlockchainAction(chain, event));

  const sendTokensToAddress = (address: string, contractAddress: string) => {
    navigation.navigate(SEND_TOKEN_FROM_HOME_FLOW, {
      contact: {
        ethAddress: address,
        name: ensRegistry[address] ?? address,
        ensName: ensRegistry[address],
      },
      assetData: {
        chain,
        contractAddress,
      },
    });
  };

  if (event.type === EVENT_TYPE.TOKEN_RECEIVED) {
    const ensName = findEnsNameCaseInsensitive(ensRegistry, event.fromAddress);
    const { value, symbol } = event.value;

    return (
      <BaseEventDetails
        date={event.date}
        title={ensName ?? formatHexAddress(event.fromAddress)}
        iconName="arrow-down"
        iconColor={colors.positive}
        iconBorderColor={colors.positiveWeak}
      >
        <Row>
          <TokenValueView value={value} symbol={symbol} variant="large" mode="change" />
          <TransactionStatusIcon status={event.status} size={24} />
        </Row>
        <TransactionStatusText status={event.status} color={colors.basic030} variant="medium" />
        <Spacing h={spacing.extraLarge} />

        <Button
          variant="secondary"
          title={t('button.sendBack')}
          onPress={() => sendTokensToAddress(event.fromAddress, event.value?.address)}
        />
        <Spacing h={spacing.small} />
        <Button variant="text" title={t('button.viewOnBlockchain')} onPress={viewOnBlockchain} />
      </BaseEventDetails>
    );
  }

  if (event.type === EVENT_TYPE.TOKEN_SENT) {
    const ensName = findEnsNameCaseInsensitive(ensRegistry, event.toAddress);
    const { value, symbol } = event.value;

    return (
      <BaseEventDetails
        date={event.date}
        title={ensName ?? formatHexAddress(event.toAddress)}
        iconName="arrow-up"
        iconColor={colors.negative}
        iconBorderColor={colors.negativeWeak}
      >
        <Row>
          <TokenValueView value={value.negated()} symbol={symbol} variant="large" mode="change" />
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

export default TokenTransactionEventDetails;
