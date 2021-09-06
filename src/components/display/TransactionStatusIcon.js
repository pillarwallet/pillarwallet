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
import Icon from 'components/core/Icon';

// Utils
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import { TRANSACTION_STATUS, type TransactionStatus } from 'models/History';


type Props = {|
  status: ?TransactionStatus,
  size: number,
  style?: ViewStyleProp,
|};

function TransactionStatusIcon({ status, size, style }: Props) {
  const colors = useThemeColors();

  switch (status) {
    case TRANSACTION_STATUS.PENDING:
      return <Icon name="pending" color={colors.neutral} width={size} height={size} style={[styles.icon, style]} />;
    case TRANSACTION_STATUS.FAILED:
    case TRANSACTION_STATUS.TIMEDOUT:
      return <Icon name="failed" color={colors.negative} width={size} height={size} style={[styles.icon, style]} />;
    default:
      return null;
  }
}

export default TransactionStatusIcon;

const styles = {
  icon: {
    marginLeft: spacing.extraSmall,
    marginRight: spacing.extraSmall,
  },
};
