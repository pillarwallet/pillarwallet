// @flow
import * as React from 'react';
import { Dimensions, StyleSheet, Animated, SafeAreaView } from 'react-native';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import { Svg, Path } from 'react-native-svg';
import SVGPath from 'art/modes/svg/path';
import Button from 'components/Button';
import { Paragraph } from 'components/Typography';
import { baseColors, spacing } from 'utils/variables';
import { endWalkthroughAction, setWaitingForStepIdAction } from 'actions/walkthroughsActions';
import type { Steps } from 'reducers/walkthroughsReducer';

const { width, height } = Dimensions.get('window');
const radius = 60;
const xc = (width * 3) / 2;
const yc = (height * 3) / 2;
const overlay = SVGPath()
  .moveTo(0, 0)
  .lineTo(width * 3, 0)
  .lineTo(width * 3, height * 3)
  .lineTo(0, height * 3)
  .lineTo(0, 0)
  .close()

  .moveTo(xc - radius, yc)
  .counterArcTo(xc, yc + radius, radius)
  .counterArcTo(xc + radius, yc, radius)
  .counterArcTo(xc, yc - radius, radius)
  .counterArcTo(xc - radius, yc, radius);

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
}


const Container = styled.View`
  position: absolute;
  top: -${height}px;
  left: -${width}px;
  width: ${width * 3}px;
  height: ${height * 3}px;
`;

const Content = styled.View`
  ${StyleSheet.absoluteFillObject};
  justify-content: flex-end;
  padding: ${spacing.large}px;
`;

const WhiteParagraph = styled(Paragraph)`
  color: ${baseColors.white};
`;


const ContainerAnimated = Animated.createAnimatedComponent(Container);

class Walkthrough extends React.Component<Props, State> {
  x = new Animated.Value(0);

  y = new Animated.Value(0);

  state = {
    index: -1,
    isActiveWalkthrough: false,
    label: '',
    buttonText: '',
  };

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
    const { x, y } = this;
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
        const { label, buttonText } = step;
        this.setState({ index: index + 1, label, buttonText });
        Animated.parallel([
          Animated.timing(x, {
            toValue: step.x,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(y, {
            toValue: step.y,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        setWaitingForStepId(`${index + 1}`); // TODO: pass in next item id
      }
    }
  };

  proceedWithNewlyAddedStep = () => {
    const { setWaitingForStepId } = this.props;
    setWaitingForStepId('');

    this.nextStep();
  };

  render() {
    const { x, y } = this;
    const { index, buttonText, label } = this.state;
    const translateX = Animated.add(x, new Animated.Value((-width / 2) + radius));
    const translateY = Animated.add(y, new Animated.Value((-height / 2) + radius));
    if (index === -1) {
      return null;
    }
    return (
      <React.Fragment>
        <ContainerAnimated
          style={{
            transform: [
              { translateX },
              { translateY },
            ],
          }}
        >
          <Svg style={StyleSheet.absoluteFill}>
            <Path
              d={overlay.toSVG()}
              fill={baseColors.slateBlack}
              opacity={0.85}
            />
          </Svg>
        </ContainerAnimated>
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

