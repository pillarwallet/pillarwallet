// @flow
import React, { Component } from 'react';

import { Animated } from 'react-native';
import { Path } from 'react-native-svg';

type Props = {};

class SvgPath extends Component<Props> {
  path: Path;

  setNativeProps = (props) => {
    if (this.path) {
      this.path.setNativeProps(props);
    }
  };

  render() {
    return (
      <Path
        ref={(ref) => { this.path = ref; }}
        {...this.props}
      />
    );
  }
}

const AnimatedSvgPath = Animated.createAnimatedComponent(SvgPath);

export default AnimatedSvgPath;
