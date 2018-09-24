// @flow
import * as React from 'react';
import { Platform, Animated, Easing } from 'react-native';
import styled from 'styled-components/native/index';
import { differenceInHours } from 'date-fns';
import LinearGradient from 'react-native-linear-gradient';
import { baseColors, fontSizes, spacing, fontTrackings } from 'utils/variables';
import { MediumText } from 'components/Typography';

type Props = {
  isPending?: boolean,
  endDate: any,
  startDate: any,
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

export default class ProgressBar extends React.Component<Props, State> {
  interval: IntervalID;

  constructor(props: Props) {
    super(props);
    this.state = {
      label: '0',
      progress: BACKGROUND_FOR_LABEL,
      progressAnimated: new Animated.Value(BACKGROUND_FOR_LABEL),
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
        progress: BACKGROUND_FOR_LABEL,
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

      const adjustedProgress = progressInPercent < BACKGROUND_FOR_LABEL ? BACKGROUND_FOR_LABEL : progressInPercent;

      if (this.state.progress !== progressInPercent) {
        this.setState({
          label: progressInPercent.toString(),
          progress: adjustedProgress,
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
      this.state.progressAnimated,
      {
        toValue: this.state.progress,
        easing: Easing.linear,
        duration: 300,
      },
    ).start();
  };

  render() {
    const { progressAnimated } = this.state;
    const {
      label,
      progress,
    } = this.state;

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
