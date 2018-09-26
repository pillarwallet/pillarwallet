// @flow
import * as React from 'react';
import { Platform, Animated, Easing } from 'react-native';
import styled from 'styled-components/native/index';
import LinearGradient from 'react-native-linear-gradient';
import { baseColors, fontSizes, spacing, fontTrackings } from 'utils/variables';
import { MediumText } from 'components/Typography';
import ProgressCircle from './ProgressCircle';

type Props = {
  isPending?: boolean,
  fullStatusValue: number,
  currentStatusValue: number,
  circle: boolean,
  children?: React.Node,
};


type State = {
  label: string,
  progress: number,
  progressAnimated: Object,
}

const ProgressBarWrapper = styled.View`
  flex-direction: row;
  background-color: ${baseColors.snowWhite};
  padding: 1px 0;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: ${spacing.rhythm / 2}px;
`;

const StyledLinearGradient = styled(LinearGradient)`
  padding: 1px;
  height: 11px;
  border-top-right-radius: ${props => props.full ? 0 : '9px'};
  border-bottom-right-radius: ${props => props.full ? 0 : '9px'};
  overflow: hidden;
`;

const AnimatedStyledLinearGradient = Animated.createAnimatedComponent(StyledLinearGradient);

const ProgressLabel = styled(MediumText)`
  font-size: ${fontSizes.tiny};
  line-height: ${fontSizes.tiny};
  letter-spacing: ${fontTrackings.tiny};
  color: ${props => props.outside ? baseColors.oliveDrab : baseColors.white};
  position: ${props => props.outside ? 'relative' : 'absolute'};
  top: ${Platform.select({
    ios: props => props.outside ? 'auto' : '1px',
    android: props => props.outside ? 'auto' : '1.5px',
  })};
  right: ${props => props.outside ? 'auto' : '4px'};
  margin-top: ${Platform.select({
    ios: props => props.outside ? '1px' : '0',
    android: props => props.outside ? '2px' : '0',
  })};
  margin-left: ${props => props.outside ? '2px' : 0};
`;

const BACKGROUND_FOR_LABEL = 8;
const getAdjustedProgressInPercent = (percents) => {
  switch (percents) {
    case 0: return 0.5;
    case 25: return 25.5;
    case 50: return 50.5;
    default: return percents;
  }
};

const AnimatedProgressCircle = Animated.createAnimatedComponent(ProgressCircle);

export default class Progress extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      label: '0',
      progress: this.props.circle ? 0.5 : BACKGROUND_FOR_LABEL,
      progressAnimated: new Animated.Value(this.props.circle ? 0.5 : BACKGROUND_FOR_LABEL),
    };
  }

  static defaultProps = {
    circle: false,
  };

  componentDidMount = () => {
    const {
      isPending,
      fullStatusValue,
      currentStatusValue,
    } = this.props;

    if (!isPending) this.handleStatusValue(fullStatusValue, currentStatusValue);
  };

  componentDidUpdate(prevProps: Props) {
    const {
      isPending,
      fullStatusValue,
      currentStatusValue,
    } = this.props;

    if (prevProps.currentStatusValue !== currentStatusValue || prevProps.isPending !== isPending) {
      this.handleStatusValue(fullStatusValue, currentStatusValue);
    }
  }

  handleStatusValue = (full: number, current: number) => {
    const currentStatus = Math.floor((current * 100) / full);
    const adjustedCurrentStatus = currentStatus > 100 ? 100 : currentStatus;
    const adjustedBarProgress = adjustedCurrentStatus < BACKGROUND_FOR_LABEL
      ? BACKGROUND_FOR_LABEL
      : adjustedCurrentStatus;
    const adjustedCircleProgress = getAdjustedProgressInPercent(adjustedCurrentStatus);
    const thisProgress = this.props.circle ? adjustedCircleProgress : adjustedBarProgress;
    this.setState({
      label: adjustedCurrentStatus.toString(),
      progress: thisProgress,
    });
    this.animateProgress(thisProgress);
  };

  animateProgress = (newProgress: number) => {
    Animated.timing(
      this.state.progressAnimated,
      {
        toValue: newProgress,
        easing: Easing.linear,
        duration: 800,
      },
    ).start();
  };

  render() {
    const {
      progressAnimated,
      label,
      progress,
    } = this.state;

    const {
      circle,
      children,
    } = this.props;

    if (circle) {
      return (
        <AnimatedProgressCircle
          label={label}
          progress={progressAnimated}
        >
          {children}
        </AnimatedProgressCircle>
      );
    }

    return (
      <ProgressBarWrapper>
        <AnimatedStyledLinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          colors={[baseColors.mantis, baseColors.oliveDrab]}
          full={progress === 100}
          style={{
            width: progressAnimated.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          }}
        >
          <ProgressLabel>{label}%</ProgressLabel>
        </AnimatedStyledLinearGradient>
      </ProgressBarWrapper>
    );
  }
}
