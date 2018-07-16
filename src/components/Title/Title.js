// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes, fontWeights } from 'utils/variables';

type Props = {
  title?: string,
  style?: Object,
  noMargin?: boolean,
  center?: boolean,
  maxWidth?: number,
};

const Wrapper = styled.View`
  margin: ${props => props.noMargin ? '0' : '16px 0'};
  width: ${props => props.maxWidth ? props.maxWidth : 'auto'};
  align-self: ${props => props.center ? 'center' : 'auto'};
`;

const Text = styled.Text`
  font-size: ${fontSizes.large};
  font-weight: ${fontWeights.bold};
  text-align: ${props => props.center ? 'center' : 'left'}
  width: ${props => props.center ? '100%' : 'auto'};
  margin-right: 6px;
`;

const BlueDot = styled.Text`
  color: ${baseColors.electricBlue};
  font-size: ${fontSizes.extraExtraSmall};
  background-color: ${baseColors.brightSkyBlue};
  height: 4px;
  width: 4px;
  align-self: flex-end;
  position: relative;
  top: -9px;
`;


const Title = (props: Props) => {
  return (
    <Wrapper noMargin={props.noMargin} style={props.style} center={props.center} maxWidth={props.maxWidth}>
      <Text center={props.center}>{props.title}</Text>
      {!!props.title && <BlueDot />}
    </Wrapper>
  );
};

export default Title;
