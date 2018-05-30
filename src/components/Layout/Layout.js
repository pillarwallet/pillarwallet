// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { baseColors } from 'utils/variables';

type ContainerProps = {
  children?: React.Node,
  center?: boolean,
}

export const Center = styled.View`
  align-items: center;
`;

const ContainerOuter = styled.SafeAreaView`
  background-color: ${baseColors.white};
`;

const ContainerInner = styled.View`
  height: 100%;
  align-items: ${props => (props.center ? 'center' : 'stretch')};
  justify-content: ${props => (props.center ? 'center' : 'flex-start')};
`;

export const Container = (props: ContainerProps) => {
  return (
    <ContainerOuter>
      <ContainerInner center={props.center}>
        {props.children}
      </ContainerInner>
    </ContainerOuter>
  );
};

export const Wrapper = styled.View`
  padding: ${props => (props.padding ? '0 20px' : '0')};
  flex: 1;
`;

export const ScrollWrapper = styled(KeyboardAwareScrollView)`
  padding: ${props => (props.padding ? '0 20px' : '0')};
  flex: 1;
`;

export const Footer = styled.View`
  flex-direction: column;
  align-items: center;
  width: 100%;
  justify-content: flex-end;
  padding: 20px;
  position: absolute;
  bottom: 0;
`;
