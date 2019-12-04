// @flow
import * as React from 'react';
import { Dimensions, StyleSheet, Animated, SafeAreaView, Platform, View } from 'react-native';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import { Path } from 'react-native-svg';
import ExtraDimensions from 'react-native-extra-dimensions-android';
import { NavigationActions } from 'react-navigation';
import { getNavigationPathAndParamsState, navigate } from 'services/navigation';
import Button from 'components/Button';
import { Paragraph, BoldText } from 'components/Typography';
import { spacing, fontStyles } from 'utils/variables';
import { getiOSNavbarHeight } from 'utils/common';
import { endWalkthroughAction, setWaitingForStepIdAction, setActiveStepIdAction } from 'actions/walkthroughsActions';
import type { Measurements, Steps } from 'reducers/walkthroughsReducer';
import { WALKTHROUGH_TYPES } from 'constants/walkthroughConstants';
import { themedColors } from 'utils/themes';
import { hexToRgba } from 'utils/ui';
import { WalkthroughTooltip } from './WalkthroughTooltip';

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
  forcedStepIndex: ?number,
  setActiveStepI: string,
  setActiveStepId: (id: string) => void,
}

type State = {
  index: number,
  isActiveWalkthrough: boolean,
  buttonText?: string,
  size: Size,
  position: Position,
  alignStart: boolean,
  body: string,
  title: string,
  type: string,
  measure: ?Measurements,
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
  color: ${themedColors.control};
`;

const Shade = styled.View`
  position: absolute;
  top: 0px;
  left: 0px;
  width: ${width}px;
  height: ${height}px;
  background-color: ${({ theme }) => hexToRgba(theme.colors.text, 0.8)};
`;

const ShadeContent = styled.View`
  height: 80%;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
`;


const MainContent = styled.View`
  flex-direction: column;
`;

const Title = styled(BoldText)`
  color: ${themedColors.control};
  ${fontStyles.giant};
`;

class Walkthrough extends React.Component<Props, State> {
  mask: Path;

  constructor(props) {
    super(props);

    this.state = {
      index: -1,
      isActiveWalkthrough: false,
      buttonText: '',
      size: new Animated.ValueXY({ x: 150, y: 100 }),
      position: new Animated.ValueXY({ x: 10, y: 50 }),
      alignStart: false,
      type: '',
      title: '',
      body: '',
      measure: null,
    };

    this.state.position.addListener(this.animationListener);
  }

  componentDidMount() {
    this.initWalkthrough();
  }

  componentDidUpdate(prevProps: Props) {
    const { steps, waitingForStepId, forcedStepIndex } = this.props;
    const { isActiveWalkthrough } = this.state;
    if (!!prevProps.steps && steps && !isActiveWalkthrough) {
      this.initWalkthrough();
    }

    if (waitingForStepId) {
      const relatedStep = steps.find(({ id }) => id === waitingForStepId);
      if (relatedStep && relatedStep.measure) this.proceedWithMeasuredStep();
    }

    if (forcedStepIndex !== prevProps.forcedStepIndex && forcedStepIndex) {
      this.nextStep(forcedStepIndex);
    }
  }

  initWalkthrough = () => {
    this.setState({ isActiveWalkthrough: true });
    this.nextStep();
  };

  nextStep = async (forcedStepIndex?: number) => {
    const {
      steps,
      endWalkthrough,
      setWaitingForStepId,
      setActiveStepId,
    } = this.props;
    const { index: indexInState } = this.state;
    const newIndex = forcedStepIndex || indexInState + 1;
    const step = steps[newIndex];
    if (newIndex >= steps.length) {
      this.setState({ index: -1, isActiveWalkthrough: false });
      endWalkthrough();
    } else {
      const {
        activeScreen,
        id,
        buttonText,
        measure,
        type,
        title,
        body,
      } = step;

      if (!measure && type !== WALKTHROUGH_TYPES.SHADE) { // step is not yet updated with measure
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
        // const {
        //   x: stepXPos,
        //   y: stepYPos,
        //   w: stepItemWidth,
        //   h: stepItemHeight,
        // } = measure;
        //
        // const adjustedY = Platform.OS === 'ios' ? stepYPos : stepYPos + ExtraDimensions.getStatusBarHeight()
        setActiveStepId(id);
        this.setState({
          index: newIndex,
          buttonText,
          // alignStart: stepYPos > height / 2,
          type,
          title,
          body,
          measure,
        });
        // this.animate({ x: stepItemWidth, y: stepItemHeight }, { x: stepXPos, y: adjustedY });
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

  proceedWithMeasuredStep = () => {
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
      alignStart,
      type,
      title,
      body,
      measure,
    } = this.state;
    const { waitingForStepId } = this.props;

    if (index === -1) {
      return null;
    }

    if (type === WALKTHROUGH_TYPES.SHADE) {
      return (
        <React.Fragment>
          <Container>
            <Shade />
          </Container>
          {!waitingForStepId &&
          <Content alignStart={alignStart}>
            <SafeAreaView>
              <ShadeContent>
                <MainContent>
                  <Title>
                    {title}
                  </Title>
                  <WhiteParagraph small>{body}</WhiteParagraph>
                </MainContent>
                <Button title={buttonText || 'Next'} onPress={this.nextStep} />
              </ShadeContent>
            </SafeAreaView>
          </Content>}
        </React.Fragment>
      );
    }

    if (type === WALKTHROUGH_TYPES.TOOLTIP && Platform.OS === 'android') {
      return (
        <React.Fragment>
          <Container>
            <View style={{ position: 'relative', flex: 1 }}>
              {!waitingForStepId && measure &&
                <WalkthroughTooltip
                  targetMeasurements={measure}
                  onTooltipButtonPress={this.nextStep}
                  title={title}
                  body={body}
                  buttonText={buttonText}
                />
              }
            </View>
          </Container>
        </React.Fragment>
      );
    }

    return null;

    // return (
    //   <React.Fragment>
    //     <Container>
    //       <Svg style={StyleSheet.absoluteFill}>
    //         <AnimatedSvgPath
    //           ref={(ref) => { this.mask = ref; }}
    //           fill={baseColors.slateBlack}
    //           opacity={0.85}
    //           fillRule="evenodd"
    //           strokeWidth={1}
    //           d={getSvgPath({
    //             size: this.state.size,
    //             position: this.state.position,
    //           })}
    //         />
    //       </Svg>
    //     </Container>
    //     {!waitingForStepId &&
    //     <Content alignStart={alignStart}>
    //       <SafeAreaView>
    //         <WhiteParagraph small>{label}</WhiteParagraph>
    //         <Button title={buttonText || 'Next'} onPress={this.nextStep} />
    //       </SafeAreaView>
    //     </Content>}
    //   </React.Fragment>
    // );
  }
}

const mapStateToProps = ({
  walkthroughs: { waitingForStepId, forcedStepIndex },
}) => ({
  waitingForStepId,
  forcedStepIndex,
});

const mapDispatchToProps = (dispatch) => ({
  endWalkthrough: () => dispatch(endWalkthroughAction()),
  setWaitingForStepId: (id: string) => dispatch(setWaitingForStepIdAction(id)),
  setActiveStepId: (id: string) => dispatch(setActiveStepIdAction(id)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Walkthrough);

