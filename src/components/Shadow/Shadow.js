// @flow
import * as React from 'react';
import { Platform, View } from 'react-native';
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
};

const ShadowWrapper = styled.View`
  shadow-color: ${UIColors.cardShadowColor};
  shadow-offset: ${props => `${props.shadowOffsetX}px ${props.shadowOffsetY}px`};
  shadow-opacity: 1;
  shadow-radius: ${props => props.shadowRadius}px;
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
    paddingFixAndroid,
    shadowColorAndroid = '#14105baa',
  } = props;

  const paddingFix = paddingFixAndroid || shadowSpread - (shadowDistance / 2);

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
      style={{ paddingRight: paddingFix, paddingBottom: paddingFix }}
    >
      <View style={{ width: '100%' }}>
        {children}
      </View>
    </NativeAndroidShadow>
  );
};
