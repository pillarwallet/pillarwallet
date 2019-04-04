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
  isTouched: boolean,
  isMoved: boolean,
  yTranslate: Animated.Value,
  animatedHeight: Animated.Value,
  isSheetOpen: boolean,
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

  static defaultProps = {
    screenHeight: USABLE_SCREEN_HEIGHT,
    initialSheetHeight: 100,
    topOffset: 68,
    swipeToCloseHeight: 150,
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
    this.initialPosition = screenHeightFromDimensions - initialSheetHeight - topOffset;

    const initialTopPosition = forceOpen ? 0 : this.initialPosition;
    const initialHeight = forceOpen ? screenHeight - topOffset : initialSheetHeight;

    this.state = {
      isTouched: false,
      isMoved: false,
      animatedHeight: new Animated.Value(initialHeight),
      yTranslate: new Animated.Value(initialTopPosition),
      isSheetOpen: forceOpen,
    };
  }

  componentDidMount() {
    this.buildPanResponder();
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.forceOpen && !prevProps.forceOpen) {
      this.animateSheet(true);
    } else if (!this.props.forceOpen && prevProps.forceOpen) {
      this.animateSheet(true);
    }
  }

  buildPanResponder = () => {
    this.panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (e, gestureState) => {
        if (this.isTransitioning) return false;
        const { isSheetOpen } = this.state;
        const { topOffset, swipeToCloseHeight } = this.props;
        const swipeToCloseZone = topOffset + swipeToCloseHeight;
        if (isSheetOpen) {
          return gestureState.moveY > 0 && gestureState.moveY < swipeToCloseZone && gestureState.dy > 10;
        }
        return Math.abs(gestureState.dx) >= 8 || Math.abs(gestureState.dy) >= 8;
      },
      onPanResponderMove: (e, gestureState) => {
        if (this.isTransitioning) return;
        this.setState({ isTouched: false, isMoved: true });
        this.moveSheet(gestureState);
      },
      onPanResponderRelease: (e, gestureState) => {
        if (this.isTransitioning) return;
        const { isTouched, isMoved } = this.state;
        if (isTouched || isMoved) {
          this.animateSheet(isTouched, gestureState);
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

  animateSheet = (isPressed: boolean, gestureState?: Object) => {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    const { isSheetOpen, animatedHeight, yTranslate } = this.state;
    const {
      scrollingComponentsRefs,
      animateHeight,
      initialSheetHeight,
      screenHeight,
      topOffset,
    } = this.props;

    let isGoingToUp = !isSheetOpen;
    if (gestureState) {
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
        this.setState({ isSheetOpen: isGoingToUp });
        this.isTransitioning = false;
      });
    } else {
      if (!isGoingToUp && scrollingComponentsRefs && scrollingComponentsRefs.length) {
        scrollingComponentsRefs.forEach((ref) => {
          ref.scrollToOffset({ x: 0, y: 0, animated: false });
        });
      }
      Animated.spring(this.state.yTranslate, {
        toValue: endPosition,
        friction: 10,
      }).start(() => {
        animatedHeight.setValue(sheetHeight);
        this.setState({ isSheetOpen: isGoingToUp });
        this.isTransitioning = false;
      });
    }

    const { onSheetOpen, onSheetClose } = this.props;

    if (isGoingToUp && onSheetOpen) {
      onSheetOpen();
    } else if (onSheetClose) {
      onSheetClose();
    }
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

    let wrapperStyle = {};

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
