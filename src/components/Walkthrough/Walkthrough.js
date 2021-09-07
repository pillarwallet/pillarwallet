// @flow
import * as React from 'react';
import { Dimensions, StyleSheet, SafeAreaView, Platform } from 'react-native';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import ExtraDimensions from 'react-native-extra-dimensions-android';
import { NavigationActions } from 'react-navigation';
import t from 'translations/translate';
import { getNavigationPathAndParamsState, navigate } from 'services/navigation';
import Button from 'components/legacy/Button';
import { Paragraph, BoldText } from 'components/legacy/Typography';
import Toast from 'components/Toast';
import { spacing, fontStyles } from 'utils/variables';
import { endWalkthroughAction, setWaitingForStepIdAction, setActiveStepIdAction } from 'actions/walkthroughsActions';
import type { Measurements, Steps } from 'reducers/walkthroughsReducer';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import { WALKTHROUGH_TYPES } from 'constants/walkthroughConstants';
import { themedColors } from 'utils/themes';
import { hexToRgba } from 'utils/ui';
import { WalkthroughTooltip } from './WalkthroughTooltip';

const { width, height: windowHeight } = Dimensions.get('window');
const height = Platform.OS === 'android'
  ? ExtraDimensions.get('REAL_WINDOW_HEIGHT') - ExtraDimensions.getSoftMenuBarHeight()
  : windowHeight;


type Props = {
  steps: Steps;
  waitingForStepId: string,
  endWalkthrough: () => void,
  setWaitingForStepId: (id: string) => void,
  forcedStepIndex: ?number,
  setActiveStepI: string,
  setActiveStepId: (id: string) => void,
};

type State = {
  index: number,
  isActiveWalkthrough: boolean,
  buttonText?: string,
  body: string,
  title: string,
  type: string,
  measure: ?Measurements,
};

const Container = styled.View`
  position: absolute;
  top: 0px;
  left: 0px;
  width: ${width}px;
  height: ${height}px;
  ${({ fill }) => `background-color: ${fill}`};
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

const KeyboardAvoidWrapper = styled.KeyboardAvoidingView`
  ${StyleSheet.absoluteFillObject};
  padding: ${spacing.large}px;
  justify-content: flex-end;
`;

const MainContent = styled.View`
  flex-direction: column;
`;

const Title = styled(BoldText)`
  color: ${themedColors.control};
  ${fontStyles.giant};
`;

const initialState = {
  index: -1,
  isActiveWalkthrough: false,
  buttonText: '',
  type: '',
  title: '',
  body: '',
  measure: null,
};

class Walkthrough extends React.Component<Props, State> {
  waitingForNextStepTimeout: TimeoutID;
  state = initialState;

  componentDidMount() {
    this.initWalkthrough();
  }

  componentDidUpdate(prevProps: Props) {
    const { steps, waitingForStepId, forcedStepIndex } = this.props;
    const { isActiveWalkthrough, index } = this.state;
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

    if (index < 0 && !!steps.length) {
      this.endWalkthrough();
    }
  }

  initWalkthrough = () => {
    this.setState({ isActiveWalkthrough: true }, () => this.nextStep());
  };

  nextStep = (forcedStepIndex?: number) => {
    const {
      steps,
      setActiveStepId,
    } = this.props;
    const { index: indexInState } = this.state;
    const newIndex = forcedStepIndex || indexInState + 1;
    const step = steps[newIndex];
    if (newIndex >= steps.length) {
      this.endWalkthrough();
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

      const { path } = getNavigationPathAndParamsState() || {};
      const pathSteps = path ? path.split('/') : [];
      const currentScreen = pathSteps[pathSteps.length - 1];

      if (!measure && type !== WALKTHROUGH_TYPES.SHADE) { // step is not yet updated with measure
        if (activeScreen !== currentScreen) {
          const action = NavigationActions.navigate({
            routeName: activeScreen,
          });
          navigate(action);
        }
        this.waitForNextStep(id);
      } else {
        if (activeScreen !== currentScreen && type === WALKTHROUGH_TYPES.SHADE) {
          const action = NavigationActions.navigate({
            routeName: activeScreen,
          });
          navigate(action);
        }
        setActiveStepId(id);
        this.setState({
          index: newIndex,
          buttonText,
          type,
          title,
          body,
          measure,
        });
      }
    }
  };

  proceedWithMeasuredStep = () => {
    const { setWaitingForStepId } = this.props;
    setWaitingForStepId('');
    clearTimeout(this.waitingForNextStepTimeout);
    this.nextStep();
  };

  waitForNextStep = (id: string) => {
    const { setWaitingForStepId } = this.props;
    setWaitingForStepId(id);
    this.waitingForNextStepTimeout = setTimeout(() => {
      this.endWalkthrough();
      clearTimeout(this.waitingForNextStepTimeout);
      Toast.show({
        message: t('toast.walkthroughFailed'),
        emoji: 'hushed',
        supportLink: true,
        autoClose: false,
      });
    }, 2000);
  };

  endWalkthrough = () => {
    const { endWalkthrough } = this.props;
    this.setState({ ...initialState });
    endWalkthrough();
  };

  render() {
    const {
      index,
      buttonText,
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
          <Container fill="rgba(0, 0, 0, 0.1)">
            <Shade />
          </Container>
          {!waitingForStepId &&
          <KeyboardAvoidWrapper enabled behavior={Platform.OS === 'ios' ? 'height' : null}>
            <SafeAreaView>
              <ShadeContent>
                <MainContent>
                  <Title>{title}</Title>
                  <WhiteParagraph small>{body}</WhiteParagraph>
                </MainContent>
                <Button title={buttonText || t('button.next')} onPress={this.nextStep} />
              </ShadeContent>
            </SafeAreaView>
          </KeyboardAvoidWrapper>}
        </React.Fragment>
      );
    }

    if (type === WALKTHROUGH_TYPES.TOOLTIP && Platform.OS === 'android') {
      return (
        <React.Fragment>
          <Container>
            {!waitingForStepId && measure &&
              <WalkthroughTooltip
                targetMeasurements={measure}
                onTooltipButtonPress={this.nextStep}
                title={title}
                body={body}
                buttonText={buttonText}
              />
            }
          </Container>
        </React.Fragment>
      );
    }

    return null;
  }
}

const mapStateToProps = ({
  walkthroughs: { waitingForStepId, forcedStepIndex },
}: RootReducerState): $Shape<Props> => ({
  waitingForStepId,
  forcedStepIndex,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  endWalkthrough: () => dispatch(endWalkthroughAction()),
  setWaitingForStepId: (id: string) => dispatch(setWaitingForStepIdAction(id)),
  setActiveStepId: (id: string) => dispatch(setActiveStepIdAction(id)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Walkthrough);
