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

// Components
import CollectibleImage from 'components/CollectibleImage';

// Utils
import { useThemeColors } from 'utils/themes';
import { useThemedImages } from 'utils/images';

// Types
import type { ViewStyleProp, ImageStyleProp } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';

// Assets
import IconEthereum from 'assets/icons/svg/icon-24-ethereum.svg';
import IconBinance from 'assets/icons/svg/icon-24-binance.svg';
import IconXdai from 'assets/icons/svg/icon-24-xdai.svg';
import IconPolygon from 'assets/icons/svg/icon-24-polygon.svg';

type Props = {|
  url: ?string,
  chain?: ?Chain,
  size?: number,
  style?: ViewStyleProp,
  imageStyle?: ImageStyleProp,
  chainIconStyle?: ViewStyleProp,
|};

function TokenIcon({ url, size = 48, chain, style, imageStyle, chainIconStyle }: Props) {
  const { genericToken } = useThemedImages();
  const colors = useThemeColors();

  const source = url ? { uri: url } : genericToken;
  const imageSizeStyle = {
    borderRadius: size / 2,
  };

  const ChainIcon = chain ? IconComponentPerChain[chain] : undefined;

  const chainIconSize = size / 2;
  const chainIconSizeStyle = { borderRadius: chainIconSize / 2, borderColor: colors.card };

  return (
    <Container style={style}>
      <CollectibleImage
        source={source}
        resizeMode="contain"
        width={size}
        height={size}
        style={[imageSizeStyle, imageStyle]}
        fallbackSource={genericToken}
      />

      {!!ChainIcon && (
        <ChainIconWrapper style={[chainIconSizeStyle, chainIconStyle]}>
          <ChainIcon width={chainIconSize} height={chainIconSize} />
        </ChainIconWrapper>
      )}
    </Container>
  );
}

export default TokenIcon;

const IconComponentPerChain = {
  ethereum: IconEthereum,
  polygon: IconPolygon,
  binance: IconBinance,
  xdai: IconXdai,
};

const Container = styled.View``;

const ChainIconWrapper = styled.View`
  position: absolute;
  top: -1px;
  right: -1px;
  border-width: 1px;
`;
