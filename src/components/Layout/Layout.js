// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-navigation';
import { Platform, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { UIColors, spacing } from 'utils/variables';

type ContainerProps = {
  children?: React.Node,
  center?: boolean,
  color?: string,
  style?: Object,
};

type FooterProps = {
  children?: React.Node,
  style?: StyleSheet.Styles,
  column?: boolean,
  backgroundColor?: string,
  keyboardVerticalOffset?: number,
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
  return (
    <ContainerOuter color={props.color} style={props.style} forceInset={{ top: 'always' }}>
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
`;

export const ScrollWrapper = styled(KeyboardAwareScrollView)`
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

export const Footer = (props: FooterProps) => {
  return (
    <FooterInner
      enabled
      column={props.column}
      behavior={Platform.OS === 'ios' ? 'position' : null}
      keyboardVerticalOffset={props.keyboardVerticalOffset || 20}
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
