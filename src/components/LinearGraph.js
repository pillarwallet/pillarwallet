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
import Svg, {
  Polygon,
  Defs,
  LinearGradient,
  Stop,
  Polyline,
  Line,
  Circle,
  G,
  Path,
} from 'react-native-svg';
import { BaseText } from 'components/Typography';

const renderTooltip = (tooltipX: number, tooltipY: number) => {
  const tooltipWidth = 150;
  const tooltipHeight = 40;
  const tipHeight = 10;
  const tipWidth = 20;
  const borderRadius = 5;
  const shadowOffsetY = 5;

  return (
    <G>
      <Defs>
        <LinearGradient id="grad-shadow" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#260a1427" stopOpacity="1" />
          <Stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path
        fill="#106be9"
        fillOpacity="0.73"
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
      <Path
        fill="url(#grad-shadow)"
        d={`
          M ${tooltipX}, ${tooltipY + shadowOffsetY}
          l ${tipWidth / 2}, -${tipHeight}
          h ${((tooltipWidth - tipWidth) / 2) - borderRadius}
          a ${borderRadius}, ${borderRadius}, 0, 0, 0, ${borderRadius} -${borderRadius}
          v -${shadowOffsetY}
          a ${borderRadius}, ${borderRadius}, 0, 0, 1, -${borderRadius} ${borderRadius}
          h -${((tooltipWidth - tipWidth) / 2) - borderRadius}
          l -${tipWidth / 2}, ${tipHeight}
          l -${tipWidth / 2}, -${tipHeight}
          h -${((tooltipWidth - tipWidth) / 2) - borderRadius}
          a ${borderRadius}, ${borderRadius}, 0, 0, 1, -${borderRadius} -${borderRadius}
          v ${shadowOffsetY}
          a ${borderRadius}, ${borderRadius}, 0, 0, 0, ${borderRadius}, ${borderRadius}
          h ${((tooltipWidth - tipWidth) / 2) - borderRadius}
          l ${tipWidth / 2}, ${tipHeight}
          z
        `}
      />
    </G>
  );
};

const LinearGraph = () => {
  const width = 350;
  const graphWidth = 175;
  const height = 200;
  const data = [50, 100, 20, 400, 380, 250, 210, 100, 230, 74, 20, 40, 120, 200, 340];
  const maxY = Math.max(...data) * 1.2;
  const maxX = data.length - 1;
  const linePoints = data.map((y, x) => `${(x / maxX) * graphWidth},${height - ((y / maxY) * height)}`).join();
  const polygonPoints = `${linePoints} ${graphWidth},${height} 0,${height}`;
  const lastElementY = height - ((data[data.length - 1] / maxY) * height);

  const renderHorizontalLine = (y) => {
    return (
      <Line
        x1="0"
        y1={y}
        x2={width}
        y2={y}
        stroke="#3a66ab"
        strokeWidth="1"
        strokeOpacity="0.23"
        strokeDasharray="5, 2"
      />
    );
  };

  return (
    <Svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
    >
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#007eff" stopOpacity="0.12" />
          <Stop offset="1" stopColor="#ffffff" stopOpacity="0.12" />
        </LinearGradient>
      </Defs>
      {renderHorizontalLine(0)}
      {renderHorizontalLine(height / 2)}
      {renderHorizontalLine(height)}
      <Polygon
        points={polygonPoints}
        fill="url(#grad)"
      />
      <Polyline
        points={linePoints}
        fill="none"
        stroke="#007aff"
        strokeWidth="1"
      />
      <Circle cx={graphWidth} cy={lastElementY} r="4.5" fill="#007aff" />
      <Circle
        cx={graphWidth}
        cy={lastElementY}
        r="3.5"
        fill="none"
        stroke="#86ffff"
        strokeWidth="2"
        strokeOpacity="0.52"
      />
      {renderTooltip(graphWidth, lastElementY)}
    </Svg>
  );
};

export default LinearGraph;
