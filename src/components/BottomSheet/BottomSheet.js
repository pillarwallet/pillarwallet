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
import Tabs from 'components/Tabs';

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
  sheetWrapperStyle?: Object,
  forceOpen: boolean,
  captureTabs?: boolean,
  tabs?: Array<Object>,
  activeTab?: string,
}

type State = {
  yTranslate: Animated.Value,
  animatedHeight: Animated.Value,
  isSheetOpen: boolean,
  isDragging: boolean,
}

const screenHeightFromDimensions = Dimensions.get('window').height;
const screenWidth = Dimensions.get('window').width;

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
  background-color: transparent;
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  min-height: 80px;
`;

const Cover = styled.View`
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
  background-color: white;
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  height: 40px;
  justify-content: flex-start;
  align-items: center;
  padding-top: 6px;
`;

const HandlebarsWrapper = styled.View`
  flex-direction: row;
  position: relative;
  height: 10px;
  width: 40px;
`;

const Handlebar = styled.View`
  height: 5px;
  width: 20px;
  background-color: ${baseColors.electricBlue};
  position: absolute;
  top: 2px;
  border-radius: 6px;
  ${props => props.right
    ? 'right: 2.2px;'
    : 'left: 2.2px;'}
`;

const ClickableBackdrop = styled.TouchableOpacity`
  flex: 1;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  background-color: ${baseColors.black};
`;

const AnimatedSheet = Animated.createAnimatedComponent(Sheet);
const AnimatedModalWrapper = Animated.createAnimatedComponent(ModalWrapper);
const AnimatedLeftHandlebar = Animated.createAnimatedComponent(Handlebar);
const AnimatedRightHandlebar = Animated.createAnimatedComponent(Handlebar);
const AnimatedClickableBackdrop = Animated.createAnimatedComponent(ClickableBackdrop);

const VERTICAL_TAB_BOUNDARIES = [6, 42];
const HORIZONTAL_TAB_BOUNDARIES = [14, screenWidth - 28];
const BACKDROP_OPACITY = 0.7;

export default class BottomSheet extends React.Component<Props, State> {
  initialPosition: number;
  panResponder: Object;
  isTransitioning: boolean;
  forceAnimateAfterNotCapturedTouch: boolean;

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
    this.initialPosition = USABLE_SCREEN_HEIGHT - initialSheetHeight - topOffset;
    this.forceAnimateAfterNotCapturedTouch = false;

    const initialTopPosition = forceOpen ? 0 : this.initialPosition;
    const initialHeight = forceOpen ? screenHeight - topOffset : initialSheetHeight;

    this.state = {
      animatedHeight: new Animated.Value(initialHeight),
      yTranslate: new Animated.Value(initialTopPosition),
      isSheetOpen: forceOpen,
      isDragging: false,
    };
  }

  componentDidMount() {
    this.buildPanResponder();
  }

  componentDidUpdate(prevProps: Props) {
    const {
      forceOpen,
      screenHeight,
      topOffset,
      initialSheetHeight,
      animateHeight,
    } = this.props;
    const { animatedHeight, yTranslate, isSheetOpen } = this.state;
    if (forceOpen !== prevProps.forceOpen) {
      this.animateSheet();
    }

    if (prevProps.initialSheetHeight !== initialSheetHeight && !isSheetOpen) {
      this.initialPosition = USABLE_SCREEN_HEIGHT - initialSheetHeight - topOffset;

      if (animateHeight) {
        Animated.spring(animatedHeight, {
          toValue: initialSheetHeight,
          bounciness: 0,
        }).start(() => {
          yTranslate.setValue(this.initialPosition);
        });
      } else {
        Animated.spring(yTranslate, {
          toValue: this.initialPosition,
          bounciness: 0,
        }).start(() => {
          animatedHeight.setValue(initialSheetHeight);
        });
      }
    }

    if (prevProps.screenHeight !== screenHeight && isSheetOpen) {
      Animated.spring(animatedHeight, {
        toValue: screenHeight - topOffset,
        bounciness: 0,
      }).start();
    }

    if (this.forceAnimateAfterNotCapturedTouch
      && prevProps.activeTab !== this.props.activeTab) {
      this.forceAnimateAfterNotCapturedTouch = false;
      this.animateSheet();
    }
  }

  buildPanResponder = () => {
    this.panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (e, gestureState) => {
        if (this.isTransitioning) return false;
        const { topOffset, swipeToCloseHeight } = this.props;
        const swipeToCloseZone = topOffset + swipeToCloseHeight;
        if (this.state.isSheetOpen) {
          return gestureState.moveY > 0 && gestureState.moveY < swipeToCloseZone && Math.abs(gestureState.dy) >= 8;
        }
        return Math.abs(gestureState.dx) >= 8 || Math.abs(gestureState.dy) >= 8;
      },
      onPanResponderMove: (e, gestureState) => {
        if (this.isTransitioning) return;
        const { isDragging } = this.state;
        if (!isDragging) this.setState({ isDragging: true });
        this.moveSheet(gestureState);
      },
      onPanResponderRelease: () => {
        if (this.isTransitioning) return;
        const { isDragging } = this.state;
        if (isDragging) this.setState({ isDragging: false });
        this.animateSheet();
      },
      onStartShouldSetPanResponderCapture: (e) => {
        const { captureTabs, tabs } = this.props;
        const { isSheetOpen } = this.state;
        const { pageX, locationY } = e.nativeEvent;

        if (!captureTabs && !!tabs) {
          if (locationY.toFixed(2) > VERTICAL_TAB_BOUNDARIES[0]
            && locationY.toFixed(2) < VERTICAL_TAB_BOUNDARIES[1]
            && pageX.toFixed(2) > HORIZONTAL_TAB_BOUNDARIES[0]
            && pageX.toFixed(2) < HORIZONTAL_TAB_BOUNDARIES[1]) {
            if (!isSheetOpen) {
              this.forceAnimateAfterNotCapturedTouch = true;
            }
            return false;
          }
        }
        return !isSheetOpen;
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

    const { animatedHeight, yTranslate, isSheetOpen } = this.state;
    const {
      scrollingComponentsRefs,
      animateHeight,
      initialSheetHeight,
      screenHeight,
      topOffset,
    } = this.props;

    let isGoingToUp = !isSheetOpen;
    if (gestureState && gestureState !== 0) {
      isGoingToUp = gestureState.vy < 0;
    }

    this.setState({ isSheetOpen: isGoingToUp });

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
      Animated.spring(yTranslate, {
        toValue: endPosition,
        bounciness: 0,
      }).start(() => {
        animatedHeight.setValue(sheetHeight);
        this.onAnimationEnd(isGoingToUp);
      });
    }
  };

  render = () => {
    const {
      animatedHeight,
      yTranslate,
      isSheetOpen,
      isDragging,
    } = this.state;
    const {
      topOffset,
      children,
      screenHeight,
      sheetWrapperStyle,
      animateHeight,
      initialSheetHeight,
      tabs,
      activeTab,
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

    const topOutputRange = screenHeight - topOffset;
    let handlebarsOutputRanges = [
      0,
      10,
      20,
      this.initialPosition - 20,
      this.initialPosition - 10,
      this.initialPosition,
    ];

    let backdropOutputRanges = [
      0,
      this.initialPosition,
    ];

    let leftHandlebarAnimation = {
      transform: [
        {
          rotate: yTranslate.interpolate({
            inputRange: handlebarsOutputRanges,
            outputRange: ['15deg', '15deg', '0deg', '0deg', '-15deg', '-15deg'],
          }),
        },
      ],
    };

    let rightHandlebarAnimation = {
      transform: [
        {
          rotate: yTranslate.interpolate({
            inputRange: handlebarsOutputRanges,
            outputRange: ['-15deg', '-15deg', '0deg', '0deg', '15deg', '15deg'],
          }),
        },
      ],
    };

    let backdropAnimation = {
      opacity: yTranslate.interpolate({
        inputRange: backdropOutputRanges,
        outputRange: [BACKDROP_OPACITY, 0],
      }),
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

      handlebarsOutputRanges = [
        initialSheetHeight,
        initialSheetHeight + 10,
        initialSheetHeight + 20,
        topOutputRange - 20,
        topOutputRange - 10,
        topOutputRange,
      ];

      backdropOutputRanges = [
        initialSheetHeight,
        topOutputRange,
      ];

      leftHandlebarAnimation = {
        transform: [
          {
            rotate: animatedHeight.interpolate({
              inputRange: handlebarsOutputRanges,
              outputRange: ['-15deg', '-15deg', '0deg', '0deg', '15deg', '15deg'],
            }),
          },
        ],
      };

      rightHandlebarAnimation = {
        transform: [
          {
            rotate: animatedHeight.interpolate({
              inputRange: handlebarsOutputRanges,
              outputRange: ['15deg', '15deg', '0deg', '0deg', '-15deg', '-15deg'],
            }),
          },
        ],
      };

      backdropAnimation = {
        opacity: animatedHeight.interpolate({
          inputRange: backdropOutputRanges,
          outputRange: [0, BACKDROP_OPACITY],
        }),
      };
    }

    return (
      <React.Fragment>
        <AnimatedSheet
          style={style}
          {...this.panResponder.panHandlers}
          useNativeDriver
        >
          <FloatingHeader>
            <Cover>
              <HandlebarsWrapper>
                <AnimatedLeftHandlebar
                  style={leftHandlebarAnimation}
                />
                <AnimatedRightHandlebar
                  right
                  style={rightHandlebarAnimation}
                />
              </HandlebarsWrapper>
            </Cover>
            {!!tabs &&
              <Tabs
                initialActiveTab={activeTab}
                tabs={tabs}
                wrapperStyle={{
                  position: 'absolute',
                  top: 8,
                  left: 0,
                  zIndex: 2,
                  width: '100%',
                }}
              />
            }
          </FloatingHeader>
          <AnimatedModalWrapper style={{ height: animatedHeight }}>
            <View style={[wrapperStyle, { sheetWrapperStyle }]}>
              {children}
            </View>
          </AnimatedModalWrapper>
        </AnimatedSheet>
        {(isSheetOpen || isDragging) &&
        <AnimatedClickableBackdrop
          onPress={this.animateSheet}
          style={backdropAnimation}
          activeOpacity={BACKDROP_OPACITY}
        />}
      </React.Fragment>
    );
  };
}
