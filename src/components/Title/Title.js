// @flow
import * as React from 'react';
import styled from 'styled-components/native';

type Props = {
  title: string,
  align?: string,
};

const Wrapper = styled.View`
  flex-direction: row;
  margin: 20px 0px;
  justify-content: ${props => (props.align || 'flex-start')};
`;

const Text = styled.Text`
  font-size: 24;
  font-weight: 700;
`;

const BlueDot = styled.View`
  width: 4;
  height: 4;
  background-color: #25A8E5;
  margin-left: 1px;
  margin-top: 20px;
`;


const Title = (props: Props) => {
  return (
    <Wrapper {...props}>
      <Text>{props.title}</Text>
      <BlueDot />
    </Wrapper>
  );
};

export default Title;
