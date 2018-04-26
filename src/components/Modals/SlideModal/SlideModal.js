// @flow
import * as React from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  View,
} from 'react-native';
import styled from 'styled-components';
import { Title } from 'components/Typography';
import { Icon } from 'native-base';
import type { ScrollEvent } from 'react-native';

import styles from './styles';

type Props = {
  title: string,
  onDismiss: Function,
  children?: React.Node,
  fullScreenComponent?: ?React.Node,
  isVisible: boolean
};

type State = {
  animFadeInBackground: any,
  animSlideModalVertical: any,
  isVisible: boolean
};

const window = Dimensions.get('window');
const modalOffset = 300;


const SlideModalHeader = styled.View`
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
`

const SlideModalTitle = styled(Title)`
  margin: 0;
  height: 36px;
  flex: 1;
`;

const SlideModalIcon = styled(Icon)`
  font-size: 36px;
  height: 36px;
  font-weight: 700;
  line-height: 36px;
`;

export default class SlideModal extends React.Component<Props, State> {
  static defaultProps = {
    onDismiss: () => { },
    fullScreenComponent: null,
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

  constructor(props: Props) {
    super(props);
    this.state = {
      animFadeInBackground: new Animated.Value(0),
      animSlideModalVertical: new Animated.Value(window.height),
      isVisible: props.isVisible,
    };
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
  }

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
            <Animated.View style={[styles.sliderContainer,
            { marginTop: animSlideModalVertical, height: (window.height * 2) - modalOffset }]}
            >
              <SlideModalHeader>
                <SlideModalTitle>{title}</SlideModalTitle>
                <SlideModalIcon name="close" onPress={this.handleAnimationDismiss} />
              </SlideModalHeader>
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
