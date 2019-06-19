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
import { Platform, View } from 'react-native';
import { BottomTabBar } from 'react-navigation-tabs';
import AndroidTabBarComponent from 'components/AndroidTabBarComponent';

const HiddenTabItemView = () => {
  return <View style={{ display: 'none' }} />;
};

type Props = {
  screenProps: {
    smartWalletFeatureEnabled: boolean,
  }
};

export default class CustomTabBarComponent extends React.Component<Props> {
  /**
   * if the return is false or undefined then the default button component is rendered
   * otherwise let's pass hidden tab item
   **
   *  keep method brackets version to support more flags
   */
  getButtonComponent = (route: any) => { // eslint-disable-line
    const hideTabButton = false;
    // const { screenProps: { smartWalletFeatureEnabled } } = this.props;
    // add `or` ternary for more feature flags
    // hideTabButton = route.routeName === SMART_WALLET_TAB && !smartWalletFeatureEnabled;
    return hideTabButton && HiddenTabItemView;
  };

  render() {
    return Platform.select({
      ios: <BottomTabBar
        {...this.props}
        getButtonComponent={({ route }) => this.getButtonComponent(route)}
      />,
      android: <AndroidTabBarComponent
        {...this.props}
        getButtonComponent={({ route }) => this.getButtonComponent(route)}
      />,
    });
  }
}
