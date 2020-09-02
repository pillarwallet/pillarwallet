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
import { Keyboard, Platform, InputAccessoryView } from 'react-native';
import { noop } from 'utils/common';
import PercentsInputAccessory from './PercentsInputAccessory';


type State = {
  isVisible: boolean,
  isActive: boolean,
  handleUsePercentCallback: (number) => any,
};

export const INPUT_ACCESSORY_NATIVE_ID = 'INPUT_ACCESSORY_NATIVE_ID';

class PercentsInputAccessoryHolder extends React.Component<{}, State> {
  static instances: Object[] = [];

  static addAccessory = (handleUsePercentCallback: (number) => any) => {
    const instance = this.instances[this.instances.length - 1];
    if (instance) {
      instance.handleAddAccessory(handleUsePercentCallback);
    }
  }

  static removeAccessory = () => {
    this.instances.forEach(instance => {
      if (instance.isActive()) {
        instance.handleRemoveAccessory();
      }
    });
  }

  state = {
    isVisible: false,
    isActive: false,
    handleUsePercentCallback: noop,
  };

  componentDidMount() {
    Keyboard.addListener('keyboardDidShow', this.handleKeyboardDidShow);
    Keyboard.addListener('keyboardDidHide', this.handleKeyboardDidHide);
  }

  componentWillUnmount() {
    Keyboard.removeListener('keyboardDidShow', this.handleKeyboardDidShow);
    Keyboard.removeListener('keyboardDidHide', this.handleKeyboardDidHide);
    PercentsInputAccessoryHolder.instances.splice(PercentsInputAccessoryHolder.instances.length - 1);
  }

  handleAddAccessory = (handleUsePercentCallback: (number) => any) => {
    this.setState({
      isActive: true,
      handleUsePercentCallback,
    });
  }

  handleRemoveAccessory = () => {
    this.setState({ isActive: false });
  }

  handleKeyboardDidShow = () => {
    this.setState({ isVisible: true });
  }

  isActive = () => {
    return this.state.isActive;
  }

  handleKeyboardDidHide = () => {
    this.setState({ isVisible: false });
  }

  render() {
    const { isVisible, isActive, handleUsePercentCallback } = this.state;
    if (Platform.OS !== 'android') {
      return (
        <InputAccessoryView nativeID={INPUT_ACCESSORY_NATIVE_ID}>
          <PercentsInputAccessory handleUsePercent={handleUsePercentCallback} />
        </InputAccessoryView>
      );
    }
    if (!isVisible || !isActive) {
      return null;
    }
    return (
      <PercentsInputAccessory handleUsePercent={handleUsePercentCallback} />
    );
  }
}

export default PercentsInputAccessoryHolder;
