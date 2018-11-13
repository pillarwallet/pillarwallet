// @flow
import * as React from 'react';
import { Dimensions, Image } from 'react-native';
import styled from 'styled-components/native';
import { baseColors } from 'utils/variables';
import { CachedImage } from 'react-native-cached-image';
import {
  ColorMatrix,
  saturate,
} from 'react-native-color-matrix-image-filters';

type State = {
}

type Props = {
  token: string,
  icon: string,
  isListed: boolean,
}

const windowWidth = Dimensions.get('window').width;

const PatternWrapper = styled.View`
  width: 100%;
  height: 250px;
`;

const NoIconWrapper = styled.View`
  width: 100%;
  height: 220px;
  margin-top: 14px;
  margin-bottom: 20px;
  align-items: center;
  justify-content: center;
  opacity: ${props => props.isUnlisted ? 0.7 : 1};
`;

const noIconImageSource = require('assets/images/no_logo.png');

const IconWrapper = styled.View`
  height: ${props => props.diameter}px;
  width: ${props => props.diameter}px;
  border: 2px solid ${baseColors.white};
  position: absolute;
  z-index: ${props => props.zIndex};
  top: ${props => props.top}px;
  left: ${props => props.left}px;
  justify-content: center;
  align-items: center;
  elevation: ${props => props.elevation};
  shadow-color: ${baseColors.black};
  shadow-offset: 0px 3px;
  shadow-opacity: ${props => props.shadowOpacity};
  shadow-radius: 6px;
  background-color: ${baseColors.white};
`;

const NoIconImage = styled(CachedImage)`
  height: 192px;
  width: 192px;
`;

export default class AssetPattern extends React.Component<Props, State> {
  generatePattern = (token: string, icon: string, isListed: boolean) => {
    const paternDetails = [];
    const uniqueCode = [];
    [...token].forEach((letter) => {
      uniqueCode.push(letter.charCodeAt(0));
    });

    const compositionSymetrySideYAxis = uniqueCode[0] % 2 === 0 || !uniqueCode[2];
    const sideIconsTop = uniqueCode[0];
    const innerIconsTop = uniqueCode[2] || uniqueCode[1];
    const sidePositionPositivity = uniqueCode[0] > uniqueCode[1];
    const innerPositionPositivity = uniqueCode[1] % 2 === 0;
    const innerIconsLeft = (54 - (uniqueCode[0] / 2)) + (uniqueCode[1] / 1.5);
    const sideIconsLeft = uniqueCode[2] ? (uniqueCode[2] / 2.5) + uniqueCode[1] : (uniqueCode[0] / 2.5) + uniqueCode[1];

    for (let i = 0; i < 5; i++) {
      let diameter = 108;
      let opacity = 1;
      let zIndex = 3;
      const horizontalCenter = windowWidth / 2;
      let verticalCenter = 125;
      let elevation = 6;
      let shadowOpacity = 0.15;
      let saturation = 1;

      const topSideChange = (up: boolean, isInner: boolean, change: number) => {
        if (isInner && change > 60) change /= 2;
        if (!isInner && change > 80) change /= 2;
        if (innerPositionPositivity !== sidePositionPositivity && !isInner) { change /= 4; }
        if (up) return change * -1;
        return change;
      };

      const biggestDistance = sideIconsTop > innerIconsTop ? sideIconsTop : innerIconsTop;

      if (sidePositionPositivity && innerPositionPositivity && compositionSymetrySideYAxis) {
        verticalCenter = 125 - (topSideChange(true, false, biggestDistance) / 2);
      }
      if (!sidePositionPositivity && !innerPositionPositivity && compositionSymetrySideYAxis) {
        verticalCenter = 125 - (topSideChange(false, false, biggestDistance) / 2);
      }

      let top = verticalCenter;
      let left = windowWidth / 2;

      if (i === 0) {
        top = compositionSymetrySideYAxis && sidePositionPositivity ? top - 20 : top;
      }

      if (i === 1 || i === 4) {
        zIndex = 1;
        opacity = 0.15;
        diameter = 70;
        top = verticalCenter + topSideChange(sidePositionPositivity, false, sideIconsTop);
        if (!compositionSymetrySideYAxis && i === 4) {
          top = verticalCenter + topSideChange(!sidePositionPositivity, false, sideIconsTop);
        }
        elevation = 0;
        shadowOpacity = 0;
        saturation = 0.5;
      }

      if (i === 2 || i === 3) {
        top = verticalCenter + topSideChange(innerPositionPositivity, true, innerIconsTop);
        if (!compositionSymetrySideYAxis && i === 3) {
          top = verticalCenter + topSideChange(!innerPositionPositivity, true, innerIconsTop);
        }
        zIndex = 2;
        opacity = 0.3;
        diameter = 90;
        elevation = 4;
        shadowOpacity = 0.05;
        saturation = 0.7;
      }

      if (i === 1) {
        left = horizontalCenter - sideIconsLeft;
      }

      if (i === 2) {
        left = horizontalCenter - innerIconsLeft;
      }

      if (i === 3) {
        left = horizontalCenter + innerIconsLeft;
      }

      if (i === 4) {
        left = horizontalCenter + sideIconsLeft;
      }

      paternDetails.push(
        <IconWrapper
          key={i}
          diameter={diameter}
          borderRadius={diameter / 2}
          zIndex={zIndex}
          top={top}
          left={left}
          isListed={isListed}
          elevation={elevation}
          shadowOpacity={shadowOpacity}
          style={{
            transform: [
              { translateX: -(diameter / 2) },
              { translateY: -(diameter / 2) },
            ],
          }}
        >
          <ColorMatrix
            matrix={saturate(saturation)}
          >
            <Image
              style={{
                height: diameter - 4,
                width: diameter - 4,
                opacity,
              }}
              source={{ uri: icon }}
              resizeMode="contain"
            />
            {/*
            <CachedImage
              key={token}
              style={{
                height: diameter - 4,
                width: diameter - 4,
                opacity,
              }}
              source={{ uri: icon }}
              resizeMode="contain"
            />
            */}
          </ColorMatrix>
        </IconWrapper>,
      );
    }

    return paternDetails;
  };

  render() {
    const {
      token,
      icon,
      isListed,
    } = this.props;

    if (!isListed || !icon) {
      return (
        <NoIconWrapper isUnlisted={!isListed}>
          <NoIconImage source={noIconImageSource} />
        </NoIconWrapper>
      );
    }

    return (
      <PatternWrapper>
        {this.generatePattern(token, icon, isListed)}
      </PatternWrapper>
    );
  }
}
