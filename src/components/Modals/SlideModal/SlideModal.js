// @flow
import * as React from 'react';
import {
  Animated,
  ScrollView,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';


type Props = {
};

type State = {
  animFadeInBackground: any,
  animSlideModalVertical: any,
};

export default class PopModal extends React.Component<Props, State> {
  state = {
    animFadeInBackground: new Animated.Value(0),
    animSlideModalVertical: new Animated.Value(0),
  };

  componentDidMount() {
    Animated.parallel([
      Animated.spring(this.state.animFadeInBackground, {
        toValue: 1,
      }),
      Animated.spring(this.state.animSlideModalVertical, {
        toValue: -200,
      }),

    ]).start();
  }

  dismissAnimation = () => {
    // TODO: Make this happen after the animation completes
    // this.props.popModalHandleDismiss();
  };

  render() {
    const { animFadeInBackground, animFadeInBackground } = this.state;

    return (
      <View>
        <ScrollView>

          <TouchableHighlight />

          <Animated.View>
            {/* PLACE APPROPRIATE COMPONANT HERE */}
          </Animated.View>
        </ScrollView>
      </View>
    );
  }
}
