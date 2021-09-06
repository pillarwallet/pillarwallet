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
import React, { useState } from 'react';
import { View, PanResponder } from 'react-native';
import Svg, {
  Polyline,
  Circle,
  Path,
  ForeignObject,
} from 'react-native-svg';
import { withTheme } from 'styled-components/native';
import { BaseText } from 'components/legacy/Typography';
import { getThemeColors } from 'utils/themes';
import type { Theme } from 'models/Theme';

// x,y are in range [0,1]
type DataPoint = {
  x: number,
  y: number,
};

type DataPoints = DataPoint[];

type Props = {
  data: DataPoints,
  width: number,
  height: number,
  getTooltipContents: (point: number) => string,
  getXAxisValue: (x: number) => string,
  getYAxisValue: (y: number) => string,
  extra: string,
  xAxisValuesCount: number,
  theme: Theme,
  onGestureStart: () => void,
  onGestureEnd: () => void,
};

const range = (end: number): number[] => {
  return [...Array(end).keys()];
};

const Graph = ({
  data, width, height, getTooltipContents, getYAxisValue, getXAxisValue,
  xAxisValuesCount, extra, theme, onGestureStart, onGestureEnd,
}: Props) => {
  const [activeDataPoint, setActiveDataPoint] = useState(data.length - 1);
  const safeActiveDataPoint = activeDataPoint >= data.length ? data.length - 1 : activeDataPoint;

  const graphPaddingTop = 60;
  const graphPaddingBottom = 20;
  const graphHeight = height - graphPaddingTop - graphPaddingBottom;
  const graphPaddingHorizontal = 20;
  const graphWidth = width - (graphPaddingHorizontal * 2);

  const colors = getThemeColors(theme);

  const getScreenX = (x: number) => {
    return (x * graphWidth) + graphPaddingHorizontal;
  };

  const getScreenY = (y: number) => {
    return ((1 - y) * graphHeight) + graphPaddingTop;
  };

  const renderYAxis = () => {
    const yAxisValuesCount = 3;
    const values = range(yAxisValuesCount).map(v => getYAxisValue((v + 1) / (yAxisValuesCount)));

    return (
      <ForeignObject width={width} height={height} x={graphPaddingHorizontal} y={0}>
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
          {values.map((v, i) => (
            <BaseText
              tiny
              style={{ position: 'absolute', left: 4, top: getScreenY((i + 1) / (yAxisValuesCount)) }}
              key={i}
              secondary
            >
              {v}
            </BaseText>
          ))}
        </View>
      </ForeignObject>
    );
  };

  const renderXAxis = () => {
    const values = range(xAxisValuesCount).map(v => getXAxisValue(v / (xAxisValuesCount - 1)));
    const valueWidth = 55;

    return (
      <ForeignObject y={height - 12}>
        <View style={{ width, flexDirection: 'row', backgroundColor: 'transparent' }}>
          {values.map((v, i) => (
            <BaseText
              style={{
                width: valueWidth,
                position: 'absolute',
                left: ((i * ((graphWidth) / (xAxisValuesCount - 1))) - (valueWidth / 2)) + graphPaddingHorizontal,
              }}
              center
              tiny
              secondary
              key={`${i}-${v}`}
            >
              {v}
            </BaseText>
          ))}
        </View>
      </ForeignObject>
    );
  };

  const renderTooltip = (tooltipX: number, tooltipY: number) => {
    const content = getTooltipContents(safeActiveDataPoint);

    const tooltipWidth = 80;
    const tooltipHeight = 40;
    const tipHeight = 7;
    const tipWidth = 10;
    const borderRadius = 4;

    return (
      <>
        <Path
          fill={colors.graphPrimaryColor}
          d={`
            M ${tooltipX}, ${tooltipY}
            l ${tipWidth / 2}, -${tipHeight}
            h ${((tooltipWidth - tipWidth) / 2) - borderRadius}
            a ${borderRadius}, ${borderRadius}, 0, 0, 0, ${borderRadius} -${borderRadius}
            v -${tooltipHeight - (2 * borderRadius)}
            a ${borderRadius}, ${borderRadius}, 0, 0, 0, -${borderRadius}, -${borderRadius}
            h -${tooltipWidth - (2 * borderRadius)}
            a ${borderRadius}, ${borderRadius}, 0, 0, 0, -${borderRadius}, ${borderRadius}
            v ${tooltipHeight - (2 * borderRadius)}
            a ${borderRadius}, ${borderRadius}, 0, 0, 0, ${borderRadius}, ${borderRadius}
            h ${((tooltipWidth - tipWidth) / 2) - borderRadius}
            l ${tipWidth / 2}, ${tipHeight}
            z
        `}
        />
        <ForeignObject
          x={tooltipX - (tooltipWidth / 2)}
          y={tooltipY - tooltipHeight - tipHeight}
          width={tooltipWidth}
          // https://github.com/react-native-community/react-native-svg/issues/1357
          // the key here is a workaround for the above bug
          // if you don't set it, then the values on the x-axis (yes, x-axis!)
          // will be disappearing on iOS when switching between time ranges
          key={`${content}${extra || ''}`}
        >
          <View style={{ width: tooltipWidth, height: tooltipHeight, justifyContent: 'center' }}>
            <BaseText center small color={colors.basic090}>{content}</BaseText>
          </View>
        </ForeignObject>
      </>
    );
  };

  const updateActivePoint = (x: number) => {
    const biggerIndex = data.findIndex(p => getScreenX(p.x) > x);
    let newActivePoint;
    if (biggerIndex === -1) {
      newActivePoint = data.length - 1;
    } else {
      const smallerIndex = Math.max(biggerIndex - 1, 0);
      const leftEnd = getScreenX(data[smallerIndex].x);
      const rightEnd = getScreenX(data[biggerIndex].x);

      newActivePoint = (leftEnd + ((rightEnd - leftEnd) / 2) < x) ? biggerIndex : smallerIndex;
    }
    if (newActivePoint !== activeDataPoint) {
      setActiveDataPoint(newActivePoint);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: (evt, gestureState) => {
      onGestureStart();
      updateActivePoint(gestureState.x0);
    },
    onPanResponderMove: (evt, gestureState) => {
      updateActivePoint(gestureState.moveX);
    },
    onPanResponderTerminationRequest: () => true,
    onPanResponderRelease: () => {
      onGestureEnd();
      return true;
    },
    onPanResponderTerminate: () => {
      onGestureEnd();
      return true;
    },
    onShouldBlockNativeResponder: () => true,
  });

  const linePoints = data.map(({ x, y }) => `${getScreenX(x)},${getScreenY(y)}`);
  const activePointX = getScreenX(data[safeActiveDataPoint].x);
  const activePointY = getScreenY(data[safeActiveDataPoint].y);

  return (
    <View {...panResponder.panHandlers}>
      <Svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        preserveAspectRatio="none"
      >
        {renderYAxis()}
        {renderXAxis()}
        <Polyline
          points={linePoints.join(' ')}
          fill="none"
          stroke={colors.graphPrimaryColor}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <Circle
          cx={activePointX}
          cy={activePointY}
          r="3.5"
          fill={colors.graphPrimaryColor}
          stroke={colors.basic070}
          strokeWidth="2"
        />
        {renderTooltip(activePointX, activePointY - 10)}
      </Svg>
    </View>
  );
};

export default withTheme(Graph);
