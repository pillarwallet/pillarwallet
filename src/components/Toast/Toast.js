
// @flow
import * as React from 'react';
import { Animated } from 'react-native';
import merge from 'lodash.merge';
import styled from 'styled-components/native';
import IconButton from 'components/IconButton';
import Icon from 'components/Icon';
import { baseColors, fontSizes } from 'utils/variables';
import { BoldText, BaseText } from 'components/Typography';
import { isIphoneX } from 'utils/common';

type ToastOptions = {
  autoClose?: boolean,
  type: string,
  message: string,
  title: string,
}

type State = {
  isVisible: boolean,
  animSlide: Object,
  toastOptions: ToastOptions,
}

const toastInitialOptions = {
  autoClose: true,
  type: 'info',
  message: '',
  title: '',
};


const typeColors = {
  warning: baseColors.vividOrange,
  info: baseColors.brightBlue,
  success: baseColors.limeGreen,
};

const typeIcons = {
  warning: 'warning-circle',
  info: 'info-circle',
  success: 'tick-circle',
};

const ToastHolder = styled.View`
  display: flex;
  flex-direction: row;
`;

const TextHolder = styled.View`
  flex: 9;
`;

const IconHolder = styled.View`
  display: flex;
  flex: 2;
  align-items: center;
  justify-content: center;
`;

export default class Toast extends React.Component<*, State> {
  timeout: TimeoutID

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

  componentWillUnmount() {
    clearTimeout(this.timeout);
    Toast.toastInstances.splice(Toast.toastInstances.length - 1);
  }

  handleOpen = (toastOptions: ToastOptions) => {
    if (this.state.isVisible) return;
    const { options } = merge(
      {},
      { options: this.state.toastOptions },
      { options: toastOptions },
    );

    this.setState({
      isVisible: true,
      toastOptions: options,
    });

    Animated.timing(
      this.state.animSlide,
      {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      })
      .start(() => {
        if (!this.state.toastOptions.autoClose) return;
        this.timeout = setTimeout(() => {
          this.handleClose();
          clearTimeout(this.timeout);
        }, 2000);
      });
  }

  handleClose = () => {
    this.setState({ isVisible: false });
    Animated.timing(
      this.state.animSlide,
      {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => this.setState({ toastOptions: toastInitialOptions }));
  }

  render() {
    const { toastOptions } = this.state;
    const animation = this.state.animSlide.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [-110, -10, 0],
    });
    return (
      <Animated.View
        style={{
          transform: [{ translateY: animation }],
          opacity: +!!this.state.toastOptions.message,
          height: 110,
          backgroundColor: '#fff',
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          paddingTop: isIphoneX() ? 40 : 20,
          paddingBottom: 10,
          borderLeftWidth: 8,
          borderStyle: 'solid',
          borderColor: typeColors[toastOptions.type],
          shadowColor: '#333',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 9,
          zIndex: 1000,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ToastHolder>
          <IconHolder>
            <Icon
              name={typeIcons[toastOptions.type]}
              style={{
                color: typeColors[toastOptions.type],
                fontSize: fontSizes.extraLarge,
              }}
            />
          </IconHolder>
          <TextHolder>
            <BoldText>{toastOptions.title}</BoldText>
            <BaseText style={{ marginTop: 5, marginBottom: 10, color: baseColors.darkGray }}>
              {toastOptions.message}
            </BaseText>
          </TextHolder>
          <IconButton
            onPress={this.handleClose}
            icon="close"
            color={baseColors.mediumGray}
            style={{
              flex: 2,
              justifyContent: 'center',
              alignItems: 'center',
              display: 'flex',
            }}
            iconStyle={{
              borderWidth: 2,
              borderRadius: 16,
              paddingTop: 7,
              borderColor: baseColors.mediumGray,
              height: 32,
              width: 32,
              textAlign: 'center',
            }}
          />
        </ToastHolder>
      </Animated.View>
    );
  }
}
