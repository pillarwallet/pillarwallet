// @flow
import * as React from 'react';
import { Animated } from 'react-native';
import styled from 'styled-components/native';
import LinearGradient from 'react-native-linear-gradient';
import { transparentize } from 'polished';

type Props = {
  children: React.Node,
};

type State = {
  showShadow: boolean,
  shadowOpacity: Object,
}

const gradientShadow = ['rgba(0, 0, 0, 0.07)', transparentize(1, 'rgba(0, 0, 0, 0.07)')];

export const Center = styled.View`
  align-items: center;
`;

const ShadowWrapper = styled.View`
  overflow: hidden;
  position: relative;
  flex: 1;
`;

const ShadowHolder = styled(LinearGradient)`
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 10px;
  z-index: 2;
`;

const ShadowHolderAnimated = Animated.createAnimatedComponent(ShadowHolder);

export default class ScrollWithShadow extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showShadow: false,
      shadowOpacity: new Animated.Value(0),
    };
  }

  onScrolling = (event: Object) => {
    this.setState({ showShadow: !!event.nativeEvent.contentOffset.y });
  };

  animateShadow = (shouldShow: boolean) => {
    const { shadowOpacity } = this.state;
    Animated.timing(shadowOpacity, {
      toValue: shouldShow ? 1 : 0,
      duration: 300,
    }).start();
  };

  componentDidUpdate(prevProps: Object, prevState: Object) {
    const { showShadow } = this.state;
    if (prevState.showShadow !== showShadow) {
      this.animateShadow(showShadow);
    }
  }

  render() {
    const { children } = this.props;
    const { shadowOpacity } = this.state;
    const childrenWithProps = React.Children.map(children, child => {
      return React.cloneElement(child, {
        onScrollBeginDrag: () => { this.setState({ showShadow: true }); },
        onScrollEndDrag: (e: Object) => { this.onScrolling(e); },
        onMomentumScrollEnd: (e: Object) => { this.onScrolling(e); },
      });
    });

    return (
      <ShadowWrapper>
        <ShadowHolderAnimated
          colors={gradientShadow}
          style={{
            opacity: shadowOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
          }}
        />
        {childrenWithProps}
      </ShadowWrapper>
    );
  }
}
