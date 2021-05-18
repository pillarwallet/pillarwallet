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
import { Platform, StatusBar, View, Dimensions, ScrollView, Animated } from 'react-native';
import type { NavigationEventSubscription, NavigationScreenProp } from 'react-navigation';
import { withNavigation } from 'react-navigation';
import styled, { withTheme } from 'styled-components/native';
import SafeAreaView from 'react-native-safe-area-view';
import isEqual from 'lodash.isequal';
import isEmpty from 'lodash.isempty';

import HeaderBlock from 'components/HeaderBlock';
import { isColorDark } from 'utils/ui';
import { isIphoneX } from 'utils/common';
import { getThemeColors, getThemeType } from 'utils/themes';
import type { Theme } from 'models/Theme';

import { DARK_THEME, LIGHT_CONTENT, DARK_CONTENT, LIGHT_THEME } from 'constants/appSettingsConstants';

// types
import type { StatusBarStyle, KeyboardShouldPersistTaps } from 'utils/types/react-native';

import { ScrollWrapper } from './Layout';

type Props = {
  navigation: NavigationScreenProp<*>,
  children?: React.Node,
  headerProps?: Object,
  inset?: Object,
  backgroundColor?: string,
  footer?: React.Node,
  minAvoidHeight?: number,
  theme: Theme,
  putContentInScrollView?: boolean,
  shouldFooterAvoidKeyboard?: boolean,
  tab?: boolean,
  statusbarColor?: {
    darkTheme?: StatusBarStyle,
    lightTheme?: StatusBarStyle,
  },
  keyboardShouldPersistTaps?: KeyboardShouldPersistTaps,
  footerContainerStyle?: Object,
  footerContainerInset?: Object,
  onScroll?: Function,
};

type State = {
  scrollY: Animated.Value,
};

export const StyledSafeAreaView = styled(SafeAreaView)`
  background-color: ${({ color, theme }) => color || theme.colors.basic070};
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

class ContainerWithHeader extends React.Component<Props, State> {
  focusSubscription: NavigationEventSubscription;

  state = {
    scrollY: new Animated.Value(0),
  };

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    return !isEq;
  }

  componentDidMount() {
    const { navigation } = this.props;
    this.focusSubscription = navigation.addListener('didFocus', this.setStatusBarStyleForView);
  }

  componentWillUnmount() {
    if (this.focusSubscription) this.focusSubscription.remove();
  }

  getStatusBarColor = (themeType): StatusBarStyle => {
    const { statusbarColor = {} } = this.props;
    if (themeType === DARK_THEME) {
      if (statusbarColor[DARK_THEME]) return statusbarColor[DARK_THEME];
      return LIGHT_CONTENT;
    }
    return statusbarColor[LIGHT_THEME] || DARK_CONTENT;
  };

  setStatusBarStyleForView = () => {
    const {
      headerProps = {},
      theme,
      backgroundColor,
      statusbarColor,
    } = this.props;
    const { transparent, floating } = headerProps;
    const themeType = getThemeType(theme);
    let statusBarStyle = this.getStatusBarColor(themeType);

    if ((!!transparent || !!floating) && backgroundColor && !statusbarColor) {
      statusBarStyle = isColorDark(backgroundColor)
        ? this.getStatusBarColor(DARK_THEME)
        : this.getStatusBarColor(LIGHT_THEME);
    }
    StatusBar.setBarStyle(statusBarStyle);
  };

  renderContent = (shouldRenderFooter, shouldRenderChildrenInScrollView) => {
    const {
      children,
      footer,
      keyboardShouldPersistTaps = 'never',
      shouldFooterAvoidKeyboard = true,
      onScroll,
    } = this.props;

    if (!shouldRenderFooter) {
      if (!shouldRenderChildrenInScrollView) {
        if (typeof children === 'function') {
          return children(this.onScroll());
        }
        return children;
      }

      return (
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {children}
        </ScrollView>
      );
    }
    const content = (
      <>
        <ContentWrapper>
          {children}
        </ContentWrapper>
        {footer}
      </>
    );
    if (shouldFooterAvoidKeyboard) {
      return (
        <ScrollWrapper
          style={{ flex: 1 }}
          contentContainerStyle={{ justifyContent: 'space-between', flexGrow: 1 }}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          onScroll={onScroll}
        >
          {content}
        </ScrollWrapper>
      );
    }
    return content;
  };

  onScroll = () => {
    return Animated.event(
      [{ nativeEvent: { contentOffset: { y: this.state.scrollY } } }],
      { useNativeDriver: false },
    );
  }

  render() {
    const {
      headerProps = {},
      navigation,
      inset,
      backgroundColor,
      footer,
      minAvoidHeight = 600,
      theme,
      putContentInScrollView,
      shouldFooterAvoidKeyboard = true,
      footerContainerStyle,
      footerContainerInset,
    } = this.props;

    const colors = getThemeColors(theme);

    const topInset = headerProps.floating ? 'always' : 'never'; // eslint-disable-line i18next/no-literal-string
    const bottomInset = footer ? 'never' : 'always'; // eslint-disable-line i18next/no-literal-string
    const androidStatusBarSpacing = headerProps.floating ? StatusBar.currentHeight : 0;
    const isScreenBigEnoughToAvoidKeyboard = screenHeight > minAvoidHeight;
    const shouldRenderKbAvoidingFooter = isScreenBigEnoughToAvoidKeyboard && shouldFooterAvoidKeyboard;

    return (
      <View style={{ flex: 1 }}>
        {!isEmpty(headerProps) &&
          // $FlowFixMe: flow update to 0.122
          <HeaderBlock
            {...headerProps}
            navigation={navigation}
            noPaddingTop
          />}
        <StyledSafeAreaView
          forceInset={{ top: topInset, bottom: bottomInset, ...inset }}
          androidStatusbarHeight={androidStatusBarSpacing}
          color={backgroundColor}
        >
          {this.renderContent(!shouldRenderKbAvoidingFooter && footer, putContentInScrollView)}
        </StyledSafeAreaView>
        {!!footer && shouldRenderKbAvoidingFooter &&
        <Footer
          enabled={Platform.OS === 'ios'}
          behavior={Platform.OS === 'ios' ? 'padding' : null}
          keyboardVerticalOffset={isIphoneX() ? -40 : 0}
        >
          <SafeAreaView
            forceInset={{
              top: 'never', bottom: 'always', ...inset, ...footerContainerInset,
            }}
            style={{
              backgroundColor: backgroundColor || colors.basic070,
              width: '100%',
              flexWrap: 'wrap',
              ...footerContainerStyle,
            }}
          >
            {footer}
          </SafeAreaView>
        </Footer>}
      </View>
    );
  }
}

export default withTheme(withNavigation(ContainerWithHeader));
