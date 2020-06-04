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
import { View, PanResponder } from 'react-native';
import Svg, {
  Polygon,
  Defs,
  LinearGradient,
  Stop,
  Polyline,
  Line,
  Circle,
  Path,
  ForeignObject,
} from 'react-native-svg';
import { BaseText } from 'components/Typography';
import { range } from 'utils/common';

type DataPoint = {
  x: number,
  y: number,
};

type DataPoints = DataPoint[];

type Props = {
  data: DataPoints,
  resolution: number,
  width: number,
  height: number,
  getXAxisValue?: (x: number) => string,
  xAxisValuesCount?: number,
  getYAxisValue?: (y: number) => string,
  yAxisValuesCount?: number,
  getTooltipContent: (dataIndex: number) => string,
  onDragStart?: () => void,
  onDragEnd?: () => void,

  gradientFillTop?: string,
  gradientFillBottom?: string,
  strokeColor?: string,
  tooltipColor?: String,
  tooltipOpacity?: String,
  tooltipTextStyle?: Object,
  xAxisTextStyle?: Object,
  yAxisTextStyle?: Object,
};

type State = {
  activeDataPoint: number,
};

const BOTTOM_MARGIN = 17;
const TOP_MARGIN = 30;
const GRAPH_TOP_PADDING = 25;
const TOOLTIP_OFFSET = 5;

class LinearGraph extends React.Component<Props, State> {
  panResponder: Object;

  constructor(props: Props) {
    super(props);
    this.state = {
      activeDataPoint: props.data.length - 1,
    };
    this.panResponder = this.buildPanResponder();
  }

  getScreenX = (x: number) => {
    const { resolution, width } = this.props;
    return x / resolution * width;
  };

  getScreenY = (y: number) => {
    const { height } = this.props;
    const maxY = this.getMaxY();
    const graphHeight = this.getGraphHeight();
    return height - ((y / maxY) * graphHeight) - BOTTOM_MARGIN;
  }

  getGraphHeight = () => {
    return this.props.height - BOTTOM_MARGIN - TOP_MARGIN;
  }

  getMaxY = () => {
    const maxValue = Math.max(...this.props.data.map(v => v.y));
    const graphHeight = this.getGraphHeight();
    return (maxValue * graphHeight) / (graphHeight - GRAPH_TOP_PADDING);
  }

  updateActivePoint = (x: number) => {
    const { data } = this.props;
    const { activeDataPoint } = this.state;

    const biggerIndex = data.findIndex(p => this.getScreenX(p.x) > x);
    let newActivePoint;
    if (biggerIndex === -1) {
      newActivePoint = data.length - 1;
    } else {
      const smallerIndex = Math.max(biggerIndex - 1, 0);
      const leftEnd = this.getScreenX(data[smallerIndex].x);
      const rightEnd = this.getScreenX(data[biggerIndex].x);

      newActivePoint = (leftEnd + ((rightEnd - leftEnd) / 2) < x) ? biggerIndex : smallerIndex;
    }
    if (newActivePoint !== activeDataPoint) {
      this.setState({ activeDataPoint: newActivePoint });
    }
  }

  onDragStart = () => {
    const { onDragStart } = this.props;
    if (onDragStart) {
      onDragStart();
    }
  }

  onDragEnd = () => {
    const { onDragEnd } = this.props;
    if (onDragEnd) {
      onDragEnd();
    }
  }

  buildPanResponder = () => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        this.updateActivePoint(gestureState.x0);
        this.onDragStart();
      },
      onPanResponderMove: (evt, gestureState) => {
        this.updateActivePoint(gestureState.moveX);
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderRelease: this.onDragEnd,
      onPanResponderTerminate: this.onDragEnd,
      onShouldBlockNativeResponder: () => true,
    });
  }

  renderTooltip = (tooltipX: number, tooltipY: number) => {
    const { getTooltipContent } = this.props;
    const { activeDataPoint } = this.state;
    const content = getTooltipContent(activeDataPoint);

    const tooltipWidth = 75;
    const tooltipHeight = 40;
    const tipHeight = 7;
    const tipWidth = 10;
    const borderRadius = 4;
    const shadowOffsetY = 4;

    const x = (shadowOffsetY) * (tipWidth / (2 * tipHeight));

    return (
      <>
        <Defs>
          <LinearGradient id="grad-shadow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#260a14" stopOpacity="0.2" />
            <Stop offset="1" stopColor="#fff" stopOpacity="0" />
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
            M ${tooltipX + (tipWidth / 2) - x}, ${tooltipY + shadowOffsetY - tipHeight}
            h ${((tooltipWidth - tipWidth) / 2) - (2 * borderRadius) + x}
            a ${borderRadius}, ${borderRadius}, 0, 0, 0, ${borderRadius} -${borderRadius}
            v -${shadowOffsetY - borderRadius}
            h -${((tooltipWidth - tipWidth) / 2) - borderRadius}
            z
          `}
        />
        <Path
          fill="url(#grad-shadow)"
          d={`
            M ${tooltipX - (tipWidth / 2) + x}, ${(tooltipY + shadowOffsetY) - tipHeight}
            h -${((tooltipWidth - tipWidth) / 2) - (2 * borderRadius) + x}
            a ${borderRadius}, ${borderRadius}, 0, 0, 1, -${borderRadius}, -${borderRadius}
            v -${shadowOffsetY - borderRadius}
            h ${((tooltipWidth - tipWidth) / 2) - borderRadius}
            z
          `}
        />
        <ForeignObject
          x={tooltipX - (tooltipWidth / 2)}
          y={tooltipY - tooltipHeight - tipHeight}
          width={tooltipWidth}
          key={content}
        >
          <View style={{ width: tooltipWidth, height: tooltipHeight, justifyContent: 'center' }}>
            <BaseText center small color="#fff">{content}</BaseText>
          </View>
        </ForeignObject>
      </>
    );
  };

  renderXAxis = () => {
    const {
      xAxisValuesCount = 6, getXAxisValue = v => Math.round(v), resolution, height,
    } = this.props;
    const values = range(xAxisValuesCount + 1).map(v => getXAxisValue(v * resolution / (xAxisValuesCount - 1)));
    return (
      <ForeignObject y={height - BOTTOM_MARGIN + 3}>
        <View style={{ width: '100%', flexDirection: 'row' }}>
          {values.map(v => <BaseText style={{ flex: 1 }} center tiny color="#518df8" >{v}</BaseText>)}
        </View>
      </ForeignObject>
    );
  }

  renderHorizontalLines = () => {
    const { width, yAxisValuesCount = 3 } = this.props;
    const maxY = this.getMaxY();

    return (
      range(yAxisValuesCount + 1).map < React.Node > ((_, i): React.Node => {
        const y = this.getScreenY(i / (yAxisValuesCount - 1) * maxY);
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
      })
    );
  };

  renderYAxis = () => {
    const {
      yAxisValuesCount = 3, getYAxisValue = v => Math.round(v),
    } = this.props;
    const maxY = this.getMaxY();

    const values = range(yAxisValuesCount).map(v => getYAxisValue((v + 1) * maxY / (yAxisValuesCount - 1)));

    return (
      <ForeignObject>
        <View>
          {values.map((v, i) => (
            <BaseText
              tiny
              style={{ position: 'absolute', left: 4, top: this.getScreenY((i + 1) * maxY / (yAxisValuesCount - 1)) }}
            >
              {v}
            </BaseText>
          ))}
        </View>
      </ForeignObject>
    );
  }

  render() {
    const {
      data, width, height,
    } = this.props;
    const {
      activeDataPoint,
    } = this.state;

    const activePointX = this.getScreenX(data[activeDataPoint].x);
    const activePointY = this.getScreenY(data[activeDataPoint].y);

    const linePoints = data.map(({ x, y }) => `${this.getScreenX(x)},${this.getScreenY(y)}`);
    const polygonPoints = [...linePoints.slice(0, activeDataPoint + 1), `${activePointX},${height}`, `0,${height}`];

    return (
      <View {...this.panResponder.panHandlers}>
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
          {this.renderHorizontalLines()}
          <Polygon
            points={polygonPoints.join(' ')}
            fill="url(#grad)"
          />
          <Polyline
            points={linePoints.join(' ')}
            fill="none"
            stroke="#007aff"
            strokeWidth="1"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <Line
            x1={activePointX}
            y1={this.getScreenY(0)}
            x2={activePointX}
            y2={this.getScreenY(this.getMaxY())}
            stroke="#3a66ab"
            strokeWidth="1"
            strokeOpacity="0.23"
          />
          {this.renderXAxis()}
          {this.renderYAxis()}
          <Circle cx={activePointX} cy={activePointY} r="4.5" fill="#007aff" />
          <Circle
            cx={activePointX}
            cy={activePointY}
            r="3.5"
            fill="none"
            stroke="#86ffff"
            strokeWidth="2"
            strokeOpacity="0.52"
          />
          {this.renderTooltip(activePointX, activePointY - TOOLTIP_OFFSET)}
        </Svg>
      </View>
    );
  }
}

export default LinearGraph;
