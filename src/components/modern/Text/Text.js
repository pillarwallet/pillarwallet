/* eslint-disable i18next/no-literal-string */
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

// Utils
import { appFont, fontStyles } from 'utils/variables';

// Types
import type { TextProps } from 'utils/types/react-native';

type TextVariant = $Keys<typeof fontStyles>;

type Props = {|
  ...TextProps,
  variant?: TextVariant,
|};

const Text: React.ComponentType<Props> = styled.Text`
  text-align-vertical: center;
  font-family: "${appFont.regular}";
  color: ${({ theme }) => theme.colors.basic010};
  ${({ variant = 'regular' }) => fontStyles[variant]};
`;

export default Text;
