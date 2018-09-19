// @flow
import * as React from 'react';
import { View } from 'react-native';
import { Svg, Path, G, Defs, LinearGradient, Stop, Text } from 'react-native-svg';
import { differenceInHours } from 'date-fns';
import { baseColors, fontSizes } from 'utils/variables';

type Props = {
  circleSize: number,
  statusWidth: number,
  statusBackgroundWidth: number,
  style?: Object,
  children?: React.Node,
  isPending?: boolean,
  endDate: any,
  startDate: any,
};

type State = {
  label: string,
  progress: number,
}

// Android does not show rounded corner on 25 and 50%;
const getAdjustedProgressInPercent = (percents) => {
  switch (percents) {
    case 0: {
      return 0.5;
    }
    case 25: {
      return 25.5;
    }
    case 50: {
      return 50.5;
    }
    default: {
      return percents;
    }
  }
};

export default class CircularProgress extends React.Component<Props, State> {
  interval: IntervalID;

  constructor(props: Props) {
    super(props);
    this.state = {
      label: '0',
      progress: 0,
    };
  }

  getCartesian(centerX: number, centerY: number, radius: number, angleInDeg: number) {
    const angleInRad = ((angleInDeg - 90) * Math.PI) / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRad)),
      y: centerY + (radius * Math.sin(angleInRad)),
    };
  }

  circlePath(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    const start = this.getCartesian(x, y, radius, endAngle * 0.9999);
    const end = this.getCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    const d = [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    ];
    return d.join(' ');
  }

  clampStatus = (fill: number) => Math.min(100, Math.max(0, fill));

  componentDidMount = () => {
    const {
      isPending,
      endDate,
      startDate,
    } = this.props;

    if (isPending) {
      this.setState({
        label: '0',
        progress: 0.5,
      });
      return;
    }

    if (this.state.progress === 100) {
      return;
    }

    this.interval = setInterval(() => {
      const progressInPercent = Math.floor(
        ((differenceInHours(new Date(), startDate) * 360) /
          (differenceInHours(endDate, startDate) * 360)) * 100);

      const adjustedProgressInPercent = getAdjustedProgressInPercent(progressInPercent);
      if (this.state.progress !== adjustedProgressInPercent) {
        this.setState({
          label: adjustedProgressInPercent.toString(),
          progress: adjustedProgressInPercent,
        });
      }

      if (this.state.progress === 100) {
        clearInterval(this.interval);
      }
    }, 1000);
  };

  render() {
    const {
      label,
      progress,
    } = this.state;
    const {
      circleSize,
      statusWidth,
      statusBackgroundWidth,
      style,
      children,
    } = this.props;

    const paddingX = 40;
    const paddingY = 30;
    const areaWidth = circleSize + (paddingX * 2);
    const areaHeight = circleSize + (paddingY * 2);

    const halfSize = circleSize / 2;
    const backgroundPath = this.circlePath(halfSize, halfSize, halfSize - (statusWidth / 2), 0, 360);

    const circlePath = this.circlePath(halfSize, halfSize, halfSize - (statusWidth / 2), 0,
      (360 * this.clampStatus(progress)) / 100);
    const offset = circleSize - (statusWidth * 2);
    const labelCircleSize = circleSize + 40;
    const halfLabelCircle = labelCircleSize / 2;
    const childTopPos = statusWidth + paddingY;
    const childLeftPos = statusWidth + paddingX;

    const childContainerStyle = {
      position: 'absolute',
      left: childLeftPos,
      top: childTopPos,
      width: offset,
      height: offset,
      borderRadius: offset / 2,
      alignItems: 'center',
      justifyContent: 'center',
    };

    const labelCirclePaddingX = (areaWidth - labelCircleSize) / 2;
    const labelCirclePaddingY = (areaHeight - labelCircleSize) / 2;

    const end = this.getCartesian(halfLabelCircle, halfLabelCircle, halfLabelCircle - (statusWidth / 2),
      ((360 * this.clampStatus(progress)) / 100) * 0.9999);

    const labelX = end.x + labelCirclePaddingX;
    const labelY = end.y + labelCirclePaddingY;

    const strokeType = progress < 10 ? baseColors.mantis : 'url(#grad)';

    const dxPos = () => {
      if (progress === 100 || progress === 0 || progress === 0.5 || progress === 50.5) {
        return -4;
      } else if (progress > 47) {
        return -15;
      }
      return 5;
    };
    return (
      <View style={style}>
        <Svg
          height={areaHeight}
          width={areaWidth}
          style={{ backgroundColor: 'transparent' }}
        >
          <Defs>
            <LinearGradient
              id="grad"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
              spreadMethod="pad"
            >
              <Stop offset="0%" stopColor={baseColors.mantis} stopOpacity="1" />
              <Stop offset="100%" stopColor={baseColors.oliveDrab} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <G>
            <Path
              d={backgroundPath}
              stroke={baseColors.snowWhite}
              strokeWidth={statusBackgroundWidth || statusWidth}
              fill="transparent"
              x={paddingX}
              y={paddingY}
            />
            <Path
              d={circlePath}
              stroke={strokeType}
              strokeWidth={statusWidth}
              strokeLinecap="round"
              fill="transparent"
              x={paddingX}
              y={paddingY}
            />
            <Text
              x={labelX}
              y={labelY}
              dy={5}
              dx={dxPos()}
              fontSize={fontSizes.tiny}
              fill={baseColors.darkGray}
              textAnchor="middle"
            >
              {label}%
            </Text>
          </G>
        </Svg>
        {children && (
          <View style={childContainerStyle}>
            {children}
          </View>
        )}
      </View>
    );
  }
}
