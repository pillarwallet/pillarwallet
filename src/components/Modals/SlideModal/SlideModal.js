// @flow
import * as React from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  View,
} from 'react-native';
import Title from 'components/Title';
import type { ScrollEvent } from 'react-native';
import ButtonIcon from 'components/ButtonIcon';
import { noop } from 'utils/common';
import styles from './styles';

type Props = {
  title: string,
  onDismiss: Function,
  children?: React.Node,
  fullScreenComponent?: ?React.Node,
  modalDismissalCallback: Function,
  isVisible: boolean,
};

type State = {
  animFadeInBackground: any,
  animSlideModalVertical: any,
  isVisible: boolean,
};

const window = Dimensions.get('window');
const modalOffset = 300;

export default class SlideModal extends React.Component<Props, State> {
  static defaultProps = {
    onDismiss: noop,
    modalDismissalCallback: noop,
    fullScreenComponent: null,
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      animFadeInBackground: new Animated.Value(0),
      animSlideModalVertical: new Animated.Value(window.height),
      isVisible: props.isVisible,
    };
  }

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    if (nextProps.isVisible !== prevState.isVisible) {
      return {
        ...prevState,
        isVisible: nextProps.isVisible,
        animFadeInBackground: new Animated.Value(0),
        animSlideModalVertical: new Animated.Value(window.height),
      };
    }
    return null;
  }

  componentDidMount() {
    const { modalDismissalCallback } = this.props;
    modalDismissalCallback(this.handleAnimationDismiss);
  }

  componentWillUnmount() {
    const { modalDismissalCallback } = this.props;
    modalDismissalCallback(noop);
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevState.isVisible === this.state.isVisible) return;
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

  handleScroll = (event: ScrollEvent) => {
    const distanceY = event.nativeEvent.contentOffset.y;
    const offsetY = -50;
    if (distanceY <= offsetY) {
      this.handleAnimationDismiss();
    }
  };

  handleAnimationDismiss = () => {
    const { onDismiss } = this.props;
    Animated.parallel([
      Animated.timing(this.state.animFadeInBackground, {
        toValue: 0,
      }),
      Animated.timing(this.state.animSlideModalVertical, {
        toValue: window.height,
        duration: 200,
      }),
    ]).start(() => {
      this.setState({
        isVisible: false,
      }, onDismiss);
    });
  };

  render() {
    const {
      animFadeInBackground,
      animSlideModalVertical,
      isVisible,
    } = this.state;
    const { children, title, fullScreenComponent } = this.props;

    if (!isVisible) return null;

    return (
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.dismissOverlay, { opacity: animFadeInBackground }]} />
        <View style={styles.modalScrollContainer}>
          <ScrollView
            onScroll={this.handleScroll}
            scrollEventThrottle={200}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentStyle}
          >
            <Animated.View style={
              [
                styles.sliderContainer,
                { marginTop: animSlideModalVertical, height: (window.height * 2) - modalOffset },
              ]}
            >
              <View style={styles.sliderHeaderContainer}>
                <Title title={title} />
                <ButtonIcon
                  icon="close"
                  onPress={this.handleAnimationDismiss}
                  fontSize={36}
                  style={styles.closeButton}
                />
              </View>
              <View style={styles.contentWrapper}>
                {children}
              </View>
              <View style={styles.offscreenWrapper} />
            </Animated.View>
          </ScrollView>
        </View>
        {fullScreenComponent}
      </View>
    );
  }
}
