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
import Image from 'components/Image';

// Utils
import { useThemedImages } from 'utils/images';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';

type Props = {|
  url: ?string,
  diameter?: number,
  style?: ViewStyleProp
|};

function TokenIcon({ url, diameter = 48, style }: Props) {
  const { genericToken } = useThemedImages();

  const source = url ? { uri: url } : genericToken;

  const basicStyle = {
    width: diameter,
    height: diameter,
    borderRadius: diameter / 2,
  };

  return <Image source={source} style={[basicStyle, style]} />;
}

export default TokenIcon;
