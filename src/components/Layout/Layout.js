// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Platform, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-navigation';
import { baseColors, spacing } from 'utils/variables';

type ContainerProps = {
  children?: React.Node,
  center?: boolean,
  color?: string,
}

type FooterProps = {
  children?: React.Node,
  column?: boolean,
}

export const Center = styled.View`
  align-items: center;
`;


const ContainerOuter = styled(Platform.OS === 'ios' ? SafeAreaView : View)`
  background-color: ${props => props.color ? props.color : baseColors.white};
`;

const ContainerInner = styled.View`
  height: 100%;
  align-items: ${props => (props.center ? 'center' : 'stretch')};
  justify-content: ${props => (props.center ? 'center' : 'flex-start')};
`;

export const Container = (props: ContainerProps) => {
  return (
    <ContainerOuter color={props.color} forceInset={{ top: 'always' }}>
      <ContainerInner center={props.center}>
        {props.children}
      </ContainerInner>
    </ContainerOuter>
  );
};

export const Wrapper = styled.View`
  margin: ${props => (props.regularPadding ? '0 20px' : '0')};
  ${({ center }) => center && `
    align-items: center;
    justify-content: center;
  `}
  ${({ fullScreen }) => fullScreen && `
    height: 100%;
    width: 100%;
  `}
  ${({ flex }) => flex && `
    flex: ${flex};
  `}
`;

export const ScrollWrapper = styled(KeyboardAwareScrollView)`
  margin: ${props => (props.regularPadding ? '0 20px' : '0')};
  background-color: ${props => props.color ? props.color : 'transparent'};
`;


const FooterInner = styled.KeyboardAvoidingView`
  width: 100%;
  margin-top: auto;
  padding: ${Platform.OS === 'ios' ? 0 : `${spacing.rhythm}px`};
  flex-direction: ${props => props.column ? 'row' : 'column'};
`;

export const Footer = (props: FooterProps) => {
  return (
    <FooterInner
      enabled
      column={props.column}
      behavior={Platform.OS === 'ios' ? 'position' : null}
      keyboardVerticalOffset={40}
      contentContainerStyle={{
        alignItems: 'center',
        position: 'relative',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: spacing.rhythm,
      }}
    >
      {props.children}
    </FooterInner>
  );
};

