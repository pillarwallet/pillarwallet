// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes, fontWeights } from 'utils/variables';

type Props = {
  title: string,
  style?: Object,
  noMargin?: boolean,
  center?: boolean,
  maxWidth?: number,
};

const Wrapper = styled.View`
  height: 30px;
  margin: ${props => props.noMargin ? '0' : '20px 0'};
  width: ${props => props.maxWidth ? props.maxWidth : 'auto'};
  align-self: ${props => props.center ? 'center' : 'flex-start'};
`;

const Text = styled.Text`
  font-size: ${fontSizes.large};
  font-weight: ${fontWeights.bold};
  text-align: ${props => props.center ? 'center' : 'left'}
  width: ${props => props.center ? '100%' : 'auto'};
`;

const BlueDot = styled.Text`
  color: ${baseColors.electricBlue};
  font-size: ${fontSizes.extraExtraSmall};
  // TODO: replace or remove font Symbol, it causes issues on Android
  // font-family: Symbol;
  background-color: ${baseColors.brightSkyBlue};
  height: 4px;
  width: 4px;
  align-self: flex-end;
  position: relative;
  top: -9px;
  left: 6px;
`;


const Title = (props: Props) => {
  return (
    <Wrapper noMargin={props.noMargin} style={props.style} center={props.center} maxWidth={props.maxWidth}>
      <Text center={props.center}>{props.title}</Text>
      <BlueDot />
    </Wrapper>
  );
};

export default Title;
