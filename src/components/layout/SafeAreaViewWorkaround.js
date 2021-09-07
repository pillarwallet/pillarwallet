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
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';

type Props = {|
  style?: ViewStyleProp,
  children?: React.Node,
|};

/**
 * SafeAreaView replacement for cases when the view experiences strange shaking behavior (e.g. inside SlideModal).
 */
function SafeAreaViewWorkaround({ style, children }: Props) {
  const safeArea = useSafeAreaInsets();

  const resultStyle = StyleSheet.flatten(style);
  const paddingBottom =
    (resultStyle?.paddingBottom ?? resultStyle?.paddingVertical ?? resultStyle?.padding ?? 0) + safeArea.bottom;

  return <View style={[style, { paddingBottom }]}>{children}</View>;
}

export default SafeAreaViewWorkaround;
