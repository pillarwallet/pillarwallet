// @flow
import * as React from 'react';
import { Animated, Easing } from 'react-native';
import { differenceInHours } from 'date-fns';
import ProgressCircle from './ProgressCircle';

const AnimatedProgress = Animated.createAnimatedComponent(ProgressCircle);

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
  animatedProgress: Object,
}

export default class AnimatedProgressCircle extends React.Component<Props, State> {
  interval: IntervalID;

  constructor(props: Props) {
    super(props);
    this.state = {
      label: '0',
      progress: 0.5,
      animatedProgress: new Animated.Value(0.5),
    };
  }

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
        (
          (differenceInHours(new Date(), startDate) * 360) /
          (differenceInHours(endDate, startDate) * 360))
        * 100);

      const adjustedProgressInPercent = getAdjustedProgressInPercent(progressInPercent);
      if (this.state.progress !== adjustedProgressInPercent) {
        this.setState({
          label: adjustedProgressInPercent.toString(),
          progress: adjustedProgressInPercent,
        });
        this.animateProgress();
      }

      if (this.state.progress === 100) {
        clearInterval(this.interval);
      }
    }, 1000);
  };

  animateProgress = () => {
    Animated.timing(
      this.state.animatedProgress,
      {
        toValue: this.state.progress,
        easing: Easing.out(Easing.ease),
        duration: 300,
      },
    ).start();
  };

  render() {
    const {
      label,
      animatedProgress,
    } = this.state;

    const {
      isPending,
      endDate,
      startDate,
      circleSize,
      statusWidth,
      statusBackgroundWidth,
      style,
      children,
    } = this.props;

    return (
      <AnimatedProgress
        isPending={isPending}
        endDate={endDate}
        startDate={startDate}
        circleSize={circleSize}
        statusWidth={statusWidth}
        statusBackgroundWidth={statusBackgroundWidth}
        label={label}
        progress={animatedProgress}
        style={style}
      >
        {children}
      </AnimatedProgress>
    );
  }
}
