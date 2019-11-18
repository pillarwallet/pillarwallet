// @flow
import * as React from 'react';
import { Dimensions, StyleSheet, Animated, SafeAreaView, Platform } from 'react-native';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import { Svg, Path } from 'react-native-svg';
import ExtraDimensions from 'react-native-extra-dimensions-android';
import { NavigationActions } from 'react-navigation';
import { getNavigationPathAndParamsState, navigate } from 'services/navigation';
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
  position: Position,
  alignStart: boolean,
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
  padding: ${spacing.large}px;
  justify-content: ${props => props.alignStart ? 'flex-start' : 'flex-end'};
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
      alignStart: false,
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

    if (waitingForStepId) {
      const relatedStep = steps.find(({ id }) => id === waitingForStepId);
      if (relatedStep && relatedStep.measure) this.proceedWithNewlyAddedStep();
    }
  }

  initWalkthrough = () => {
    this.setState({ isActiveWalkthrough: true });
    this.nextStep();
  };

  nextStep = async () => {
    const { steps, endWalkthrough, setWaitingForStepId } = this.props;
    const { index } = this.state;
    const step = steps[index + 1];
    if (index + 1 >= steps.length) {
      this.setState({ index: -1, isActiveWalkthrough: false });
      endWalkthrough();
    } else {
      const {
        activeScreen,
        id,
        label,
        buttonText,
        measure,
      } = step;
      if (!measure) { // step is not yet updated with measure
        const { path } = getNavigationPathAndParamsState() || {};
        const pathSteps = path ? path.split('/') : [];
        const currentScreen = pathSteps[pathSteps.length - 1];
        if (activeScreen !== currentScreen) {
          const action = NavigationActions.navigate({
            routeName: activeScreen,
          });
          navigate(action);
        }
        setWaitingForStepId(id);
      } else {
        const {
          x: stepXPos,
          y: stepYPos,
          w: stepItemWidth,
          h: stepItemHeight,
        } = measure;
        this.setState({
          index: index + 1,
          label,
          buttonText,
          alignStart: stepYPos > height / 2,
        });
        const adjustedY = Platform.OS === 'ios' ? stepYPos : stepYPos + ExtraDimensions.getStatusBarHeight();
        this.animate({ x: stepItemWidth, y: stepItemHeight }, { x: stepXPos, y: adjustedY });
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
    const {
      index,
      buttonText,
      label,
      alignStart,
    } = this.state;
    const { waitingForStepId } = this.props;
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
        {!waitingForStepId &&
        <Content alignStart={alignStart}>
          <SafeAreaView>
            <WhiteParagraph small>{label}</WhiteParagraph>
            <Button title={buttonText || 'Next'} onPress={this.nextStep} />
          </SafeAreaView>
        </Content>}
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

