// @flow
import * as React from 'react';
import { Platform, PixelRatio } from 'react-native';
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
  widthAndroid?: number | string,
  heightAndroid?: number | string,
};

const ShadowWrapper = styled.View`
  shadow-color: ${UIColors.cardShadowColor};
  shadow-offset: ${props => `${props.shadowOffsetX}px ${props.shadowOffsetY}px`};
  shadow-opacity: 1;
  shadow-radius: ${props => props.shadowRadius}px;
`;

const ShadowInnerWrapper = styled.View`
  height: ${props => props.heightWithPaddings}px;
  ${props => props.widthWithPaddings ? `width: ${props.widthWithPaddings}px;` : ''}
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
  } = props;

  const pixelRatio = PixelRatio.get();

  const widthWithPaddings = widthAndroid
    ? widthAndroid + (((shadowDistance + shadowRadius) * 4) / pixelRatio)
    : '100%';
  const heightWithPaddings = heightAndroid
    ? heightAndroid + (((shadowDistance + shadowRadius) * 4) / pixelRatio)
    : '100%';

  if (Platform.OS === 'ios') {
    return (
      <ShadowWrapper
        style={style}
        shadowOffsetX={shadowOffsetX}
        shadowOffsetY={shadowOffsetY}
        shadowRadius={shadowRadius}
      >
        {children}
      </ShadowWrapper>
    );
  }
  return (
    <NativeAndroidShadow
      shadowAngle={90}
      shadowRadius={shadowSpread}
      shadowDistance={shadowDistance}
      shadowColor={shadowColorAndroid}
    >
      <ShadowInnerWrapper
        widthWithPaddings={widthAndroid ? widthWithPaddings : null}
        heightWithPaddings={heightWithPaddings}
      >
        {children}
      </ShadowInnerWrapper>
    </NativeAndroidShadow>
  );
};
