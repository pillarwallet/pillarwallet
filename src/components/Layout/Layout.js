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
import { SafeAreaView } from 'react-navigation';
import { Platform, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { UIColors, spacing } from 'utils/variables';
import { isIphoneX } from 'utils/common';

type ContainerProps = {
  children?: React.Node,
  center?: boolean,
  color?: string,
  style?: Object,
  inset?: Object,
};

type FooterProps = {
  children?: React.Node,
  style?: StyleSheet.Styles,
  column?: boolean,
  backgroundColor?: string,
  keyboardVerticalOffset?: number,
};

type ScrollWrapperProps = {
  children?: React.Node,
  regularPadding?: boolean,
  color?: string,
};

export const Center = styled.View`
  align-items: center;
`;

const ContainerOuter = styled(SafeAreaView)`
  background-color: ${props => (props.color ? props.color : UIColors.defaultBackgroundColor)};
`;

const ContainerInner = styled.View`
  height: 100%;
  align-items: ${props => (props.center ? 'center' : 'stretch')};
  justify-content: ${props => (props.center ? 'center' : 'flex-start')};
`;

export const Container = (props: ContainerProps) => {
  const { inset = {} } = props;


  return (
    <ContainerOuter color={props.color} style={props.style} forceInset={{ top: 'always', ...inset }}>
      <ContainerInner center={props.center}>{props.children}</ContainerInner>
    </ContainerOuter>
  );
};

export const Wrapper = styled.View`
  margin: ${props => (props.regularPadding ? '0 20px' : '0')};
  ${({ center }) => center && 'align-items: center; justify-content: center;'}
  ${({ fullScreen }) => fullScreen && 'height: 100%; width: 100%;'}
  ${({ flex }) => flex && `flex: ${flex};`}
  ${({ horizontal }) => horizontal && 'flex-direction: row;'}
  ${({ zIndex }) => zIndex && `z-index: ${zIndex};`}

`;

export const KAScrollView = styled(KeyboardAwareScrollView)`
  padding: ${props => (props.regularPadding ? '0 20px' : '0')};
  background-color: ${props => (props.color ? props.color : 'transparent')};
  flex: 1;
  height: 100%;
`;

const FooterInner = styled.KeyboardAvoidingView`
  width: 100%;
  margin-top: auto;
  padding: ${Platform.OS === 'ios' ? 0 : `${spacing.rhythm}px`};
  flex-direction: ${props => (props.column ? 'row' : 'column')};
  background-color: ${props => props.backgroundColor ? props.backgroundColor : 'transparent'};
`;

export const ScrollWrapper = (props: ScrollWrapperProps) => {
  return (
    <KAScrollView
      regularPadding={props.regularPadding}
      color={props.color}
      enableOnAndroid
    >
      {props.children}
    </KAScrollView>
  );
};

export const Footer = (props: FooterProps) => {
  return (
    <FooterInner
      enabled
      column={props.column}
      behavior={Platform.OS === 'ios' ? 'position' : null}
      keyboardVerticalOffset={isIphoneX() ? 40 : 20}
      contentContainerStyle={{
        alignItems: 'center',
        position: 'relative',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: spacing.rhythm,
        ...props.style,
      }}
      backgroundColor={props.backgroundColor}
    >
      {props.children}
    </FooterInner>
  );
};
