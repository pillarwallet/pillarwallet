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
import { Row, ColumnRight, Spacing } from 'components/modern/Layout';
import Button from 'components/modern/Button';
import FeeLabel from 'components/modern/FeeLabel';
import FiatValueView from 'components/modern/FiatValueView';
import TokenValueView from 'components/modern/TokenValueView';
import TransactionStatusIcon from 'components/modern/TransactionStatusIcon';
import TransactionStatusText from 'components/modern/TransactionStatusText';

// Utils
import { viewOnBlockchain } from 'utils/blockchainExplorer';
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

// Types
import type { ExchangeFromFiatEvent } from 'models/History';

// Local
import BaseEventDetails from './BaseEventDetails';

type Props = {|
  event: ExchangeFromFiatEvent,
|};

function ExchangeFromFiatEventDetails({ event }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();

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

      <FeeLabel value={event.fee.value} symbol={event.fee.symbol} mode="actual" />
      <Spacing h={spacing.mediumLarge} />

      <Button variant="secondary" title={t('button.viewOnBlockchain')} onPress={() => viewOnBlockchain(event.hash)} />
    </BaseEventDetails>
  );
}

export default ExchangeFromFiatEventDetails;

const styles = {
  tokenValue: {
    lineHeight: undefined, // Reset line height.
  },
};
