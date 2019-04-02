// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as React from 'react';
import {
  Animated,
  PanResponder,
  Dimensions,
  Platform,
  Easing,
} from 'react-native';
import styled from 'styled-components/native';
import { baseColors } from 'utils/variables';
import { getiOSNavbarHeight } from 'utils/common';
import ExtraDimensions from 'react-native-extra-dimensions-android';

type Props = {
  screenHeight: number, // IMPORTANT to calculate sheet height,
  // preferably getting parent Container height onLayout.
  // Will fallback to not that accurate calculations if not provided
  initialSheetHeight: number,
  topOffset: number,
  swipeToCloseHeight: number,
  animateHeight?: boolean,
  onSheetOpen?: Function,
  onSheetClose?: Function,
  scrollingComponentsRefs?: Array<Object>, // list of refs of scrollable components.
  // Used to scroll all content of those components to the top once sheet is closed
  children: React.Node,
  floatingHeaderContent?: React.Node,
  sheetWrapperStyle?: Object,
}

type State = {
  isTouched: boolean,
  isMoved: boolean,
  topSheetPosition: Animated.Value,
  animatedHeight: Animated.Value,
  isSheetOpen: boolean,
}

const USABLE_SCREEN_HEIGHT = Platform.OS === 'android'
  ? ExtraDimensions.get('REAL_WINDOW_HEIGHT') - ExtraDimensions.getSoftMenuBarHeight()
  : Dimensions.get('window').height - getiOSNavbarHeight();

const ModalWrapper = styled.View`
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  padding: 10px 0;
  position: relative;
  flex: 1;
`;

const Sheet = styled.View`
  width: 100%;
  position: absolute;
  elevation: 10;
  background-color: white;
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  shadow-color: ${baseColors.black};
  shadow-radius: 10px;
  shadow-opacity: 0.2;
  shadow-offset: 0px 11px;
  z-index: 9999;
`;

const FloatingHeader = styled.View`
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  background-color: white;
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  height: 40px;
`;

const AnimatedSheet = Animated.createAnimatedComponent(Sheet);

export default class BottomSheet extends React.Component<Props, State> {
  initialPosition: number;
  panResponder: Object;

  static defaultProps = {
    screenHeight: USABLE_SCREEN_HEIGHT,
    initialSheetHeight: 100,
    topOffset: 68,
    swipeToCloseHeight: 120,
  };

  constructor(props: Props) {
    super(props);
    this.panResponder = React.createRef();
    this.initialPosition = USABLE_SCREEN_HEIGHT - this.props.initialSheetHeight;
    this.state = {
      isTouched: false,
      isMoved: false,
      topSheetPosition: new Animated.Value(400),
      animatedHeight: new Animated.Value(this.props.initialSheetHeight),
      isSheetOpen: false,
    };
  }

  componentDidMount() {
    this.buildPanResponder();
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const { isSheetOpen } = this.state;
    const { onSheetOpen, onSheetClose } = this.props;
    if (prevState.isSheetOpen !== isSheetOpen) {
      if (isSheetOpen && onSheetOpen) {
        onSheetOpen();
      } else if (onSheetClose) {
        onSheetClose();
      }
    }
  }

  buildPanResponder = () => {
    this.panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (e, gestureState) => {
        const { isSheetOpen } = this.state;
        const { topOffset, swipeToCloseHeight } = this.props;
        const swipeToCloseZone = topOffset + swipeToCloseHeight;
        if (isSheetOpen) {
          return gestureState.moveY > 0 && gestureState.moveY < swipeToCloseZone;
        }
        return true;
      },
      onPanResponderMove: (e, gestureState) => {
        this.setState({ isTouched: false, isMoved: true });
        this.moveDrawerView(gestureState);
      },
      onPanResponderRelease: (e, gestureState) => {
        const { isTouched, isMoved } = this.state;
        if (isTouched || isMoved) {
          this.animateSheet(gestureState, isTouched);
        }
        this.setState({
          isTouched: false,
          isMoved: false,
        });
      },
      onStartShouldSetPanResponderCapture: () => !this.state.isSheetOpen,
      onPanResponderGrant: () => {
        const { isSheetOpen } = this.state;
        if (isSheetOpen) return;
        this.setState({ isTouched: true });
      },
      onPanResponderTerminationRequest: () => false,
    });
  };

  moveDrawerView = (gestureState: Object) => {
    const { topSheetPosition, animatedHeight } = this.state;
    const { animateHeight, initialSheetHeight, screenHeight } = this.props;
    let position = gestureState.moveY;
    let sheetHeight = screenHeight - position;

    if (animateHeight) {
      if (sheetHeight < initialSheetHeight) {
        sheetHeight = initialSheetHeight;
      }
      animatedHeight.setValue(sheetHeight);
    } else {
      if (position > this.initialPosition) {
        position = this.initialPosition;
      }
      topSheetPosition.setValue(position);
    }
  };

  animateSheet = (gestureState: Object, isPressed: boolean) => {
    const { isSheetOpen, topSheetPosition, animatedHeight } = this.state;
    const {
      scrollingComponentsRefs,
      animateHeight,
      initialSheetHeight,
      screenHeight,
      topOffset,
    } = this.props;

    let isGoingToUp = gestureState.vy < 0;
    if (isPressed && !isSheetOpen) {
      isGoingToUp = true;
    }

    const sheetHeight = isGoingToUp ? screenHeight - topOffset : initialSheetHeight;
    const endPosition = isGoingToUp ? topOffset : this.initialPosition;

    if (animateHeight) {
      if (!isGoingToUp && scrollingComponentsRefs && scrollingComponentsRefs.length) {
        scrollingComponentsRefs.forEach((ref) => {
          ref.scrollToOffset({ x: 0, y: 0, animated: false });
        });
      }
      Animated.timing(animatedHeight, {
        toValue: sheetHeight,
        easing: Easing.linear,
        duration: 300,
      }).start(() => {
        topSheetPosition.setValue(endPosition);
        this.setState({ isSheetOpen: isGoingToUp });
      });
    } else {
      if (!isGoingToUp && scrollingComponentsRefs && scrollingComponentsRefs.length) {
        scrollingComponentsRefs.forEach((ref) => {
          ref.scrollToOffset({ x: 0, y: 0, animated: false });
        });
      }
      Animated.timing(topSheetPosition, {
        toValue: endPosition,
        easing: Easing.linear,
        duration: 300,
      }).start(() => {
        animatedHeight.setValue(sheetHeight);
        this.setState({ isSheetOpen: isGoingToUp });
      });
    }
  };

  render = () => {
    const { topSheetPosition, animatedHeight } = this.state;
    const {
      topOffset,
      children,
      floatingHeaderContent,
      screenHeight,
      sheetWrapperStyle,
      animateHeight,
    } = this.props;

    const sheetHeight = screenHeight - topOffset;

    let style = {
      top: topSheetPosition,
      height: sheetHeight,
    };

    let wrapperStyle = {};

    if (animateHeight) {
      style = {
        height: animatedHeight,
        overflow: 'hidden',
        bottom: 0,
        left: 0,
      };

      wrapperStyle = {
        height: sheetHeight,
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
      };
    }

    return (
      <AnimatedSheet
        style={style}
        {...this.panResponder.panHandlers}
      >
        <FloatingHeader>
          {floatingHeaderContent}
        </FloatingHeader>
        <ModalWrapper
          style={[wrapperStyle, { sheetWrapperStyle }]}
        >
          {children}
        </ModalWrapper>
      </AnimatedSheet>
    );
  };
}
