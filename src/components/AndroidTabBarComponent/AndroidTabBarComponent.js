// @flow
import React from 'react';
import { Platform, Keyboard } from 'react-native';
import { BottomTabBar } from 'react-navigation-tabs';

type State = {
  visible: boolean,
};

export default class TabBarComponent extends React.Component<{}, State> {
  keyboardEventListeners: any[] = [];

  state = {
    visible: true,
  };

  componentDidMount() {
    if (Platform.OS === 'android') {
      this.keyboardEventListeners = [
        Keyboard.addListener('keyboardDidShow', this.visible(false)),
        Keyboard.addListener('keyboardDidHide', this.visible(true)),
      ];
    }
  }

  componentWillUnmount() {
    this.keyboardEventListeners.forEach((eventListener) => eventListener.remove());
  }

  visible = (isVisible: boolean) => () => this.setState({ visible: isVisible });

  render() {
    if (!this.state.visible) {
      return null;
    }
    return (
      <BottomTabBar {...this.props} />
    );
  }
}
