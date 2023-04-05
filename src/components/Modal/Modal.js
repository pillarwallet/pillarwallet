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

import React from 'react';
import type { Node as ReactNode } from 'react';
import RNModal from 'react-native-modal';
import { View } from 'react-native';
import styled from 'styled-components/native';

// Components
import { ToastProvider } from 'components/Toast';

// Local
import ModalProvider, { ModalStack, ModalIdContext, EMPTY_MODAL_ID } from './ModalProvider';
import type { ModalOptions } from './ModalProvider';

export { default as ModalProvider } from './ModalProvider';

export type ScrollToProps = {|
  x?: number,
  y?: number,
  animated?: boolean,
|};

type SwipeDirection = 'up' | 'down' | 'left' | 'right';

// Props according to react-native-modal
type Props = {|
  children?: ReactNode,
  animationIn?: string | Object,
  animationInTiming?: number,
  animationOut?: string | Object,
  animationOutTiming?: number,
  avoidKeyboard?: boolean,
  coverScreen?: boolean,
  hasBackdrop?: boolean,
  backdropColor?: string,
  backdropOpacity?: number,
  backdropTransitionInTiming?: number,
  backdropTransitionOutTiming?: number,
  customBackdrop?: ReactNode,
  deviceHeight?: number,
  deviceWidth?: number,
  onBackButtonPress?: () => void,
  onModalWillHide?: () => void,
  onModalHide?: () => void,
  onModalWillShow?: () => void,
  onModalShow?: () => void,
  onSwipeStart?: () => void,
  onSwipeMove?: (percentageShown: number) => void,
  onSwipeComplete?: ({ swipingDirection: SwipeDirection }) => void,
  scrollOffset?: number,
  scrollOffsetMax?: number,
  scrollTo?: (_: ScrollToProps) => void,
  scrollHorizontal?: boolean,
  swipeThreshold?: number,
  swipeDirection?: SwipeDirection | SwipeDirection[],
  useNativeDriver?: boolean,
  hideModalContentWhileAnimating?: boolean,
  style?: any,
  backdropDismissable?: boolean,
  isSwipeClose?: boolean,
  propagateSwipe?: boolean,
|};

type State = {|
  isVisible: boolean,
|};

const StaticContainer = styled.View`
  background-color: rgba(0, 0, 0, 0.7);
  flex: 1;
  justify-content: center;
`;

class Modal extends React.Component<Props, State> {
  static open(render: $PropertyType<ModalOptions, 'render'>) {
    const instance = ModalProvider.getInstance();
    if (instance) instance.open({ render });
  }

  static closeAll() {
    const instance = ModalProvider.getInstance();
    if (instance) instance.closeAll();
  }

  static contextType = ModalIdContext;

  // alias for readability
  getId = () => this.context;
  state = {
    isVisible: true,
  };

  closingCallbacks: (() => void)[] = [];

  callClosingCallbacks = () => {
    this.closingCallbacks.forEach((callback) => callback());
    this.closingCallbacks = [];
  };

  componentDidMount() {
    const instance = ModalProvider.getInstance();
    if (instance) instance.modalInstances.set(this.getId(), this);
  }

  componentWillUnmount() {
    // Don't let the closeRNModal method hang if RNModal's onModalHide doesn't get
    // called before unmounting.
    this.callClosingCallbacks();

    const instance = ModalProvider.getInstance();
    if (instance) instance.modalInstances.delete(this.getId());
  }

  close = () => {
    const instance = ModalProvider.getInstance();
    if (instance) instance.close(this.getId());
  };

  closeRNModal = () => {
    this.setState({ isVisible: false });
    return new Promise((resolve) => {
      this.closingCallbacks.push(resolve);
    });
  };

  onHide = () => {
    this.callClosingCallbacks();
    const { onModalHide } = this.props;
    if (onModalHide) onModalHide();
  };

  render() {
    // swipeDirection is passed explicitly to work around issues with using
    // spread operator on union types
    const {
      children,
      swipeDirection,
      backdropDismissable = false,
      isSwipeClose = false,
      propagateSwipe = true,
      ...props
    } = this.props;
    const { isVisible } = this.state;

    // render contents direrctly with overlay-like background if the modal was
    // attached outside of ModalProvider (e.g. in storybook)
    return this.getId() === EMPTY_MODAL_ID ? (
      <StaticContainer>
        <View style={this.props.style}>{children}</View>
      </StaticContainer>
    ) : (
      <RNModal
        isVisible={isVisible}
        propagateSwipe={propagateSwipe}
        swipeDirection={swipeDirection ?? 'down'}
        onSwipeComplete={!isSwipeClose ? this.close : null}
        onBackdropPress={!backdropDismissable ? this.close : null}
        onBackButtonPress={this.close}
        avoidKeyboard
        style={{ margin: 0 }}
        {...props}
        onModalHide={this.onHide}
      >
        {children}
        {isVisible && <ToastProvider />}
        <ModalStack />
      </RNModal>
    );
  }
}

export default Modal;
