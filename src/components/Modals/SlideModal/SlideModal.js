// @flow
import * as React from 'react';
import {
  Animated,
  Button,
  Dimensions,
  ScrollView,
  Text,
  View,
} from 'react-native';

import styles from './styles';

type Props = {
  title: string,
  modalDismiss: any,
};

type State = {
  animFadeInBackground: any,
  animSlideModalVertical: any,
};

const window = Dimensions.get('window');

export default class SlideModal extends React.Component<Props, State> {
  state = {
    animFadeInBackground: new Animated.Value(0),
    animSlideModalVertical: new Animated.Value(window.height),
  };

  componentDidMount() {
    Animated.parallel([
      Animated.timing(this.state.animFadeInBackground, {
        toValue: 0.5,
        duration: 200,
      }),
      Animated.spring(this.state.animSlideModalVertical, {
        toValue: 0,
      }),
    ]).start();
  }

  handleScroll = (event: any) => {
    const distanceY = event.nativeEvent.contentOffset.y;
    if (distanceY <= -50) {
      this.dismissAnimation();
    }
  }

  dismissAnimation = () => {
    Animated.parallel([
      Animated.timing(this.state.animFadeInBackground, {
        toValue: 0,
      }),
      Animated.timing(this.state.animSlideModalVertical, {
        toValue: window.height,
        duration: 200,
      }),

    ]).start(this.callback);
  };

  callback = () => {
    this.props.modalDismiss();
  }

  render() {
    const {
      animFadeInBackground,
      animSlideModalVertical,
    } = this.state;

    return (
      <View style={styles.modalContainer}>

        <Animated.View style={[styles.dismissOverlay, { opacity: animFadeInBackground }]} />

        <View style={styles.modalScrollContainer}>
          <ScrollView
            onScroll={this.handleScroll}
            scrollEventThrottle={300}
            showsVerticalScrollIndicator="false"
            contentContainerStyle={styles.scrollContentStyle}
          >

            <Animated.View style={[styles.sliderContainer,
              {
 marginTop: animSlideModalVertical,
                height: window.height * 2,
}]}
            >
              <View style={styles.sliderHeaderContainer}>
                <Text style={styles.sliderHeader}>{this.props.title}</Text>
                <Button title="dismiss" onPress={this.dismissAnimation} />
              </View>
              {/* PLACE APPROPRIATE COMPONANT HERE */}
            </Animated.View>
          </ScrollView>
        </View>
      </View>
    );
  }
}
