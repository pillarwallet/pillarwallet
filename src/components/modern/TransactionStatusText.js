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
import Text, { type TextVariant } from 'components/modern/Text';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import { TRANSACTION_STATUS, type TransactionStatus } from 'models/History';

type Props = {|
  status: ?TransactionStatus,
  variant?: TextVariant,
  color?: string,
  style?: ViewStyleProp,
|};

function TransactionStatusText({
  status,
  variant,
  color,
  style,
}: Props) {
  const { t } = useTranslation();

  switch (status) {
    case TRANSACTION_STATUS.FAILED:
      return (
        <Text variant={variant} color={color} style={style}>
          {t('error.transactionFailed.default')}
        </Text>
      );
    case TRANSACTION_STATUS.TIMEDOUT:
      return (
        <Text variant={variant} color={color} style={style}>
          {t('error.transactionFailed.timeOut')}
        </Text>
      );
    default:
      return null;
  }
}

export default TransactionStatusText;
