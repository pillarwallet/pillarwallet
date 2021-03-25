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

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { Value } from 'utils/common';

// Local
import { Container, LeftAddOn, Icon, Name, Balance } from './components';

type Props = {|
  name: ?string,
  iconUrl: ?string,
  symbol?: string,
  balance?: ?Value,
  onPress?: () => mixed,
  onPressValue?: () => mixed,
  leftAddOn?: React.Node,
  style?: ViewStyleProp,
|};

/**
 * Standard Asset list item displaying icon, name, and optionally balance and left add-on (e.g. checkbox).
 *
 * In case you needed more customized asset item layout, please use individual parts exported from `./components` file.
 */
function AssetListItem({
  name,
  symbol,
  iconUrl,
  balance,
  onPress,
  onPressValue,
  leftAddOn,
  style,
}: Props) {
  return (
    <Container onPress={onPress} disabled={!onPress} style={style}>
      {!!leftAddOn && <LeftAddOn>{leftAddOn}</LeftAddOn>}

      <Icon url={iconUrl} />
      <Name>{name}</Name>
      {!!symbol && balance != null && <Balance symbol={symbol} balance={balance} onPress={onPressValue} />}
    </Container>
  );
}

export default AssetListItem;

