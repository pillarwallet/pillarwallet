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
import { spacing } from 'utils/variables';

// Types
import type { ViewStyleProp, ImageStyleProp } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';

// Assets
import IconEthereum from 'assets/icons/svg/icon-24-ethereum.svg';
import IconBinance from 'assets/icons/svg/icon-24-binance.svg';
import IconPolygon from 'assets/icons/svg/icon-24-polygon.svg';
import IconAvalanche from 'assets/icons/svg/icon-24-avalanche.svg';
import IconOptimism from 'assets/icons/svg/icon-24-optimism.svg';
import IconGnosis from 'assets/icons/svg/icon-24-gnosis.svg';
import IconArbitrum from 'assets/icons/svg/icon-24-arbitrum.svg';

type Props = {|
  url: ?string,
  chain?: ?Chain,
  size?: number,
  style?: ViewStyleProp,
  imageStyle?: ImageStyleProp,
  chainIconStyle?: ViewStyleProp,
  setMarginRight?: boolean,
|};

function TokenIcon({ url, size = 48, chain, style, imageStyle, chainIconStyle, setMarginRight }: Props) {
  const { genericToken } = useThemedImages();
  const colors = useThemeColors();

  const source = url ? { uri: url } : genericToken;
  const imageSizeStyle = setMarginRight
    ? {
      borderRadius: size / 2,
      marginRight: spacing.medium,
    }
    : {
      borderRadius: size / 2,
    };

  const ChainIcon = chain ? IconComponentPerChain[chain] : undefined;

  const chainIconSize = size / 2;
  const chainIconSizeStyle = { borderRadius: chainIconSize, borderColor: colors.card };

  return (
    <Container style={style}>
      <IconContainer size={size}>
        <CollectibleImage
          source={source}
          resizeMode="cover"
          width={size}
          height={size}
          style={[imageSizeStyle, imageStyle]}
          fallbackSource={genericToken}
        />
      </IconContainer>

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
  xdai: IconGnosis,
  avalanche: IconAvalanche,
  optimism: IconOptimism,
  arbitrum: IconArbitrum,
};

const Container = styled.View``;

const ChainIconWrapper = styled.View`
  position: absolute;
  top: -1px;
  right: -1px;
  border-width: 1px;
`;

const IconContainer = styled.View`
  height: ${({ size }) => size};
  width: ${({ size }) => size};
  background-color: ${({ theme }) => theme.colors.basic050};
  border-radius: ${({ size }) => size / 2};
`;
