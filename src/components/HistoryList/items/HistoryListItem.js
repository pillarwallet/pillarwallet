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
import { BigNumber } from 'bignumber.js';
import { useTranslation } from 'translations/translate';

// Components
import Icon, { type IconName } from 'components/modern/Icon';
import Image from 'components/Image';
import Text from 'components/modern/Text';

// Utils
import { formatTokenChange, formatFiatChange } from 'utils/format';
import { useThemeColors } from 'utils/themes';
import { appFont, fontStyles, spacing } from 'utils/variables';

// Types
import { TRANSACTION_STATUS, type TransactionStatus } from 'models/History';

type Props = {|
  title: ?string,
  subtitle?: ?string,
  iconUrl?: ?string,
  iconName?: IconName,
  iconColor?: string,
  iconBorderColor?: string,
  iconComponent?: React.Node,
  rightComponent?: React.Node,
  status?: TransactionStatus,
|};

function HistoryListItem({
  title,
  subtitle,
  iconUrl,
  iconName,
  iconColor,
  iconBorderColor,
  iconComponent,
  rightComponent,
  status,
}: Props) {
  const colors = useThemeColors();

  return (
    <Container>
      <LeftColumn>
        {!!iconUrl && (
          <IconImageWrapper>
            <IconImage source={{ uri: iconUrl }} />
          </IconImageWrapper>
        )}
        {!!iconName && (
          <IconCircle $color={iconBorderColor ?? colors.neutralWeak}>
            <Icon name={iconName} color={iconColor ?? colors.neutral} />
          </IconCircle>
        )}
        {iconComponent}
      </LeftColumn>

      <MiddleColumn>
        <Text variant="medium" numberOfLines={1}>
          {title}
        </Text>

        {!!subtitle && <Text color={colors.basic030}>{subtitle}</Text>}
      </MiddleColumn>

      {rightComponent && <RightColumn>{rightComponent}</RightColumn>}

      {status === TRANSACTION_STATUS.PENDING && (
        <StatusIcon name="pending" color={colors.neutral} width={16} height={16} />
      )}
      {status === TRANSACTION_STATUS.FAILED && (
        <StatusIcon name="failed" color={colors.negative} width={16} height={16} />
      )}
      {status === TRANSACTION_STATUS.TIMEDOUT && (
        <StatusIcon name="failed" color={colors.neutral} width={16} height={16} />
      )}
    </Container>
  );
}

export default HistoryListItem;

const Container = styled.View`
  flex-direction: row;
  padding: ${spacing.small}px ${spacing.large}px;
  background-color: ${({ theme }) => theme.colors.basic070};
  min-height: 64px;
`;

const LeftColumn = styled.View`
  justify-content: center;
  margin-right: ${spacing.medium}px;
  width: 48px;
`;

const MiddleColumn = styled.View`
  flex: 1;
  justify-content: center;
`;

const RightColumn = styled.View`
  justify-content: center;
  align-items: flex-end;
  margin-left: ${spacing.medium}px;
`;

const IconImageWrapper = styled.View`
  justify-content: center;
  align-items: center;
  width: 48px;
  height: 48px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.neutralWeak};
  border-radius: 24px;
  background-color: ${({ theme }) => theme.colors.neutralWeak};
  overflow: hidden;
`;

const IconImage = styled(Image)`
  width: 48px;
  height: 48px;
`;

const IconCircle = styled.View`
  justify-content: center;
  align-items: center;
  width: 48px;
  height: 48px;
  border-width: 1px;
  border-color: ${({ $color }) => $color};
  border-radius: 24px;
`;

const StatusIcon = styled(Icon)`
  align-self: center;
  margin-left: 6px;
`;

export type TextValueProps = {|
  children: string,
|};

export function TextValue({ children }: TextValueProps) {
  const colors = useThemeColors();

  return <Text color={colors.basic030}>{children}</Text>;
}

export type TokenValueProps = {|
  symbol: string,
  value: ?BigNumber,
  color?: string,
|};

export function TokenValue({ symbol, value, color }: TokenValueProps) {
  const colors = useThemeColors();

  if (!value) return null;

  const resultColor = color ?? (value.gte(0) ? colors?.positive : colors?.secondaryText);

  return (
    <Text variant="medium" color={resultColor} style={styles.tokenValue}>
      {formatTokenChange(value, symbol, { stripTrailingZeros: true })}
    </Text>
  );
}

export type PaymentChannelValueProps = {|
  symbol: string,
  value: ?BigNumber,
|};

export function PaymentChannelValue({ symbol, value }: PaymentChannelValueProps) {
  const colors = useThemeColors();

  if (!value) return null;

  return (
    <PaymentChannelWrapper>
      <PaymentChannelIcon name="synthetic" color={colors.synthetic140} width={14} height={14} />
      <Text variant="medium" color={colors.synthetic140} style={styles.tokenValue}>
        {formatTokenChange(value, symbol, { stripTrailingZeros: true })}
      </Text>
    </PaymentChannelWrapper>
  );
}

export type MultipleValueProps = {|
  color?: string,
|};


export function MultipleValue({ color }: MultipleValueProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <Text variant="medium" color={color ?? colors.neutral} style={styles.tokenValue}>
      {t('label.multiple')}
    </Text>
  );
}

const PaymentChannelWrapper = styled.View`
  flex-direction: row;
  align-items: center;
`;

const PaymentChannelIcon = styled(Icon)`
  margin-right: 6px;
`;

const styles = {
  tokenValue: {
    fontVariant: ['tabular-nums'],
  },
};

export type FiatValueProps = {|
  currency: string,
  value: ?BigNumber,
  color?: string,
|};

export function FiatValue({ currency, value, color }: FiatValueProps) {
  const colors = useThemeColors();

  if (!value) return null;

  const resultColor = color ?? (value.gte(0) ? colors?.positive : colors?.secondaryText);

  return (
    <Text variant="medium" color={resultColor} style={styles.tokenValue}>
      {formatFiatChange(value, currency)}
    </Text>
  );
}
