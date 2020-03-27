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
import { withTheme } from 'styled-components/native';
import { TouchableOpacity } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { getThemeColors } from 'utils/themes';

const RadioButton = ({ checked, onPress, theme }) => {
  const colors = getThemeColors(theme);
  return (
    <TouchableOpacity onPress={onPress}>
      <Svg width={20} height={21} viewBox="0 0 20 21">
        <G fill="none" fill-rule="evenodd">
          <Circle cx="10" cy="11" r="9.5" stroke="#B7B8BB" />
          {checked && <Circle cx="10" cy="11" r="6" fill={colors.positive} />}
        </G>
      </Svg>
    </TouchableOpacity>
  );
};

export default withTheme(RadioButton);
