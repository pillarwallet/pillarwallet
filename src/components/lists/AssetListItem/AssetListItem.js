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
import { BigNumber } from 'bignumber.js';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';

// Local
import { Container, LeftAddOn, Icon, Name, Balance } from './components';


type Props = {|
  chain: Chain,
  name: ?string,
  iconUrl: ?string,
  address?: string,
  symbol?: string,
  balance?: ?BigNumber,
  onPress?: () => mixed,
  onPressBalance?: () => mixed,
  leftAddOn?: React.Node,
  style?: ViewStyleProp,
|};

/**
 * Standard Asset list item displaying icon, name, and optionally balance and left add-on (e.g. checkbox).
 *
 * In case you needed more customized asset item layout, instead of adding specific props, please use individual
 * low-level building blocks exported from `./components` file in order to assemble the required item layout.
 */
function AssetListItem({
  chain,
  name,
  symbol,
  address,
  iconUrl,
  balance,
  onPress,
  onPressBalance,
  leftAddOn,
  style,
}: Props) {
  return (
    <Container onPress={onPress} disabled={!onPress} style={style}>
      {!!leftAddOn && <LeftAddOn>{leftAddOn}</LeftAddOn>}

      <Icon url={iconUrl} />
      <Name>{name}</Name>

      {!!symbol && !!address && (
        <Balance
          chain={chain}
          assetSymbol={symbol}
          assetAddress={address}
          balance={balance}
          onPress={onPressBalance}
        />
      )}
    </Container>
  );
}

export default AssetListItem;

