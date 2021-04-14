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

// Components
import Icon, { type IconName } from 'components/modern/Icon';
import Image from 'components/Image';
import Text from 'components/modern/Text';

// Utils
import { formatTokenValueChange } from 'utils/format';
import { useThemeColors } from 'utils/themes';
import { appFont, fontStyles, spacing } from 'utils/variables';

type Props = {|
  title: ?string,
  subtitle?: ?string,
  iconUrl?: ?string,
  iconName?: IconName,
  iconColor?: string,
  iconBorderColor?: string,
  iconComponent?: React.Node,
  rightComponent?: React.Node,
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

        {!!subtitle && <Text color="basic030">{subtitle}</Text>}
      </MiddleColumn>

      {rightComponent && <RightColumn>{rightComponent}</RightColumn>}
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

export type TextValueProps = {|
  children: string,
|};

export function TextValue({ children }: TextValueProps) {
  return <Text color="basic030">{children}</Text>;
}

export type TokenValueProps = {|
  symbol: string,
  value: ?BigNumber,
|};

export function TokenValue({ symbol, value }: TokenValueProps) {
  if (!value) return null;

  return (
    <Text variant="medium" color={value.gte(0) ? 'positive' : 'secondaryText'} style={styles.tokenValue}>
      {formatTokenValueChange(value, symbol)}
    </Text>
  );
}

const styles = {
  tokenValue: {
    fontVariant: ['tabular-nums'],
  },
};
