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
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import styled from 'styled-components/native';
import { getiOSNavbarHeight } from 'utils/common';
import { themedColors } from 'utils/themes';
import ExtraDimensions from 'react-native-extra-dimensions-android';
import Tabs from 'components/Tabs';
import Title from 'components/Title';
import { CHAT } from 'constants/tabsConstants';

type Props = {
  screenHeight: number, // IMPORTANT to calculate sheet height,
  // preferably getting parent Container height onLayout.
  // Will fallback to not that accurate calculations if not provided
  sheetHeight: number,
  topOffset: number,
  swipeToCloseHeight: number,
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
  inverse?: boolean, // set to true if content should be absolute and positioned to the bottom of the sheet
  // (resulting in cropping overflow and revealing upper content on sheet opening)
  sheetHeader?: string,
  onHeaderLayout?: Function,
  constantScreenHeight: number,
}

type State = {
  animatedHeight: Animated.Value,
  isSheetOpen: boolean,
  isDragging: boolean,
  keyboardVisible: boolean,
}

const screenHeightFromDimensions = Dimensions.get('window').height;
const screenWidth = Dimensions.get('window').width;

const USABLE_SCREEN_HEIGHT = Platform.OS === 'android'
  ? ExtraDimensions.get('REAL_WINDOW_HEIGHT') - ExtraDimensions.getSoftMenuBarHeight()
  : screenHeightFromDimensions - getiOSNavbarHeight();

const ModalWrapper = styled.View`
  padding-top: 6px;
  flex: 1;
  overflow: hidden;
`;

const Sheet = styled.View`
  width: 100%;
  position: absolute;
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  background-color: ${themedColors.card};
  elevation: 10;
  shadow-color: #000000;
  shadow-radius: 10px;
  shadow-opacity: 0.2;
  shadow-offset: 0px 11px;
  z-index: 9999;
`;

const RelativeHeader = styled.View`
  width: 100%;
  z-index: 10;
  min-height: 30px;
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  padding: 0 16px;
`;

const FloatingHeader = styled.View`
  width: 100%;
  position: absolute;
  top: -10px;
  left: 0;
  z-index: 10;
  background-color: transparent;
  min-height: 60px;
`;

const Cover = styled.View`
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
  background-color: white;
  height: 30px;
  justify-content: flex-start;
  align-items: center;
  padding-top: 0px;
`;

const HandlebarsWrapper = styled.View`
  flex-direction: row;
  position: relative;
  height: 10px;
  width: 40px;
  align-self: center;
  margin-top: 10px;
`;

const Handlebar = styled.View`
  height: 5px;
  width: 20px;
  background-color: ${themedColors.primary};
  position: absolute;
  top: 2px;
  border-radius: 6px;
  ${props => props.right
    ? 'right: 2.2px;'
    : 'left: 2.2px;'}
`;

const ClickableBackdrop = styled.View`
  flex: 1;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  background-color: #000000;
`;

const AnimatedSheet = Animated.createAnimatedComponent(Sheet);
const AnimatedModalWrapper = Animated.createAnimatedComponent(ModalWrapper);
const AnimatedLeftHandlebar = Animated.createAnimatedComponent(Handlebar);
const AnimatedRightHandlebar = Animated.createAnimatedComponent(Handlebar);
const AnimatedClickableBackdrop = Animated.createAnimatedComponent(ClickableBackdrop);

const HORIZONTAL_TAB_BOUNDARIES = [14, screenWidth - 28];
const BACKDROP_OPACITY = 0.7;

const DOWN = 'DOWN';
const UP = 'UP';

export default class BottomSheet extends React.Component<Props, State> {
  panResponder: Object;
  isTransitioning: boolean;
  forceAnimateAfterNotCapturedTouch: boolean;
  currentDirection: string;
  tabHeaderHeight: number;
  keyboardEventListeners: any[] = [];

  static defaultProps = {
    screenHeight: USABLE_SCREEN_HEIGHT,
    sheetHeight: 100,
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
      sheetHeight,
      activeTab,
    } = this.props;
    this.panResponder = React.createRef();
    this.isTransitioning = false;
    this.forceAnimateAfterNotCapturedTouch = false;
    this.currentDirection = '';
    this.tabHeaderHeight = 0;

    const initialHeight = forceOpen ? screenHeight - topOffset : sheetHeight;

    this.state = {
      animatedHeight: new Animated.Value(initialHeight),
      isSheetOpen: forceOpen,
      isDragging: false,
      keyboardVisible: forceOpen && activeTab === CHAT,
    };
  }

  componentDidMount() {
    this.buildPanResponder();
    this.keyboardEventListeners = [
      Keyboard.addListener('keyboardDidShow', () => this.setState({ keyboardVisible: true })),
      Keyboard.addListener('keyboardDidHide', () => this.setState({ keyboardVisible: false })),
    ];
  }

  componentWillUnmount() {
    this.keyboardEventListeners.forEach((eventListener) => eventListener.remove());
  }

  componentDidUpdate(prevProps: Props) {
    const {
      forceOpen,
      topOffset,
      sheetHeight,
      screenHeight,
    } = this.props;
    const { animatedHeight, isSheetOpen } = this.state;

    if (forceOpen !== prevProps.forceOpen) {
      this.animateSheet();
    }

    if (prevProps.sheetHeight !== sheetHeight && !isSheetOpen) {
      Animated.spring(animatedHeight, {
        toValue: sheetHeight,
        bounciness: 0,
      }).start();
    }

    if (prevProps.screenHeight !== screenHeight && isSheetOpen) {
      Animated.spring(animatedHeight, {
        toValue: screenHeight - topOffset,
        bounciness: 0,
      }).start();
    }
  }

  getDirection = (gestureState: Object) => {
    return gestureState.vy > 0 ? DOWN : UP;
  };

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
        this.currentDirection = this.getDirection(gestureState);
      },
      onPanResponderRelease: () => {
        if (this.isTransitioning) return;
        const { isDragging } = this.state;
        if (isDragging) this.setState({ isDragging: false });
        this.animateSheet(this.currentDirection);
        this.currentDirection = '';
      },
      onStartShouldSetPanResponderCapture: (e) => {
        const {
          captureTabs,
          tabs,
          activeTab,
          screenHeight,
        } = this.props;
        const { isSheetOpen, animatedHeight } = this.state;
        const { pageX, pageY } = e.nativeEvent;
        const topValueSheetPosition = (screenHeight - animatedHeight._value) + this.tabHeaderHeight;

        if (isSheetOpen) {
          return false;
        } else if (!captureTabs && !!tabs) {
          if (pageY > topValueSheetPosition + 30
            && pageY < topValueSheetPosition + 60
            && pageX.toFixed(2) > HORIZONTAL_TAB_BOUNDARIES[0]
            && pageX.toFixed(2) < HORIZONTAL_TAB_BOUNDARIES[1]) {
            if (!isSheetOpen) {
              setTimeout(() => {
                this.animateSheet();
              }, 100);
              return false;
            }
          } else if (activeTab === CHAT) {
            if (pageY > screenHeight - 50
              && pageY < screenHeight) {
              this.animateSheet();
              return false;
            }
          }
        }
        return true;
      },
      onPanResponderTerminationRequest: () => false,
    });
  };

  moveSheet = (gestureState: Object) => {
    if (this.isTransitioning) return;
    const { animatedHeight } = this.state;
    const {
      sheetHeight,
      screenHeight,
    } = this.props;

    const position = gestureState.moveY;
    let updatedSheetHeight = screenHeight - position;

    if (updatedSheetHeight < sheetHeight) {
      updatedSheetHeight = sheetHeight;
    }
    animatedHeight.setValue(updatedSheetHeight);
  };

  animateSheet = (direction?: string) => {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const { animatedHeight, isSheetOpen } = this.state;
    const {
      scrollingComponentsRefs,
      sheetHeight,
      screenHeight,
      topOffset,
      onSheetOpen,
      onSheetClose,
    } = this.props;

    let isGoingToUp = !isSheetOpen;
    if (direction) {
      isGoingToUp = direction === UP;
    }

    this.setState({ isSheetOpen: isGoingToUp });

    const updatedSheetHeight = isGoingToUp ? screenHeight - topOffset : sheetHeight;

    if (!isGoingToUp && scrollingComponentsRefs && scrollingComponentsRefs.length) {
      scrollingComponentsRefs.forEach((ref) => {
        ref.scrollToOffset({ x: 0, y: 0, animated: false });
      });
    }

    if (isGoingToUp && onSheetOpen) {
      onSheetOpen();
    } else if (onSheetClose) {
      onSheetClose();
    }

    Animated.spring(animatedHeight, {
      toValue: updatedSheetHeight,
      bounciness: 0,
    }).start(() => {
      this.isTransitioning = false;
    });
  };

  render = () => {
    const {
      animatedHeight,
      isSheetOpen,
      isDragging,
      keyboardVisible,
    } = this.state;
    const {
      topOffset,
      children,
      sheetHeight,
      tabs = [],
      activeTab,
      inverse,
      sheetWrapperStyle,
      sheetHeader,
      onHeaderLayout,
      constantScreenHeight,
    } = this.props;

    const firstTab = tabs.length ? tabs[0].id : '';

    const openedSheetHeight = constantScreenHeight - topOffset;

    const style = {
      height: animatedHeight,
      bottom: 0,
      left: 0,
    };

    let wrapperStyle = {};

    const handlebarsOutputRanges = [
      sheetHeight,
      sheetHeight + 10,
      sheetHeight + 20,
      openedSheetHeight - 20,
      openedSheetHeight - 10,
      openedSheetHeight,
    ];

    const backdropOutputRanges = [
      sheetHeight,
      openedSheetHeight,
    ];

    let leftHandlebarAnimation = {
      transform: [
        {
          rotate: animatedHeight.interpolate({
            inputRange: handlebarsOutputRanges,
            outputRange: ['-15deg', '-15deg', '0deg', '0deg', '15deg', '15deg'],
          }),
        },
      ],
    };

    let rightHandlebarAnimation = {
      transform: [
        {
          rotate: animatedHeight.interpolate({
            inputRange: handlebarsOutputRanges,
            outputRange: ['15deg', '15deg', '0deg', '0deg', '-15deg', '-15deg'],
          }),
        },
      ],
    };

    let backdropAnimation = {
      opacity: animatedHeight.interpolate({
        inputRange: backdropOutputRanges,
        outputRange: [0, BACKDROP_OPACITY],
      }),
    };

    if (keyboardVisible) {
      leftHandlebarAnimation = { transform: [{ rotate: '15deg' }] };
      rightHandlebarAnimation = { transform: [{ rotate: '-15deg' }] };
      backdropAnimation = { opacity: BACKDROP_OPACITY };
    }

    if (inverse) {
      wrapperStyle = {
        height: openedSheetHeight,
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        overflow: 'hidden',
      };
    }

    return (
      <React.Fragment>
        <AnimatedSheet
          style={style}
          {...this.panResponder.panHandlers}
          useNativeDriver
        >
          <RelativeHeader>
            <HandlebarsWrapper>
              <AnimatedLeftHandlebar
                style={leftHandlebarAnimation}
              />
              <AnimatedRightHandlebar
                right
                style={rightHandlebarAnimation}
              />
            </HandlebarsWrapper>
            {!!sheetHeader &&
            <Title
              title={sheetHeader}
              fullWidth
              noMargin
              onLayout={(e) => {
                this.tabHeaderHeight = e.nativeEvent.layout.height;
                if (onHeaderLayout) onHeaderLayout(e.nativeEvent.layout.height);
              }}
              style={{ paddingTop: 6, paddingBottom: 12 }}
            />
            }
          </RelativeHeader>
          <AnimatedModalWrapper style={{ height: animatedHeight }}>
            <FloatingHeader>
              <Cover />
              {!!tabs &&
              <Tabs
                tabs={tabs}
                wrapperStyle={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 2,
                  width: '100%',
                }}
                activeTab={activeTab || firstTab}
              />
              }
            </FloatingHeader>
            <View style={[{ flex: 1, width: '100%' }, wrapperStyle, sheetWrapperStyle]}>
              {children}
            </View>
          </AnimatedModalWrapper>
        </AnimatedSheet>
        {(isSheetOpen || isDragging) &&
          <TouchableWithoutFeedback
            onPress={this.animateSheet}
          >
            <AnimatedClickableBackdrop
              style={backdropAnimation}
              activeOpacity={BACKDROP_OPACITY}
            />
          </TouchableWithoutFeedback>
        }
      </React.Fragment>
    );
  };
}
