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
import { Platform, PixelRatio, View } from 'react-native';
import { Shadow as BoxShadow } from 'react-native-shadow-2';
import styled from 'styled-components/native';

type Props = {
  children?: React.Node,
  style?: Object,
  shadowOffsetX?: number,
  shadowOffsetY?: number,
  shadowDistance?: number,
  shadowRadius?: number,
  shadowSpread?: number,
  paddingFixAndroid?: number,
  shadowColorAndroid?: string,
  shadowColoriOS?: string,
  widthIOS: number,
  heightIOS: number,
  widthAndroid?: number | string,
  heightAndroid?: number | string,
  marginVertical?: number,
  useSVGShadow?: boolean,
  wrapperStyle?: Object,
};

const ShadowInnerWrapper = styled.View`
  height: ${(props) => props.heightWithPaddings};
`;

export const Shadow = (props: Props) => {
  const {
    children,
    shadowOffsetX = 1,
    shadowOffsetY = 1,
    shadowDistance = 4,
    shadowRadius = 6,
    shadowSpread = 18,
    widthAndroid,
    heightAndroid,
    marginVertical = 0,
    widthIOS = 100,
    heightIOS = 70,
    shadowColorAndroid = '#14105baa',
    shadowColoriOS = '#EEF3F9',
    useSVGShadow,
    wrapperStyle,
  } = props;

  const pixelRatio = PixelRatio.get();

  let sDistance = shadowDistance;
  let sSpread = shadowSpread;

  if (pixelRatio < 2) {
    sDistance = (shadowDistance * pixelRatio) / 2;
    sSpread = (shadowSpread * pixelRatio) / 2;
  }

  // eslint-disable-next-line no-mixed-operators
  const widthWithPaddings = widthAndroid ? widthAndroid + ((sDistance + sSpread) * 2) / pixelRatio : '100%';
  // eslint-disable-next-line no-mixed-operators
  const heightWithPaddings = heightAndroid ? `${heightAndroid + ((sDistance + sSpread) * 2) / pixelRatio}px` : '100%';

  if (Platform.OS === 'ios' || useSVGShadow) {
    return (
      <View style={[{ position: 'relative' }, wrapperStyle]}>
        <BoxShadow
          finalColor={shadowColoriOS}
          radius={shadowRadius}
          offset={[shadowOffsetX, shadowOffsetY]}
          viewStyle={{ marginVertical }}
          size={[widthIOS, heightIOS]}
        >
          {children}
        </BoxShadow>
      </View>
    );
  }

  return (
    <View style={[{ width: widthWithPaddings }, wrapperStyle]}>
      <BoxShadow radius={sSpread} distance={sDistance} finalColor={shadowColorAndroid}>
        <ShadowInnerWrapper heightWithPaddings={heightWithPaddings}>{children}</ShadowInnerWrapper>
      </BoxShadow>
    </View>
  );
};
