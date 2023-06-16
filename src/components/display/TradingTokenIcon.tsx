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
import { IconComponentPerChain } from 'components/core/Icon';

// Utils
import { useThemeColors } from 'utils/themes';
import { useThemedImages } from 'utils/images';

// Types
import type { ViewStyleProp, ImageStyleProp } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';

type Props = {
  url: string;
  chain?: Chain;
  size?: number;
  style?: ViewStyleProp;
  imageStyle?: ImageStyleProp;
};

function TradingTokenIcon({ url, size = 48, chain, style, imageStyle }: Props) {
  const { genericToken } = useThemedImages();
  const colors = useThemeColors();

  const source = url ? { uri: url } : genericToken;
  const imageSizeStyle = {
    borderRadius: size / 2,
  };

  const ChainIcon = chain ? IconComponentPerChain[chain] : undefined;

  const iconSizeStyle = { borderColor: colors.card, borderWidth: 1 };
  const iconStyle = { height: size + 1, width: size + 1, backgroundColor: colors.basic050 };

  return (
    <Container style={[style, { width: size * 1.5, height: size * 1.5 }]}>
      {!!ChainIcon && (
        <ChainIconWrapper style={{ left: 0, top: 0 }}>
          <ChainIcon width={size} height={size} />
        </ChainIconWrapper>
      )}

      <IconContainer style={[iconSizeStyle, iconStyle, imageSizeStyle]}>
        <CollectibleImage
          source={source}
          resizeMode="cover"
          width={size}
          height={size}
          style={[imageSizeStyle, imageStyle]}
          fallbackSource={genericToken}
        />
      </IconContainer>
    </Container>
  );
}

export default TradingTokenIcon;

const Container = styled.View`
  align-items: flex-end;
  justify-content: flex-end;
`;

const ChainIconWrapper = styled.View`
  position: absolute;
`;

const IconContainer = styled.View``;
