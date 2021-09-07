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
import { Row, ColumnRight, Spacing } from 'components/layout/Layout';
import Button from 'components/core/Button';
import FeeLabel from 'components/display/FeeLabel';
import FiatValueView from 'components/display/FiatValueView';
import TokenValueView from 'components/display/TokenValueView';
import TransactionStatusIcon from 'components/display/TransactionStatusIcon';
import TransactionStatusText from 'components/display/TransactionStatusText';

// Utils
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

// Types
import type { ExchangeFromFiatEvent } from 'models/History';
import type { Chain } from 'models/Chain';

// Local
import BaseEventDetails from './BaseEventDetails';

type Props = {|
  event: ExchangeFromFiatEvent,
  chain: Chain,
|};

function ExchangeFromFiatEventDetails({ event, chain }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const colors = useThemeColors();

  const viewOnBlockchain = () => dispatch(viewTransactionOnBlockchainAction(chain, event));

  return (
    <BaseEventDetails
      date={event.date}
      title={t('label.fromToFormat', { from: event.fromValue.currency, to: event.toValue.symbol })}
      iconName="exchange"
    >
      <Row>
        <ColumnRight>
          <FiatValueView
            value={event.fromValue.value.negated()}
            currency={event.fromValue.currency}
            variant="large"
            mode="change"
            style={styles.tokenValue}
          />
          <TokenValueView
            value={event.toValue.value}
            symbol={event.toValue.symbol}
            variant="large"
            mode="change"
            style={styles.tokenValue}
          />
        </ColumnRight>
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

export default ExchangeFromFiatEventDetails;

const styles = {
  tokenValue: {
    lineHeight: undefined, // Reset line height.
  },
};
