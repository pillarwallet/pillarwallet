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
import { Image } from 'react-native';

// Utils
import { useThemedImages } from 'utils/images';

// Types
import type { ImageStyleProp } from 'utils/types/react-native';
import type { Currency } from 'models/Rates';

// Assets
const iconUSD = require('assets/icons/icon-48-fiat-usd.png');
const iconEUR = require('assets/icons/icon-48-fiat-eur.png');
const iconGBP = require('assets/icons/icon-48-fiat-gbp.png');

type Props = {|
  currency: Currency,
  size?: number,
  style?: ImageStyleProp,
|};

function FiatIcon({ currency, size = 48, style }: Props) {
  const { genericToken } = useThemedImages();

  const source = iconSoureForCurrency[currency] ?? genericToken;
  const sizeStyle = { width: size, height: size };

  return <Image source={source} style={[sizeStyle, style]} />;
}

export default FiatIcon;

const iconSoureForCurrency = {
  USD: iconUSD,
  EUR: iconEUR,
  GBP: iconGBP,
};
