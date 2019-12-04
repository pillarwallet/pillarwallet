// @flow
import * as React from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { connect } from 'react-redux';
import { withNavigation } from 'react-navigation';

import { addWalkthroughStepMeasureAction, showNextStepExternalAction } from 'actions/walkthroughsActions';
import type { Measurements, Steps } from 'reducers/walkthroughsReducer';
import { WALKTHROUGH_TYPES } from 'constants/walkthroughConstants';
import { WalkthroughTooltip } from './WalkthroughTooltip';

type TooltipInfo = {
  buttonText?: string,
  body?: string,
  title?: string,
};

type Props = {
  children: React.Node,
  types: Array<string>,
  walkthroughType: string,
  walkthroughStepId: string,
  waitingForStepId: string,
  addWalkthroughStepMeasure: (stepId: string, measures: Measurements) => void,
  steps: Steps,
  activeStepId: string,
  showNextStep: () => void,
}

type State = {
  showTooltip: boolean,
  refMeasures: ?Measurements,
  tooltipInfo: ?TooltipInfo,
};

const measure = async (ref: View): Promise<Measurements> =>
  new Promise(resolve => ref.measureInWindow((x, y, w, h) => resolve({
    x, y, w, h,
  })));

class WalkthroughItem extends React.Component<Props, State> {
  reference = React.createRef();

  state = {
    showTooltip: false,
    refMeasures: null,
    tooltipInfo: null,
  };

  componentDidUpdate(prevProps: Props) {
    const { steps, activeStepId, walkthroughStepId } = this.props;
    if (activeStepId !== prevProps.activeStepId && walkthroughStepId === activeStepId) {
      const activeStep = steps.find(({ id }) => id === activeStepId);
      if (!activeStep) return;
      const {
        measure: measurements,
        type,
        body,
        title,
        buttonText,
      } = activeStep;
      const tooltipInfo = {
        buttonText,
        body,
        title,
      };
      if (type === WALKTHROUGH_TYPES.TOOLTIP) this.toggleTooltip(measurements, tooltipInfo);
    }
  }

  toggleTooltip = (measurements: ?Measurements, tooltipInfo?: TooltipInfo) => {
    if (measurements) {
      this.setState({ showTooltip: true, refMeasures: measurements, tooltipInfo });
    } else {
      this.setState({ showTooltip: false, refMeasures: null, tooltipInfo: null });
    }
  };

  showNext = () => {
    const { showNextStep } = this.props;
    this.toggleTooltip();
    showNextStep();
  };

  setWalkthroughStepMeasures = async () => {
    const { addWalkthroughStepMeasure, walkthroughStepId } = this.props;
    measure(this.reference)
      .then((measures) => {
        addWalkthroughStepMeasure(walkthroughStepId, measures);
        // const { x, y } = measures;
        // // x: stepXPos,
        // //   y: stepYPos,
        // //   w: stepItemWidth,
        // //   h: stepItemHeight,
        // this.setState({ refMeasures: measures });
      })
      .catch(() => {

      });
  };

  render() {
    const {
      children,
      types,
      walkthroughType,
      walkthroughStepId,
      waitingForStepId,
    } = this.props;

    const {
      showTooltip,
      refMeasures,
      tooltipInfo,
    } = this.state;

    if (types.includes(walkthroughType) && waitingForStepId === walkthroughStepId) {
      return (
        <View onLayout={this.setWalkthroughStepMeasures} ref={(ref) => { this.reference = ref; }}>
          {children}
        </View>
      );
    }

    if (Platform.OS === 'android' || !showTooltip) {
      return children;
    }

    return (
      <View style={{ overflow: 'visible', position: 'relative', zIndex: 9999 }}>
        <TouchableOpacity onPress={this.showNext}>
          {children}
          {!!showTooltip && refMeasures &&
            <WalkthroughTooltip
              isAttached
              targetMeasurements={refMeasures}
              onTooltipButtonPress={this.showNext}
              {...tooltipInfo}
            />
          }
        </TouchableOpacity>
      </View>
    );
  }
}


const mapStateToProps = ({
  walkthroughs: {
    type: walkthroughType,
    waitingForStepId,
    activeStepId,
    steps,
  },
}) => ({
  walkthroughType,
  waitingForStepId,
  activeStepId,
  steps,
});

const mapDispatchToProps = (dispatch) => ({
  addWalkthroughStepMeasure: (stepId: string, measurements: Measurements) =>
    dispatch(addWalkthroughStepMeasureAction(stepId, measurements)),
  showNextStep: () => dispatch(showNextStepExternalAction()),
});

export default withNavigation(connect(mapStateToProps, mapDispatchToProps)(WalkthroughItem));
