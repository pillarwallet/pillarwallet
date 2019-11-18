// @flow
import * as React from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';
import { withNavigation } from 'react-navigation';

import { addWalkthroughStepMeasureAction } from 'actions/walkthroughsActions';
import type { Measurements } from 'reducers/walkthroughsReducer';

type Props = {
  children: React.Node,
  type: string,
  walkthroughType: string,
  walkthroughStepId: string,
  waitingForStepId: string,
  addWalkthroughStepMeasure: (stepId: string, measures: Measurements) => void,
}

const measure = async (ref: View): Promise<Measurements> =>
  new Promise(resolve => ref.measureInWindow((x, y, w, h) => resolve({
    x, y, w, h,
  })));

class WalkthroughItem extends React.PureComponent<Props> {
  reference = React.createRef();

  setWalkthroughStepMeasures = async () => {
    const { addWalkthroughStepMeasure, walkthroughStepId } = this.props;
    measure(this.reference)
      .then((measures) => {
        addWalkthroughStepMeasure(walkthroughStepId, measures);
      })
      .catch(() => {

      });
  };

  render() {
    const {
      children,
      type,
      walkthroughType,
      walkthroughStepId,
      waitingForStepId,
    } = this.props;

    if (walkthroughType === type && waitingForStepId === walkthroughStepId) {
      return (
        <View onLayout={this.setWalkthroughStepMeasures} ref={(ref) => { this.reference = ref; }}>
          {children}
        </View>
      );
    }

    return children;
  }
}


const mapStateToProps = ({
  walkthroughs: { type: walkthroughType, waitingForStepId },
}) => ({
  walkthroughType,
  waitingForStepId,
});

const mapDispatchToProps = (dispatch) => ({
  addWalkthroughStepMeasure: (stepId: string, measurements: Measurements) =>
    dispatch(addWalkthroughStepMeasureAction(stepId, measurements)),
});

export default withNavigation(connect(mapStateToProps, mapDispatchToProps)(WalkthroughItem));
