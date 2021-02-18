// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

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
import { View } from 'react-native';
import { withTheme } from 'styled-components/native';
import { MaterialIndicator } from 'react-native-indicators';
import { getThemeColors } from 'utils/themes';

import type { Theme } from 'models/Theme';
import type { ViewStyleProp } from 'utils/types/react-native';

type Props = {|
  basic?: boolean,
  size?: number,
  trackWidth?: number,
  color?: ?string,
  style?: ViewStyleProp,
  theme?: Theme,
|};

const getSpinnerColor = (props: Props) => {
  const { theme, basic, color } = props;
  if (color) return color;
  const colors = getThemeColors(theme);
  if (basic) return colors.basic090;
  return colors.primaryAccent130;
};

const Spinner = (props: Props) => {
  const {
    size = 40,
    trackWidth = 3,
    style,
  } = props;
  const spinnerColor = getSpinnerColor(props);
  return (
    <View style={{ height: size }}>
      <MaterialIndicator size={size} trackWidth={trackWidth} color={spinnerColor} style={style} />
    </View>
  );
};

export default (withTheme(Spinner): React.ComponentType<Props>);
