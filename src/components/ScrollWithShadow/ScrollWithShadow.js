// @flow
import * as React from 'react';
import { FlatList, Animated } from 'react-native';
import styled from 'styled-components/native';
import { ScrollShadow } from './ScrollShadow';

type Props = {
  children?: React.Node,
  onScroll?: Function,
  componentProp?: string,
};

type State = {
  scrollY: Animated.Value,
}

export const Center = styled.View`
  align-items: center;
`;

const ShadowWrapper = styled.View`
  overflow: hidden;
  position: relative;
  flex: 1;
`;

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default class ScrollWithShadow extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      scrollY: new Animated.Value(0),
    };
  }

  renderScroller = (props: Props) => {
    const {
      children,
      onScroll,
    } = props;

    const { scrollY } = this.state;

    const allOtherProps = Object.keys(props).reduce((object, key) => {
      if (key !== 'onScroll') {
        object[key] = props[key];
      }
      return object;
    }, {});

    if (Object.keys(props).includes('renderItem')) {
      return (
        <AnimatedFlatList
          {...allOtherProps}
          onScroll={
            Animated.event(
            [
              {
                nativeEvent: {
                  contentOffset: { y: scrollY },
                },
              },
            ],
            {
              useNativeDriver: true,
              listener: () => {
                if (onScroll) onScroll();
              },
            },
          )}
        />
      );
    }

    return (
      <Animated.ScrollView
        {...allOtherProps}
        onScroll={Animated.event(
          [
            {
              nativeEvent: {
                contentOffset: { y: scrollY },
              },
            },
          ],
          {
            useNativeDriver: true,
            listener: () => {
              if (onScroll) onScroll();
            },
          },
        )}
      >
        {children}
      </Animated.ScrollView>
    );
  };

  render() {
    const { scrollY } = this.state;
    const shadowOpacity = scrollY.interpolate({
      inputRange: [0, 10],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return (
      <ShadowWrapper>
        <ScrollShadow shadowOpacity={shadowOpacity} />
        {this.renderScroller(this.props)}
      </ShadowWrapper>
    );
  }
}
