// @flow
import * as React from 'react';
import { Platform, PixelRatio, View } from 'react-native';
import { BoxShadow } from 'react-native-shadow';
import styled from 'styled-components/native';
import { UIColors } from 'utils/variables';
import NativeAndroidShadow from './NativeAndroidShadow';

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
  shadowBorder?: number,
  marginVertical?: number
};

const ShadowInnerWrapper = styled.View`
  height: ${props => props.heightWithPaddings}px;
`;

export const Shadow = (props: Props) => {
  const {
    children,
    shadowOffsetX = 1,
    shadowOffsetY = 2,
    shadowDistance = 4,
    shadowRadius = 6,
    shadowSpread = 18,
    widthAndroid,
    heightAndroid,
    shadowBorder = 10,
    marginVertical = 0,
    widthIOS = 100,
    heightIOS = 70,
    shadowColorAndroid = '#14105baa',
    shadowColoriOS = UIColors.cardShadowColor,
  } = props;

  const pixelRatio = PixelRatio.get();

  let sDistance = shadowDistance;
  let sSpread = shadowSpread;

  if (pixelRatio < 2) {
    sDistance = (shadowDistance * pixelRatio) / 2;
    sSpread = (shadowSpread * pixelRatio) / 2;
  }


  const widthWithPaddings = widthAndroid
    ? widthAndroid + (((sDistance + sSpread) * 2) / pixelRatio)
    : '100%';
  const heightWithPaddings = heightAndroid
    ? heightAndroid + (((sDistance + sSpread) * 2) / pixelRatio)
    : '100%';

  if (Platform.OS === 'ios') {
    return (
      <BoxShadow
        setting={{
          color: shadowColoriOS,
          x: shadowOffsetX,
          y: shadowOffsetY,
          opacity: 1,
          radius: shadowRadius,
          width: widthIOS,
          height: heightIOS,
          border: shadowBorder,
          style: {
            marginVertical,
          },
        }}
      >
        {children}
      </BoxShadow >
    );
  }
  return (
    <View style={{ width: widthWithPaddings }}>
      <NativeAndroidShadow
        shadowAngle={90}
        shadowRadius={sSpread}
        shadowDistance={sDistance}
        shadowColor={shadowColorAndroid}
      >
        <ShadowInnerWrapper
          heightWithPaddings={heightWithPaddings}
        >
          {children}
        </ShadowInnerWrapper>
      </NativeAndroidShadow>
    </View>
  );
};
