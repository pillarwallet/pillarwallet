// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes, fontWeights } from 'utils/variables';
import { BoldText } from 'components/Typography';


type Props = {
  title?: string,
  style?: Object,
  noMargin?: boolean,
  align?: string,
  subtitle?: boolean,
  maxWidth?: number,
  noBlueDot?: boolean,
};

const Wrapper = styled.View`
  margin: ${props => props.noMargin ? '0' : '16px 0'};
  align-self: ${props => props.align ? props.align : 'flex-start'};
  justify-content: flex-end;
  align-items: baseline;
  position: relative;
  top: 2px;
  ${({ maxWidth }) => maxWidth && `
    width: maxWidth;
  `}
`;

const Text = styled(BoldText)`
  line-height: ${fontSizes.large};
  font-size: ${props => props.subtitle ? fontSizes.medium : fontSizes.large};
  font-weight: ${fontWeights.bold};
  ${({ align }) => align === 'center' && `
    width: 100%;
    text-align: center;
  `}
`;

const BlueDot = styled(BoldText)`
  color: ${baseColors.electricBlue};
  font-size: ${fontSizes.extraExtraSmall};
  background-color: ${props => props.dotColor ? props.dotColor : baseColors.brightSkyBlue};
  align-self: flex-end;
  height: 4px;
  width: 4px;
  position: relative;
  top: -9px;
  left: 6px;
  margin-bottom: -4px;
`;


const Title = (props: Props) => {
  return (
    <Wrapper noMargin={props.noMargin} style={props.style} align={props.align} maxWidth={props.maxWidth}>
      <Text align={props.align} subtitle={props.subtitle}>{props.title}</Text>
      {!!props.title && !props.subtitle && !props.noBlueDot && <BlueDot dotColor={props.dotColor} />}
    </Wrapper>
  );
};

export default Title;
