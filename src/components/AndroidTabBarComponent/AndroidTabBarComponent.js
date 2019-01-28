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
