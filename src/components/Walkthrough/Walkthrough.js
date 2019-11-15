// @flow
import * as React from 'react';
import { Dimensions, StyleSheet, Animated, SafeAreaView, Platform } from 'react-native';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import { Svg, Path } from 'react-native-svg';
import ExtraDimensions from 'react-native-extra-dimensions-android';
import Button from 'components/Button';
import { Paragraph } from 'components/Typography';
import { baseColors, spacing } from 'utils/variables';
import { getiOSNavbarHeight } from 'utils/common';
import { endWalkthroughAction, setWaitingForStepIdAction } from 'actions/walkthroughsActions';
import type { Steps } from 'reducers/walkthroughsReducer';
import AnimatedSvgPath from './AnimatedSvgPath';

const { width, height: h } = Dimensions.get('window');
const height = Platform.OS === 'android'
  ? ExtraDimensions.get('REAL_WINDOW_HEIGHT') - ExtraDimensions.getSoftMenuBarHeight()
  : h - getiOSNavbarHeight();

type Size = {
  x: Animated.Value,
  y: Animated.Value,
}

type Position = {
  x: Animated.Value,
  y: Animated.Value,
}

type Props = {
  steps: Steps;
  waitingForStepId: string,
  endWalkthrough: () => void,
  setWaitingForStepId: (id: string) => void,
}

type State = {
  index: number,
  isActiveWalkthrough: boolean,
  buttonText?: string,
  label: string,
  size: Size,
  position: Position
}

const getSvgPath = ({ size, position }): string =>
  `M0,0H${width}V${height}H0V0ZM${position.x._value},${position.y._value}H${position.x._value + size.x._value}V
  ${position.y._value + size.y._value}H${position.x._value}V${position.y._value}Z`;


const Container = styled.View`
  position: absolute;
  top: 0px;
  left: 0px;
  width: ${width}px;
  height: ${height}px;
`;

const Content = styled.View`
  ${StyleSheet.absoluteFillObject};
  justify-content: flex-end;
  padding: ${spacing.large}px;
`;

const WhiteParagraph = styled(Paragraph)`
  color: ${baseColors.white};
`;

class Walkthrough extends React.Component<Props, State> {
  mask: Path;

  constructor(props) {
    super(props);

    this.state = {
      index: -1,
      isActiveWalkthrough: false,
      label: '',
      buttonText: '',
      size: new Animated.ValueXY({ x: 150, y: 100 }),
      position: new Animated.ValueXY({ x: 10, y: 50 }),
    };

    this.state.position.addListener(this.animationListener);
  }

  componentDidMount() {
    this.initWalkthrough();
  }

  componentDidUpdate(prevProps: Props) {
    const { steps, waitingForStepId } = this.props;
    const { isActiveWalkthrough } = this.state;
    if (!!prevProps.steps && steps && !isActiveWalkthrough) {
      this.initWalkthrough();
    }

    if (waitingForStepId && prevProps.steps.length < steps.length) {
      this.proceedWithNewlyAddedStep();
    }
  }

  initWalkthrough = () => {
    this.setState({ isActiveWalkthrough: true });
    this.nextStep();
  };

  nextStep = () => {
    const { steps, endWalkthrough, setWaitingForStepId } = this.props;
    const { index } = this.state;
    const currentStep = steps[index];
    // if (index + 1 >= steps.length) { // TODO: reuse when all steps will be passed in at init
    if (currentStep && currentStep.isLast) {
      this.setState({ index: -1, isActiveWalkthrough: false });
      endWalkthrough();
    } else {
      const step = steps[index + 1];
      if (currentStep) {
        const { action: additionalStepAction } = currentStep;
        if (additionalStepAction) additionalStepAction();
      }
      if (step) {
        const {
          label,
          buttonText,
          x: stepXPosition,
          y: stepYPosition,
          width: stepItemWidth,
          height: stepItemHeight,
        } = step;
        this.setState({ index: index + 1, label, buttonText });
        const adjustedY = Platform.OS === 'ios' ? stepYPosition : stepYPosition + ExtraDimensions.getStatusBarHeight();
        this.animate({ x: stepItemWidth, y: stepItemHeight }, { x: stepXPosition, y: adjustedY });
      } else {
        setWaitingForStepId(`${index + 1}`); // TODO: pass in next item id
      }
    }
  };

  animate = (size: Size, position: Position): void => {
    Animated.parallel([
      Animated.timing(this.state.size, {
        toValue: size,
        duration: 500,
      }),
      Animated.timing(this.state.position, {
        toValue: position,
        duration: 500,
      }),
    ]).start();
  };

  proceedWithNewlyAddedStep = () => {
    const { setWaitingForStepId } = this.props;
    setWaitingForStepId('');

    this.nextStep();
  };

  animationListener = (): void => {
    const d = getSvgPath({
      size: this.state.size,
      position: this.state.position,
    });
    if (this.mask) {
      this.mask.setNativeProps({ d });
    }
  };

  render() {
    const { index, buttonText, label } = this.state;
    if (index === -1) {
      return null;
    }
    return (
      <React.Fragment>
        <Container>
          <Svg style={StyleSheet.absoluteFill}>
            <AnimatedSvgPath
              ref={(ref) => { this.mask = ref; }}
              fill={baseColors.slateBlack}
              opacity={0.85}
              fillRule="evenodd"
              strokeWidth={1}
              d={getSvgPath({
                size: this.state.size,
                position: this.state.position,
              })}
            />
          </Svg>
        </Container>
        <Content>
          <SafeAreaView>
            <WhiteParagraph small>{label}</WhiteParagraph>
            <Button title={buttonText || 'Next'} onPress={this.nextStep} />
          </SafeAreaView>
        </Content>
      </React.Fragment>
    );
  }
}


const mapStateToProps = ({
  walkthroughs: { waitingForStepId },
}) => ({
  waitingForStepId,
});

const mapDispatchToProps = (dispatch) => ({
  endWalkthrough: () => dispatch(endWalkthroughAction()),
  setWaitingForStepId: (id: string) => dispatch(setWaitingForStepIdAction(id)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Walkthrough);

