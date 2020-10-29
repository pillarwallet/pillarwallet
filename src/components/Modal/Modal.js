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

import { ToastProvider } from 'components/Toast';

import ModalProvider, { ModalStack, ModalIdContext } from './ModalProvider';
import type { ModalOptions } from './ModalProvider';

export { default as ModalProvider } from './ModalProvider';

export type ScrollToProps = {
  x?: number,
  y: number,
  animated: boolean,
}

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
  onModalWillHide?: () => void,
  onModalHide?: () => void,
  onModalWillShow?: () => void,
  onModalShow?: () => void,
  onSwipeStart?: () => void,
  onSwipeMove?: (percentageShown: number) => void,
  scrollOffset?: number,
  scrollOffsetMax?: number,
  scrollTo?: (_: ScrollToProps) => void,
  scrollHorizontal?: boolean,
  swipeThreshold?: number,
  swipeDirection?: SwipeDirection | SwipeDirection[],
  useNativeDriver?: boolean,
  hideModalContentWhileAnimating?: boolean,
  style?: any,
|};

type State = {|
  isVisible: boolean,
|};

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
  getId = () => this.context

  state = {
    isVisible: true,
  }

  closingCallbacks: (() => void)[] = [];

  callClosingCallbacks = () => {
    this.closingCallbacks.forEach(callback => callback());
    this.closingCallbacks = [];
  }

  componentDidMount() {
    const instance = ModalProvider.getInstance();
    if (instance) instance.modalInstances.set(this.getId(), this);
  }

  componentWillUnmount() {
    // Don't let the _close method hang if RNModal's onModalHide doesn't get
    // called before unmounting.
    this.callClosingCallbacks();

    const instance = ModalProvider.getInstance();
    if (instance) instance.modalInstances.delete(this.getId());
  }

  close = () => {
    const instance = ModalProvider.getInstance();
    if (instance) instance.close(this.getId());
  }

  _close = () => {
    this.setState({ isVisible: false });
    return new Promise((resolve) => {
      this.closingCallbacks.push(resolve);
    });
  }

  onHide = () => {
    this.callClosingCallbacks();
    const { onModalHide } = this.props;
    if (onModalHide) onModalHide();
  }

  render() {
    // swipeDirection is passed explicitly to work around issues with using
    // spread operator on union types
    const { children, swipeDirection, ...props } = this.props;
    const { isVisible } = this.state;

    return (
      <RNModal
        isVisible={isVisible}
        propagateSwipe
        swipeDirection={swipeDirection ?? 'down'}
        onSwipeComplete={this.close}
        onBackdropPress={this.close}
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
