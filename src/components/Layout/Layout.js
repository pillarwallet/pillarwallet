// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Platform, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-navigation';
import { baseColors } from 'utils/variables';

type ContainerProps = {
  children?: React.Node,
  center?: boolean,
  color?: string,
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
  background-color: ${props => props.color ? props.color : 'transparent'};
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
  height: ${props => props.fullScreen ? '100%' : 'auto'};
  width: ${props => props.fullScreen ? '100%' : 'auto'};
  margin: ${props => (props.regularPadding ? '0 16px' : '0')};
  ${({ center }) => center && `
    align-items: center;
    justify-content: center;
  `}
  ${({ flex }) => flex && `
    flex: ${flex};
  `}
`;

export const ScrollWrapper = styled(KeyboardAwareScrollView)`
  margin: ${props => (props.regularPadding ? '0 16px' : '0')};
  background-color: ${props => props.color ? props.color : 'transparent'};
`;

export const Footer = styled.View`
  flex-direction: column;
  align-items: center;
  width: 100%;
  justify-content: flex-end;
  padding: 20px 16px;
  position: absolute;
  bottom: 0;
`;
