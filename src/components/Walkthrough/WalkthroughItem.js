// @flow
import * as React from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { connect } from 'react-redux';
import { withNavigation } from 'react-navigation';

import {
  addWalkthroughStepMeasureAction,
  showNextStepExternalAction,
} from 'actions/walkthroughsActions';
import type { Measurements, Steps, PosOverwrites } from 'reducers/walkthroughsReducer';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import { WALKTHROUGH_TYPES } from 'constants/walkthroughConstants';
import { measure } from 'utils/ui';
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
  posOverwrites?: PosOverwrites,
}

type State = {
  showTooltip: boolean,
  refMeasures: ?Measurements,
  tooltipInfo: ?TooltipInfo,
};

class WalkthroughItem extends React.Component<Props, State> {
  reference: React.ElementRef<any>;

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

  setWalkthroughStepMeasures = () => {
    const { addWalkthroughStepMeasure, walkthroughStepId, posOverwrites } = this.props;
    measure(this.reference)
      .then((measures) => {
        addWalkthroughStepMeasure(walkthroughStepId, { ...measures, posOverwrites });
      })
      .catch(() => {});
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
            // $FlowFixMe: flow update to 0.122
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
}: RootReducerState): $Shape<Props> => ({
  walkthroughType,
  waitingForStepId,
  activeStepId,
  steps,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  addWalkthroughStepMeasure: (stepId: string, measurements: Measurements) =>
    dispatch(addWalkthroughStepMeasureAction(stepId, measurements)),
  showNextStep: () => dispatch(showNextStepExternalAction()),
});

export default withNavigation(connect(mapStateToProps, mapDispatchToProps)(WalkthroughItem));
