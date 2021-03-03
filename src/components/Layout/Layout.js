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
import styled from 'styled-components/native';
import SafeAreaView from 'react-native-safe-area-view';
import { Platform, StatusBar } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { spacing } from 'utils/variables';
import { isIphoneX } from 'utils/common';

// types
import type { ViewStyleProp, KeyboardShouldPersistTaps } from 'utils/types/react-native';
import type { Theme } from 'models/Theme';

type ContainerProps = {
  children?: React.Node,
  center?: boolean,
  color?: string,
  style?: Object,
  inset?: Object,
  onLayout?: Function,
  innerStyle?: Object,
  defaultTheme?: Theme,
  theme?: Theme, // TODO: remove '?' after cleanup (Screens that are not used are not wrapped with ThemeProvider)
};

type FooterProps = {
  children?: React.Node,
  style?: ViewStyleProp,
  column?: boolean,
  backgroundColor?: string,
  keyboardVerticalOffset?: number,
};

type ScrollWrapperProps = {
  children?: React.Node,
  regularPadding?: boolean,
  color?: string,
  disableAutomaticScroll?: boolean,
  onKeyboardWillShow?: Function,
  innerRef?: Object,
  contentContainerStyle?: Object,
  keyboardShouldPersistTaps?: KeyboardShouldPersistTaps,
  onScroll?: Function,
  stickyHeaderIndices?: ?(number[]),
  scrollEnabled?: boolean,
  refreshControl?: React.Node,
  disableOnAndroid?: boolean,
  scrollEventThrottle?: number,
  onContentSizeChange?: Function,
};

export const Center = styled.View`
  align-items: center;
`;

// Workaround: styled-components 3.x do not pass `theme` prop to FC, but do pass
// it to class components.
// eslint-disable-next-line react/prefer-stateless-function
class SafeAreaViewClassWrapper extends React.Component<{}> {
  render() {
    return <SafeAreaView {...this.props} />;
  }
}

export const ContainerOuter = styled(SafeAreaViewClassWrapper)`
  background-color: ${({ color, theme }) => color || theme.colors.basic070};
  ${props => props.androidStatusbarHeight ? `padding-top: ${props.androidStatusbarHeight}px` : ''};
`;

export const ContainerInner = styled.View`
  height: 100%;
  align-items: ${props => (props.center ? 'center' : 'stretch')};
  justify-content: ${props => (props.center ? 'center' : 'flex-start')};
`;

export const Container = (props: ContainerProps) => {
  const {
    inset = {},
    color,
    style,
    innerStyle,
    center,
    onLayout,
    children,
    defaultTheme,
    theme,
  } = props;

  return (
    <ContainerOuter
      color={color}
      style={style}
      forceInset={{ top: 'always', ...inset }}
      androidStatusbarHeight={StatusBar.currentHeight}
      theme={theme || defaultTheme}
    >
      <ContainerInner
        center={center}
        onLayout={onLayout}
        style={innerStyle}
      >
        {children}
      </ContainerInner>
    </ContainerOuter>
  );
};

export const Wrapper = styled.View`
  margin: ${props => (props.regularPadding ? `0 ${spacing.layoutSides}px` : '0')};
  ${({ center }) => center && 'align-items: center; justify-content: center;'}
  ${({ fullScreen }) => fullScreen && 'height: 100%; width: 100%;'}
  ${({ flex }) => flex && `flex: ${flex};`}
  ${({ horizontal }) => horizontal && 'flex-direction: row;'}
  ${({ zIndex }) => zIndex && `z-index: ${zIndex};`}
`;

const FooterInner = styled.KeyboardAvoidingView`
  width: 100%;
  margin-top: auto;
  padding: ${Platform.OS === 'ios' ? 0 : `${spacing.layoutSides}px`};
  flex-direction: ${props => (props.column ? 'row' : 'column')};
  background-color: ${props => props.backgroundColor ? props.backgroundColor : 'transparent'};
`;

export const ScrollWrapper = (props: ScrollWrapperProps) => {
  const {
    regularPadding,
    color,
    disableAutomaticScroll,
    innerRef,
    onKeyboardWillShow,
    contentContainerStyle,
    children,
    keyboardShouldPersistTaps,
    onScroll,
    stickyHeaderIndices,
    scrollEnabled,
    refreshControl,
    disableOnAndroid,
    scrollEventThrottle,
    onContentSizeChange,
  } = props;

  return (
    <KeyboardAwareScrollView
      enableOnAndroid={!disableOnAndroid}
      enableAutomaticScroll={!disableAutomaticScroll}
      innerRef={innerRef}
      onKeyboardWillShow={onKeyboardWillShow}
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      onScroll={onScroll}
      stickyHeaderIndices={Platform.OS === 'ios' ? stickyHeaderIndices : null}
      extraHeight={0}
      extraScrollHeight={0}
      scrollEnabled={scrollEnabled}
      refreshControl={refreshControl}
      scrollEventThrottle={scrollEventThrottle}
      onContentSizeChange={onContentSizeChange}
      style={{
        paddingHorizontal: regularPadding ? spacing.layoutSides : 0,
        backgroundColor: color || 'transparent',
        flex: 1,
        height: '100%',
      }}
    >
      {children}
    </KeyboardAwareScrollView>
  );
};

export const Footer = (props: FooterProps) => {
  return (
    <FooterInner
      enabled
      column={props.column}
      behavior={Platform.OS === 'ios' ? 'position' : null}
      keyboardVerticalOffset={isIphoneX() ? 40 : 20}
      contentContainerStyle={[
        {
          alignItems: 'center',
          position: 'relative',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: spacing.layoutSides,
        },
        props.style,
      ]}
      backgroundColor={props.backgroundColor}
    >
      {props.children}
    </FooterInner>
  );
};

type SpacingProps = {|
  h?: ?number;
  w?: ?number;
  flex?: ?number;
|};

export const Spacing: React.ComponentType<SpacingProps> = styled.View`
  height: ${({ h }) => h || 0}px;
  width: ${({ w }) => w || 0}px;
  ${({ flex }) => (flex != null ? `flex: ${flex};` : undefined)}
`;
