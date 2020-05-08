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
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components';
import { BaseText } from 'components/Typography';
import { fontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';

type Props = {
  onPress: () => void;
}

const Text = styled(BaseText)`
  color: ${themedColors.link};
  ${fontStyles.regular};
`;

const SellMaxButton = (props: Props) => (
  <TouchableOpacity
    style={{
      position: 'absolute', right: 16, top: 16, zIndex: 1000,
    }}
    onPress={props.onPress}
    hitSlop={{
      top: 10, bottom: 10, left: 10, right: 10,
    }}
  >
    <Text>Sell max</Text>
  </TouchableOpacity>
);

export default SellMaxButton;
