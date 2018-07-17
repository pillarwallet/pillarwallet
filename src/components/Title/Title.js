// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes, fontWeights } from 'utils/variables';
import { BoldText } from 'components/Typography';

type Props = {
  title?: string,
  style?: Object,
  noMargin?: boolean,
  center?: boolean,
  maxWidth?: number,
};

const Wrapper = styled.View`
  margin: ${props => props.noMargin ? '0' : '16px 0'};
  align-self: ${props => props.center ? 'center' : 'flex-start'};
  ${({ maxWidth }) => maxWidth && `
    width: maxWidth;
  `}
`;

const Text = styled(BoldText)`
  font-size: ${fontSizes.large};
  font-weight: ${fontWeights.bold};
  ${({ center }) => center && `
    width: 100%;
    text-align: center;
  `}
`;

const BlueDot = styled(BoldText)`
  color: ${baseColors.electricBlue};
  font-size: ${fontSizes.extraExtraSmall};
  background-color: ${baseColors.brightSkyBlue};
  align-self: flex-end;
  height: 4px;
  width: 4px;
  position: relative;
  top: -9px;
  left: 6px;
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
