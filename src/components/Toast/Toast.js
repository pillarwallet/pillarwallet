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
import { View, Animated, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import merge from 'lodash.merge';
import IconButton from 'components/IconButton';
import Icon from 'components/Icon';
import { baseColors, fontSizes, spacing, fontStyles } from 'utils/variables';
import { MediumText, BaseText } from 'components/Typography';

type ToastOptions = {
  autoClose?: boolean,
  onPress?: () => void,
  type: string,
  message: string,
  title?: ?string,
};

type State = {
  isVisible: boolean,
  animSlide: Object,
  toastOptions: ToastOptions,
};

const toastInitialOptions: ToastOptions = {
  autoClose: true,
  type: 'info',
  message: '',
};

const typeColors = {
  warning: baseColors.negative,
  info: baseColors.primary,
  success: baseColors.positive,
};

const typeIcons = {
  warning: 'warning-circle',
  info: 'info-circle',
  success: 'tick-circle',
};

const ToastHolder = styled(SafeAreaView)`
  width: 100%;
`;

const ContentWrapper = styled.View`
  width: 100%;
  min-height: 58px;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  padding-top: 8px;
  padding-bottom: ${spacing.rhythm / 2}px;
  margin-top: ${props => props.androidStatusbarHeight || 0}px;
`;

const ToastWrapper = styled.View`
  opacity: ${props => props.opacity};
  background-color: ${baseColors.white};
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  border-left-width: ${spacing.rhythm / 2}px;
  border-style: solid;
  border-color: ${props => props.borderColor};
  shadow-color: #333;
  shadow-offset: 0 2px;
  shadow-opacity: 0.25;
  shadow-radius: 10;
  elevation: 9;
  z-index: 1000;
  justify-content: center;
  align-items: center;
`;

const AnimatedToastWrapper = Animated.createAnimatedComponent(ToastWrapper);

const TextHolder = styled.View`
  flex: 9;
  align-self: stretch;
  justify-content: center;
`;

const IconHolder = styled.View`
  display: flex;
  flex: 2;
  align-self: stretch;
  align-items: center;
  justify-content: center;
  padding-top: 2px;
`;

const ToastTitle = styled(MediumText)`
  ${fontStyles.regular};
  color: ${baseColors.text};
  margin-bottom: 2px;
`;

const ToastBody = styled(BaseText)`
  ${fontStyles.regular};
  color: ${baseColors.secondaryText};
`;

export default class Toast extends React.Component<{}, State> {
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

  renderText() {
    const { toastOptions: { title, message } } = this.state;

    return (
      <View>
        {!!title && <ToastTitle>{title}</ToastTitle>}
        <ToastBody>{message}</ToastBody>
      </View>
    );
  }

  renderTextWrapper() {
    const { toastOptions: { onPress } } = this.state;

    if (onPress) {
      return (
        <TextHolder>
          <TouchableOpacity onPress={this.handlePress}>
            {this.renderText()}
          </TouchableOpacity>
        </TextHolder>
      );
    }

    return (
      <TextHolder>{this.renderText()}</TextHolder>
    );
  }

  render() {
    const { toastOptions } = this.state;
    const animation = this.state.animSlide.interpolate({
      inputRange: [0, 1],
      outputRange: [-260, 0],
    });
    return (
      <AnimatedToastWrapper
        style={{
          transform: [{ translateY: animation }],
        }}
        opacity={+!!this.state.toastOptions.message}
        borderColor={typeColors[toastOptions.type]}
      >
        <ToastHolder forceInset={{ top: 'always', bottom: 'never' }}>
          <ContentWrapper androidStatusbarHeight={StatusBar.currentHeight}>
            <IconHolder>
              <Icon
                name={typeIcons[toastOptions.type]}
                style={{
                  color: typeColors[toastOptions.type],
                  fontSize: fontSizes.large,
                }}
              />
            </IconHolder>
            {this.renderTextWrapper()}
            <IconButton
              onPress={this.handleClose}
              icon="close"
              color={baseColors.secondaryAccent}
              style={{
                flex: 2,
                justifyContent: 'center',
                alignItems: 'center',
                alignSelf: 'stretch',
                display: 'flex',
              }}
              iconStyle={{
                borderWidth: 0,
                width: 32,
                textAlign: 'center',
                alignSelf: 'center',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            />
          </ContentWrapper>
        </ToastHolder>
      </AnimatedToastWrapper>
    );
  }
}
