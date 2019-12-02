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
import { Platform, StatusBar, View, Dimensions } from 'react-native';
import type { NavigationEventSubscription, NavigationScreenProp } from 'react-navigation';
import { withNavigation, SafeAreaView } from 'react-navigation';
import styled, { withTheme } from 'styled-components/native';
import isEqual from 'lodash.isequal';

import HeaderBlock from 'components/HeaderBlock';
import { isColorDark } from 'utils/ui';
import { isIphoneX } from 'utils/common';
import { getThemeColors, themedColors } from 'utils/themes';
import type { Theme } from 'models/Theme';

import { ScrollWrapper } from './Layout';

type Props = {
  navigation: NavigationScreenProp<*>,
  children?: React.Node,
  headerProps?: Object,
  inset?: Object,
  backgroundColor?: string,
  keyboardAvoidFooter?: React.Node,
  minAvoidHeight?: number,
  theme: Theme,
};

export const StyledSafeAreaView = styled(SafeAreaView)`
  background-color: ${props => (props.color ? props.color : themedColors.surface)};
  flex: 1;
  ${props => props.androidStatusbarHeight ? `padding-top: ${props.androidStatusbarHeight}px` : ''};
`;

const ContentWrapper = styled.View`
  flex-grow: 1;
  flex: 1;
`;

const Footer = styled.KeyboardAvoidingView`
  width: 100%;
`;

const { height: screenHeight } = Dimensions.get('window');

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

  renderContent = (isShortScreenWithFooter) => {
    const { children, keyboardAvoidFooter } = this.props;
    if (!isShortScreenWithFooter) return children;
    return (
      <ScrollWrapper style={{ flex: 1 }} contentContainerStyle={{ justifyContent: 'space-between', flexGrow: 1 }}>
        <ContentWrapper>
          {children}
        </ContentWrapper>
        {keyboardAvoidFooter}
      </ScrollWrapper>
    );
  };

  render() {
    const {
      headerProps = {},
      navigation,
      inset,
      backgroundColor,
      keyboardAvoidFooter,
      minAvoidHeight = 600,
      theme,
    } = this.props;
    const colors = getThemeColors(theme);

    const topInset = headerProps.floating ? 'always' : 'never';
    const bottomInset = keyboardAvoidFooter ? 'never' : 'always';
    const androidStatusBarSpacing = headerProps.floating ? StatusBar.currentHeight : 0;
    const shouldFooterAvoidKeyboard = screenHeight > minAvoidHeight; // if not checked on smaller screens
    // keyboard and footer covers entire content;

    return (
      <View style={{ flex: 1 }}>
        <HeaderBlock {...headerProps} navigation={navigation} />
        <StyledSafeAreaView
          forceInset={{ top: topInset, bottom: bottomInset, ...inset }}
          androidStatusbarHeight={androidStatusBarSpacing}
          color={backgroundColor}
        >
          {this.renderContent(!shouldFooterAvoidKeyboard && keyboardAvoidFooter)}
        </StyledSafeAreaView>
        {!!keyboardAvoidFooter && shouldFooterAvoidKeyboard &&
        <Footer
          enabled={Platform.OS === 'ios'}
          behavior={Platform.OS === 'ios' ? 'padding' : null}
          keyboardVerticalOffset={isIphoneX() ? -40 : 0}
        >
          <SafeAreaView
            forceInset={{ top: 'never', bottom: 'always', ...inset }}
            style={{
              backgroundColor: backgroundColor || colors.surface,
              width: '100%',
              flexWrap: 'wrap',
            }}
          >
            {keyboardAvoidFooter}
          </SafeAreaView>
        </Footer>}
      </View>
    );
  }
}

export default withTheme(withNavigation(ContainerWithHeader));
