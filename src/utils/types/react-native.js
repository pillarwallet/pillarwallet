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

/* eslint-disable max-len */

/**
 * Provided encapsulated access to React Native types.
 *
 * Most reliable way to access these types is to import from `react-native/Libraries`, which means we rely on
 * implementation details. This file centralizes the exports so that they are easier to maintain.
 *
 */

import * as React from 'react';
import { ScrollView } from 'react-native';

// Props
export type { Props as ViewProps } from 'react-native/Libraries/Components/View/View';
export type { TextProps } from 'react-native/Libraries/Text/TextProps';

export type { ViewStyleProp, TextStyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';

export type { RenderItemProps } from 'react-native/Libraries/Lists/VirtualizedList';

export type { StatusBarStyle } from 'react-native/Libraries/Components/StatusBar/StatusBar';

export type KeyboardShouldPersistTaps = $PropertyType<React.ElementConfig<typeof ScrollView>, 'keyboardShouldPersistTaps'>;

// Events
export type { LayoutEvent } from 'react-native/Libraries/Types/CoreEventTypes';
