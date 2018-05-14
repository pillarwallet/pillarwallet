// @flow
import * as React from 'react';
import { Platform, Dimensions } from 'react-native';
import styled from 'styled-components/native';
import { baseColors } from 'utils/variables';

const deviceHeight = Dimensions.get('window').height;

type ContainerProps = {
  children?: React.Node,
  center?: boolean,
}

export const Center = styled.View`
  align-items: center;
`;

const ContainerOuter = styled.SafeAreaView`
  background-color: ${baseColors.white};
  height: ${() => Platform.OS === 'ios' ? deviceHeight : deviceHeight - 20};
`;

const ContainerInner = styled.View`
  flex: 1;
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

export const Wrapper = styled.ScrollView`
  padding: ${props => (props.padding ? '0 20px' : '0')};
  flex: 1;
`;

export const Footer = styled.View`
  flex-direction: column;
  align-items: center;
  width: 100%;
  justify-content: flex-end;
  padding: 20px 20px 40px;
  position: absolute;
  bottom: 0;
`;
