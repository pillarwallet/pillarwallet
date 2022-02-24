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

// Components
import Text from 'components/core/Text';

// Utils
import { appFont, fontStyles, spacing } from 'utils/variables';

// Types
import type { ViewProps, TextProps, FontVariant } from 'utils/types/react-native';

export const Header: React.ComponentType<TextProps> = styled(Text)`
  font-family: '${appFont.medium}';
  ${fontStyles.big};
  margin: ${spacing.large}px 0 ${spacing.small}px;
`;

type RowProps = {|
  title: ?string,
  value?: ?string,
  variant?: RowValueVariant,
  fontVariant?: FontVariant,
  separator?: boolean,
|};

export function Row({ title, value, variant, fontVariant, separator }: RowProps) {
  return (
    <RowContainer separator={separator}>
      <RowTitle>{title}</RowTitle>
      <RowValue variant={variant} fontVariant={fontVariant}>
        {value}
      </RowValue>
    </RowContainer>
  );
}

type RowContainerProps = {|
  ...ViewProps,
  separator?: boolean,
|};

export const RowContainer: React.ComponentType<RowContainerProps> = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 10px 0;
  ${({ separator = true, theme }) =>
    separator ? `border-top-width: 1px; border-color: ${theme.colors.basic060};` : ''}
`;

export const RowTitle: React.ComponentType<TextProps> = styled(Text)`
  flex: 1;
  color: ${({ theme }) => theme.colors.basic030};
`;

type RowValueVariant = 'primary' | 'secondary' | 'positive' | 'negative';

type RowValueProps = {|
  ...TextProps,
  variant?: RowValueVariant,
  fontVariant?: FontVariant,
|};

export const RowValue: React.ComponentType<RowValueProps> = styled(Text)`
  margin-left: ${spacing.extraSmall}px;
  ${({ fontVariant }) => (fontVariant ? `font-variant: ${fontVariant}` : '')};
  ${({ variant, theme }) => (variant === 'secondary' ? `color: ${theme.colors.secondaryText}` : '')};
  ${({ variant, theme }) => (variant === 'positive' ? `color: ${theme.colors.positive}` : '')};
  ${({ variant, theme }) => (variant === 'negative' ? `color: ${theme.colors.negative}` : '')};
`;
