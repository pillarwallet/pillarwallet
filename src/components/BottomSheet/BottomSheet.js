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
  screenHeight?: number, // IMPORTANT to calculate sheet height,
  // preferably getting parent Container height onLayout.
  // Will fallback to not that accurate calculations if not provided
  initialSheetHeight: number,
  topOffset: number,
  swipeToCloseHeight: number,
  onSheetOpen?: Function,
  onSheetClose?: Function,
  scrollingComponentsRefs: Array<Object>, // list of refs of scrollable components.
  // Used to scroll all content of those components to the top once sheet is closed
  children: React.Node,
}

type State = {
  isTouched: boolean,
  isMoved: boolean,
  topSheetPosition: Animated.Value,
  isSheetOpen: boolean,
}

let USABLE_SCREEN_HEIGHT;
if (Platform.OS === 'android') {
  USABLE_SCREEN_HEIGHT = ExtraDimensions.get('REAL_WINDOW_HEIGHT') - ExtraDimensions.getSoftMenuBarHeight();
} else {
  USABLE_SCREEN_HEIGHT = Dimensions.get('window').height - getiOSNavbarHeight();
}

const ModalWrapper = styled.View`
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  padding: 20px 0;
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

const AnimatedSheet = Animated.createAnimatedComponent(Sheet);

export default class BottomSheet extends React.Component<Props, State> {
  initialPosition: number;
  panResponder: Object;

  static defaultProps = {
    initialSheetHeight: 100,
    topOffset: 68,
    swipeToCloseHeight: 100,
  };

  constructor(props: Props) {
    super(props);
    this.panResponder = React.createRef();
    this.initialPosition = USABLE_SCREEN_HEIGHT - this.props.initialSheetHeight;
    this.state = {
      isTouched: false,
      isMoved: false,
      topSheetPosition: new Animated.Value(this.initialPosition),
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
    const { topSheetPosition } = this.state;
    let position = gestureState.moveY;

    if (position > this.initialPosition) {
      position = this.initialPosition;
    }

    topSheetPosition.setValue(position);
  };

  animateSheet = (gestureState: Object, isPressed: boolean) => {
    const { isSheetOpen, topSheetPosition } = this.state;
    const { scrollingComponentsRefs } = this.props;

    const { topOffset } = this.props;
    let isGoingToUp = gestureState.vy < 0;
    if (isPressed && !isSheetOpen) {
      isGoingToUp = true;
    }
    const endPosition = isGoingToUp ? topOffset : this.initialPosition;
    if (!isGoingToUp && scrollingComponentsRefs && scrollingComponentsRefs.length) {
      scrollingComponentsRefs.forEach((ref) => {
        ref.scrollToOffset({ x: 0, y: 0, animated: false });
      });
    }
    Animated.timing(topSheetPosition, {
      toValue: endPosition,
      easing: Easing.linear,
      duration: 500,
    }).start(this.setState({ isSheetOpen: isGoingToUp }));
  };

  render = () => {
    const { topSheetPosition } = this.state;
    const { topOffset, children, screenHeight } = this.props;
    const sheetHeight = screenHeight ? screenHeight - topOffset : USABLE_SCREEN_HEIGHT - topOffset;

    return (
      <AnimatedSheet
        style={{ top: topSheetPosition, height: sheetHeight }}
        {...this.panResponder.panHandlers}
      >
        <ModalWrapper>
          {children}
        </ModalWrapper>
      </AnimatedSheet>
    );
  };
}
