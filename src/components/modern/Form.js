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
import Text from 'components/modern/Text';

// Utils
import { appFont, fontStyles, spacing } from 'utils/variables';

// Types
import type { ViewProps, TextProps, FontVariant } from 'utils/types/react-native';

export const Header: React.ComponentType<TextProps> = styled(Text)`
  font-family: '${appFont.medium}';
  ${fontStyles.big};
  margin: ${spacing.large}px 0 ${spacing.small}px;
`;

type ItemProps = {|
  title: ?string,
  value?: ?string,
  variant?: ItemValueVariant,
  fontVariant?: FontVariant,
  separator?: boolean,
|};

export function Item({
  title,
  value,
  variant,
  fontVariant,
  separator,
}: ItemProps) {
  return (
    <ItemRow separator={separator}>
      <ItemTitle>{title}</ItemTitle>
      <ItemValue variant={variant} fontVariant={fontVariant}>
        {value}
      </ItemValue>
    </ItemRow>
  );
}

type ItemRowProps = {|
  ...ViewProps,
  separator?: boolean,
|};

export const ItemRow: React.ComponentType<ItemRowProps> = styled.View`
  flex-direction: row;
  padding: 10px 0;
  ${({ separator = true, theme }) =>
    separator ? `border-top-width: 1px; border-color: ${theme.colors.basic060};` : ''}
`;

export const ItemTitle: React.ComponentType<TextProps> = styled(Text)`
  flex: 1;
  color: ${({ theme }) => theme.colors.basic030};
`;

type ItemValueVariant = 'primary' | 'secondary' | 'positive';

type ItemValueProps = {|
  ...TextProps,
  variant?: ItemValueVariant,
  fontVariant?: FontVariant,
|};

export const ItemValue: React.ComponentType<ItemValueProps> = styled(Text)`
  margin-left: ${spacing.extraSmall}px;
  ${({ variant, theme }) => (variant === 'secondary' ? `color: ${theme.colors.color060}` : '')};
  ${({ variant, theme }) => (variant === 'positive' ? `color: ${theme.colors.positive}` : '')};
  ${({ fontVariant }) => fontVariant ? `font-variant: ${fontVariant}` : ''};
`;
