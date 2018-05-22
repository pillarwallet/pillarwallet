// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes, fontWeights } from 'utils/variables';

type Props = {
  title: string,
  style?: Object,
  center?: boolean,
  maxWidth?: number,
};

const Wrapper = styled.View`
  flex-direction: row;
  align-self: flex-start;
  flex-wrap: wrap;
  margin: 20px 0px;
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
  color: ${baseColors.clearBlue};
  font-size: ${fontSizes.extraSmall};
  // TODO: replace or remove font Symbol, it causes issues on Android
  // font-family: Symbol;
`;


const Title = (props: Props) => {
  return (
    <Wrapper style={props.style} center={props.center} maxWidth={props.maxWidth}>
      <Text center={props.center}>{props.title}<BlueDot> ■</BlueDot></Text>

    </Wrapper>
  );
};

export default Title;
