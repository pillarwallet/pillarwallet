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
import { Platform } from 'react-native';
import { BottomTabBar } from 'react-navigation-tabs';
import AndroidTabBarComponent from 'components/AndroidTabBarComponent';
import { withTheme } from 'styled-components';
import { getThemeColors } from 'utils/themes';
import type { Theme } from 'models/Theme';

type Props = {
  theme: Theme,
  style?: Object,
};

class CustomTabBarComponent extends React.Component<Props> {
  /**
   * if the return is false or undefined then the default button component is rendered
   * otherwise let's pass hidden tab item
   **
   * keep method brackets version to support more flags
   * retrieve feature flag state from props
   * add `or` ternary for more feature flags
   **
   * const { screenProps: { someFeatureEnabled } } = this.props;
   * const hideTabButton = route.routeName === SOME_ROUTE_NAME && !someFeatureEnabled;
   * return hideTabButton && HiddenTabItemView
   */
  getButtonComponent = (route: any) => { // eslint-disable-line
    // do not return anything if tab doesn't need to be excluded
  };

  render() {
    const { theme, style = {} } = this.props;
    const colors = getThemeColors(theme);
    const customStyle = { ...style, backgroundColor: colors.card };

    return (
      Platform.select({
        ios: <BottomTabBar
          {...this.props}
          style={customStyle}
          getButtonComponent={({ route }) => this.getButtonComponent(route)}
        />,
        android: <AndroidTabBarComponent
          {...this.props}
          style={customStyle}
          getButtonComponent={({ route }) => this.getButtonComponent(route)}
        />,
      })
    );
  }
}

export default withTheme(CustomTabBarComponent);
