// @flow
import * as React from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';
import { withNavigation } from 'react-navigation';

import { addWalkthroughStepsAction } from 'actions/walkthroughsActions';
import type { Steps } from 'reducers/walkthroughsReducer';

type Position = {
  x: number,
  y: number,
  w: number,
  h: number,
}

type Props = {
  children: React.Node,
  type: string,
  walkthroughType: string,
  walkthroughId: string,
  waitingForStepId: string,
  addWalkthroughSteps: (steps: Steps) => void,
}

const measure = async (ref: View): Promise<Position> =>
  new Promise(resolve => ref.measureInWindow((x, y, w, h) => resolve({
    x, y, w, h,
  })));

class WalkthroughItem extends React.PureComponent<Props> {
  reference = React.createRef();

  setWalkthroughSteps = async () => {
    const { addWalkthroughSteps } = this.props;
    const pillarAsset = measure(this.reference);
    const measures = await Promise.all([pillarAsset]);

    const steps = [
      {
        x: measures[0].x,
        y: measures[0].y,
        width: measures[0].w,
        height: measures[0].h,
        label: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi massa diam, dapibus in dictum eu,' +
          'laoreet at nunc. Aenean tempus volutpat nisi non cursus.',
        buttonText: 'test',
      }];

    addWalkthroughSteps(steps);
  };

  render() {
    const {
      children,
      type,
      walkthroughType,
      walkthroughId,
      waitingForStepId,
    } = this.props;

    if (walkthroughType === type && waitingForStepId === walkthroughId) {
      return (
        <View onLayout={this.setWalkthroughSteps} ref={(ref) => { this.reference = ref; }}>
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
  addWalkthroughSteps: (steps: Steps) => dispatch(addWalkthroughStepsAction(steps)),
});

export default withNavigation(connect(mapStateToProps, mapDispatchToProps)(WalkthroughItem));
