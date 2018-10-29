// @flow
import * as React from 'react';
import { Platform, PixelRatio, View } from 'react-native';
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
  widthAndroid?: number | string,
  heightAndroid?: number | string,
};

const ShadowWrapper = styled.View`
  shadow-color: ${props => props.shadowColor};
  shadow-offset: ${props => `${props.shadowOffsetX}px ${props.shadowOffsetY}px`};
  shadow-opacity: 1;
  shadow-radius: ${props => props.shadowRadius}px;
`;

const ShadowInnerWrapper = styled.View`
  height: ${props => props.heightWithPaddings}px;
`;

export const Shadow = (props: Props) => {
  const {
    children,
    style,
    shadowOffsetX = 0,
    shadowOffsetY = 3,
    shadowDistance = 4,
    shadowRadius = 6,
    shadowSpread = 18,
    widthAndroid,
    heightAndroid,
    shadowColorAndroid = '#14105baa',
    shadowColoriOS = UIColors.cardShadowColor,
  } = props;

  const pixelRatio = PixelRatio.get();
  const widthWithPaddings = widthAndroid
    ? widthAndroid + (((shadowDistance + shadowSpread) * 2) / pixelRatio)
    : '100%';
  const heightWithPaddings = heightAndroid
    ? heightAndroid + (((shadowDistance + shadowSpread) * 2) / pixelRatio)
    : '100%';

  if (Platform.OS === 'ios') {
    return (
      <ShadowWrapper
        style={style}
        shadowOffsetX={shadowOffsetX}
        shadowOffsetY={shadowOffsetY}
        shadowRadius={shadowRadius}
        shadowColor={shadowColoriOS}
      >
        {children}
      </ShadowWrapper>
    );
  }
  return (
    <View style={{ width: widthWithPaddings }}>
      <NativeAndroidShadow
        shadowAngle={90}
        shadowRadius={shadowSpread}
        shadowDistance={shadowDistance}
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
