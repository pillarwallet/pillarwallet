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
import { Platform, StatusBar, View } from 'react-native';
import type { NavigationEventSubscription, NavigationScreenProp } from 'react-navigation';
import { withNavigation, SafeAreaView } from 'react-navigation';
import styled from 'styled-components/native';

import isEqual from 'lodash.isequal';
import HeaderBlock from 'components/HeaderBlock';
import { isColorDark } from 'utils/ui';
import { UIColors } from 'utils/variables';
import { isIphoneX } from 'utils/common';

type Props = {
  navigation: NavigationScreenProp<*>,
  children?: React.Node,
  keyboardAvoidFooter?: React.Node,
  headerProps?: Object,
  inset?: Object,
  backgroundColor?: string,
};

const StyledSafeAreaView = styled(SafeAreaView)`
  background-color: ${props => (props.color ? props.color : UIColors.defaultBackgroundColor)};
  flex: 1;
  ${props => props.androidStatusbarHeight ? `padding-top: ${props.androidStatusbarHeight}px` : ''};
`;

const Footer = styled.KeyboardAvoidingView`
  width: 100%;
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
    const { backgroundColor } = this.props;
    let statusBarStyle = 'dark-content';
    if (backgroundColor && isColorDark(backgroundColor)) {
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
      headerProps = {},
      navigation,
      inset,
      backgroundColor,
      keyboardAvoidFooter,
    } = this.props;

    const topInset = headerProps.floating ? 'always' : 'never';
    const bottomInset = keyboardAvoidFooter ? 'never' : 'always';
    const androidStatusBarSpacing = headerProps.floating ? StatusBar.currentHeight : 0;

    return (
      <View style={{ flex: 1 }}>
        <HeaderBlock {...headerProps} navigation={navigation} />
        <StyledSafeAreaView
          forceInset={{ top: topInset, bottom: bottomInset, ...inset }}
          androidStatusbarHeight={androidStatusBarSpacing}
          color={backgroundColor}
        >
          {children}
        </StyledSafeAreaView>
        {!!keyboardAvoidFooter &&
        <Footer
          enabled={Platform.OS === 'ios'}
          behavior={Platform.OS === 'ios' ? 'padding' : null}
          keyboardVerticalOffset={isIphoneX() ? -40 : 0}
        >
          <SafeAreaView
            forceInset={{ top: 'never', bottom: 'always', ...inset }}
            style={{ backgroundColor, width: '100%', flexWrap: 'wrap' }}
          >
            {keyboardAvoidFooter}
          </SafeAreaView>
        </Footer>}
      </View>
    );
  }
}

export default withNavigation(ContainerWithHeader);
