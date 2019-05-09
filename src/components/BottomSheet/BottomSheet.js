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
  View,
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
  forceOpen: boolean,
}

type State = {
  yTranslate: Animated.Value,
  animatedHeight: Animated.Value,
}

const screenHeightFromDimensions = Dimensions.get('window').height;

const USABLE_SCREEN_HEIGHT = Platform.OS === 'android'
  ? ExtraDimensions.get('REAL_WINDOW_HEIGHT') - ExtraDimensions.getSoftMenuBarHeight()
  : screenHeightFromDimensions - getiOSNavbarHeight();

const ModalWrapper = styled.View`
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  padding-top: 10px;
  flex: 1;
  overflow: hidden;
`;

const Sheet = styled.View`
  width: 100%;
  position: absolute;
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  background-color: ${baseColors.white};
  elevation: 10;
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
  z-index: 10;
  background-color: white;
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  height: 40px;
`;

const AnimatedSheet = Animated.createAnimatedComponent(Sheet);
const ModalWrapperAnimated = Animated.createAnimatedComponent(ModalWrapper);

export default class BottomSheet extends React.Component<Props, State> {
  initialPosition: number;
  panResponder: Object;
  isTransitioning: boolean;
  isSheetOpen: boolean;

  static defaultProps = {
    screenHeight: USABLE_SCREEN_HEIGHT,
    initialSheetHeight: 100,
    topOffset: 68,
    swipeToCloseHeight: 150,
    forceOpen: false,
  };

  constructor(props: Props) {
    super(props);
    const {
      forceOpen,
      screenHeight,
      topOffset,
      initialSheetHeight,
    } = this.props;
    this.panResponder = React.createRef();
    this.isTransitioning = false;
    this.isSheetOpen = forceOpen;
    this.initialPosition = screenHeightFromDimensions - initialSheetHeight - topOffset;

    const initialTopPosition = forceOpen ? 0 : this.initialPosition;
    const initialHeight = forceOpen ? screenHeight - topOffset : initialSheetHeight;

    this.state = {
      animatedHeight: new Animated.Value(initialHeight),
      yTranslate: new Animated.Value(initialTopPosition),
    };
  }

  componentDidMount() {
    this.buildPanResponder();
  }

  componentDidUpdate(prevProps: Props) {
    const { forceOpen, screenHeight, topOffset } = this.props;
    const { animatedHeight } = this.state;
    if (forceOpen !== prevProps.forceOpen) {
      this.animateSheet();
    }

    if (prevProps.screenHeight !== screenHeight && this.isSheetOpen) {
      Animated.spring(animatedHeight, {
        toValue: screenHeight - topOffset,
        bounciness: 0,
      }).start();
    }
  }

  buildPanResponder = () => {
    this.panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (e, gestureState) => {
        if (this.isTransitioning) return false;
        const { topOffset, swipeToCloseHeight } = this.props;
        const swipeToCloseZone = topOffset + swipeToCloseHeight;
        if (this.isSheetOpen) {
          return gestureState.moveY > 0 && gestureState.moveY < swipeToCloseZone && Math.abs(gestureState.dy) >= 8;
        }
        return Math.abs(gestureState.dx) >= 8 || Math.abs(gestureState.dy) >= 8;
      },
      onPanResponderMove: (e, gestureState) => {
        if (this.isTransitioning) return;
        this.moveSheet(gestureState);
      },
      onPanResponderRelease: () => {
        if (this.isTransitioning) return;
        this.animateSheet();
      },
      onStartShouldSetPanResponderCapture: () => !this.isSheetOpen,
      onPanResponderTerminationRequest: () => false,
    });
  };

  moveSheet = (gestureState: Object) => {
    if (this.isTransitioning) return;
    const { animatedHeight, yTranslate } = this.state;
    const {
      animateHeight,
      initialSheetHeight,
      screenHeight,
      topOffset,
    } = this.props;

    const position = gestureState.moveY;
    let sheetHeight = screenHeight - position;
    let translateYvalue = position - topOffset;

    if (animateHeight) {
      if (sheetHeight < initialSheetHeight) {
        sheetHeight = initialSheetHeight;
      }
      animatedHeight.setValue(sheetHeight);
    } else {
      if (position < topOffset) return;
      if (translateYvalue > this.initialPosition) {
        translateYvalue = this.initialPosition;
      }
      yTranslate.setValue(translateYvalue);
    }
  };

  onAnimationEnd = (isGoingToUp: boolean) => {
    this.isTransitioning = false;
    const { onSheetOpen, onSheetClose } = this.props;
    if (isGoingToUp && onSheetOpen) {
      onSheetOpen();
    } else if (onSheetClose) {
      onSheetClose();
    }
  };

  animateSheet = (gestureState?: Object) => {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    const { animatedHeight, yTranslate } = this.state;
    const {
      scrollingComponentsRefs,
      animateHeight,
      initialSheetHeight,
      screenHeight,
      topOffset,
    } = this.props;

    let isGoingToUp = !this.isSheetOpen;
    if (gestureState && gestureState !== 0) {
      isGoingToUp = gestureState.vy < 0;
    }

    const sheetHeight = isGoingToUp ? screenHeight - topOffset : initialSheetHeight;
    const endPosition = isGoingToUp ? 0 : this.initialPosition;

    if (animateHeight) {
      if (!isGoingToUp && scrollingComponentsRefs && scrollingComponentsRefs.length) {
        scrollingComponentsRefs.forEach((ref) => {
          ref.scrollToOffset({ x: 0, y: 0, animated: false });
        });
      }
      Animated.spring(animatedHeight, {
        toValue: sheetHeight,
        bounciness: 0,
      }).start(() => {
        yTranslate.setValue(endPosition);
        this.onAnimationEnd(isGoingToUp);
      });
    } else {
      if (!isGoingToUp && scrollingComponentsRefs && scrollingComponentsRefs.length) {
        scrollingComponentsRefs.forEach((ref) => {
          ref.scrollToOffset({ x: 0, y: 0, animated: false });
        });
      }
      Animated.spring(this.state.yTranslate, {
        toValue: endPosition,
        bounciness: 0,
      }).start(() => {
        this.onAnimationEnd(isGoingToUp);
      });
    }
    this.isSheetOpen = isGoingToUp;
  };

  render = () => {
    const { animatedHeight, yTranslate } = this.state;
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
      height: sheetHeight,
      bottom: 0,
      transform: [{ translateY: yTranslate }],
    };

    let wrapperStyle = {
      flex: 1,
    };

    if (animateHeight) {
      style = {
        height: animatedHeight,
        bottom: 0,
        left: 0,
      };

      wrapperStyle = {
        height: sheetHeight,
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        overflow: 'hidden',
      };
    }

    return (
      <AnimatedSheet
        style={style}
        {...this.panResponder.panHandlers}
        useNativeDriver
      >
        <FloatingHeader>
          {floatingHeaderContent}
        </FloatingHeader>
        <ModalWrapperAnimated style={{ height: animatedHeight }}>
          <View style={[wrapperStyle, { sheetWrapperStyle }]}>
            {children}
          </View>
        </ModalWrapperAnimated>
      </AnimatedSheet>
    );
  };
}
