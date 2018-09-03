// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Animated } from 'react-native';
import merge from 'lodash.merge';
import IconButton from 'components/IconButton';
import Icon from 'components/Icon';
import { baseColors, fontSizes, spacing } from 'utils/variables';
import { BoldText, BaseText } from 'components/Typography';
import { isIphoneX } from 'utils/common';

type ToastOptions = {
  autoClose?: boolean,
  type: string,
  message: string,
  title: string,
};

type State = {
  isVisible: boolean,
  animSlide: Object,
  toastOptions: ToastOptions,
};

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

const ToastWrapper = styled.View`
  opacity: ${props => props.opacity};
  height: 320px;
  margin-top: -220px;
  background-color: ${baseColors.white};
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  padding-top: ${isIphoneX() ? '40px' : '20px'};
  padding-bottom: ${spacing.rhythm / 2}px;
  border-left-width: ${spacing.rhythm / 2}px;
  border-style: solid;
  border-color: ${props => props.borderColor};
  shadow-color: #333;
  shadow-offset: 0 2px;
  shadow-opacity: 0.25;
  shadow-radius: 10;
  elevation: 9;
  z-index: 1000;
  justify-content: flex-end;
  align-items: flex-end;
`;

const AnimatedToastWrapper = Animated.createAnimatedComponent(ToastWrapper);

const TextHolder = styled.View`
  flex: 9;
`;

const IconHolder = styled.View`
  display: flex;
  flex: 2;
  align-items: center;
  justify-content: center;
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
      </AnimatedToastWrapper>
    );
  }
}
