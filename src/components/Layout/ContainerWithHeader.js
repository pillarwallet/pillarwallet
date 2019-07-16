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
import { StatusBar, View } from 'react-native';
import type { NavigationEventSubscription, NavigationScreenProp } from 'react-navigation';
import { withNavigation, SafeAreaView } from 'react-navigation';
import styled from 'styled-components/native';

import isEqual from 'lodash.isequal';
import HeaderBlock from 'components/HeaderBlock';
import { isColorDark } from 'utils/ui';
import { UIColors } from 'utils/variables';

type Props = {
  navigation: NavigationScreenProp<*>,
  children?: React.Node,
  headerProps?: Object,
  inset?: Object,
};

export const StyledSafeAreaView = styled(SafeAreaView)`
  background-color: ${props => (props.color ? props.color : UIColors.defaultBackgroundColor)};
  flex: 1;
`;

class ContainerWithHeader extends React.Component<Props> {
  focusSubscriptions: NavigationEventSubscription[];

  shouldComponentUpdate(nextProps: Props) {
    const isEq = isEqual(this.props, nextProps);
    return !isEq;
  }

  componentDidMount() {
    const { navigation } = this.props;
    this.focusSubscriptions = [
      navigation.addListener('didFocus', this.setStatusBarStyleForView),
      navigation.addListener('willBlur', this.resetStatusBarStyle),
    ];
  }

  componentWillUnmount() {
    this.resetStatusBarStyle();
    this.focusSubscriptions.forEach(sub => sub.remove());
  }

  setStatusBarStyleForView = () => {
    const { headerProps = {} } = this.props;
    const { color } = headerProps;
    let statusBarStyle = 'dark-content';
    if (color && isColorDark(color)) {
      statusBarStyle = 'light-content';
    }
    StatusBar.setBarStyle(statusBarStyle);
  };

  resetStatusBarStyle = () => {
    StatusBar.setBarStyle('dark-content');
  };

  render() {
    const {
      children,
      headerProps,
      navigation,
      inset,
    } = this.props;

    return (
      <View style={{ flex: 1 }}>
        <HeaderBlock {...headerProps} navigation={navigation} />
        <StyledSafeAreaView forceInset={{ top: 'never', bottom: 'always', ...inset }}>
          {children}
        </StyledSafeAreaView>
      </View>
    );
  }
}

export default withNavigation(ContainerWithHeader);
