// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes, fontWeights } from 'utils/variables';

type Props = {
  title: string,
  style?: Object,
};

const Wrapper = styled.View`
  flex-direction: row;
  align-self: flex-start;
  flex-wrap: wrap;
  margin: 20px 0px;
`;

const Text = styled.Text`
  font-size: ${fontSizes.large};
  font-weight: ${fontWeights.bold};
`;

const BlueDot = styled.Text`
  color: ${baseColors.clearBlue};
  font-size: ${fontSizes.extraSmall};
  font-family: Symbol;
`;


const Title = (props: Props) => {
  return (
    <Wrapper style={props.style}>
      <Text>{props.title}<BlueDot> ■</BlueDot></Text>

    </Wrapper>
  );
};

export default Title;
