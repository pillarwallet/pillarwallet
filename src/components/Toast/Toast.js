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
import styled from 'styled-components/native';
import { Animated, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import merge from 'lodash.merge';
import Intercom from 'react-native-intercom';
import t from 'translations/translate';

import ToastCard from './ToastCard';

type ToastOptions = {
  autoClose?: boolean,
  onPress?: () => void,
  emoji: string,
  message: string,
  supportLink?: boolean,
  link?: string,
  onLinkPress?: () => void,
};

type State = {
  isVisible: boolean,
  animSlide: Object,
  toastOptions: ToastOptions,
};

const toastInitialOptions: ToastOptions = {
  autoClose: false,
  message: '',
  emoji: 'ok_hand',
  supportLink: false,
};

const ToastHolder = styled(SafeAreaView)`
  width: 100%;
`;

const ToastWrapper = styled.View`
  opacity: ${props => props.opacity};
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  z-index: 1000;
  justify-content: center;
  align-items: center;
  margin-top: ${props => props.androidStatusbarHeight || 0}px;
  padding: 40px 20px;
`;

const AnimatedToastWrapper = Animated.createAnimatedComponent(ToastWrapper);


class Toast extends React.Component<{}, State> {
  timeout: TimeoutID;

  state = {
    isVisible: false,
    animSlide: new Animated.Value(0),
    toastOptions: toastInitialOptions,
  };

  static toastInstances: Object[] = [];

  static show(toastOptions: ToastOptions) {
    const toast = this.toastInstances[this.toastInstances.length - 1];
    if (toast) {
      toast.handleOpen(toastOptions);
    }
  }

  static close() {
    const toast = this.toastInstances[this.toastInstances.length - 1];
    if (toast) {
      toast.handleClose();
    }
  }

  static isVisible() {
    const toast = this.toastInstances[this.toastInstances.length - 1];
    return toast ? toast.state.isVisible : false;
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
    Toast.toastInstances.splice(Toast.toastInstances.length - 1);
  }

  handleOpen = (toastOptions: ToastOptions) => {
    if (this.state.isVisible) return;
    const { options } = merge({}, { options: this.state.toastOptions }, { options: toastOptions });

    this.setState({
      isVisible: true,
      toastOptions: options,
    });

    Animated.timing(this.state.animSlide, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (!this.state.toastOptions.autoClose) return;
      this.timeout = setTimeout(() => {
        this.handleClose();
        clearTimeout(this.timeout);
      }, 2000);
    });
  };

  handleClose = () => {
    this.setState({ isVisible: false });
    Animated.timing(this.state.animSlide, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => this.setState({ toastOptions: toastInitialOptions }));
  };

  handlePress = () => {
    const { toastOptions: { onPress } } = this.state;
    if (!onPress) {
      return;
    }

    this.handleClose();
    onPress();
  };

  goToSupport = () => {
    Intercom.displayMessenger();
  }

  render() {
    const {
      toastOptions: {
        message, emoji, supportLink, link, onLinkPress,
      },
    } = this.state;
    const animation = this.state.animSlide.interpolate({
      inputRange: [0, 1],
      outputRange: [-260, 0],
    });

    const linkProps = supportLink ? {
      link: t('label.contactSupport'),
      onLinkPress: this.goToSupport,
    } : {
      link, onLinkPress,
    };

    return (
      <AnimatedToastWrapper
        style={{
          transform: [{ translateY: animation }],
        }}
        opacity={+!!this.state.toastOptions.message}
        androidStatusbarHeight={StatusBar.currentHeight}
      >
        <ToastHolder forceInset={{ top: 'always', bottom: 'never' }}>
          <ToastCard
            message={message}
            emoji={emoji}
            onClose={this.handleClose}
            {...linkProps}
          />
        </ToastHolder>
      </AnimatedToastWrapper>
    );
  }
}

export default Toast;
