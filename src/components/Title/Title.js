// @flow
import * as React from 'react';
import styled from 'styled-components/native';

type Props = {
  title: string,
};

const Wrapper = styled.View`
  flex-direction: row;
  margin: 20px 0px;
`;

const Text = styled.Text`
  font-size: 24;
  font-weight: 700;
  padding: ${props => (props.padding ? '0 20px' : '0')};
  text-align: ${props => (props.align || 'left')};
`;

const BlueDot = styled.View`
width: 4;
height: 4;
background-color: #25A8E5;
margin-left: 1px;
margin-top: 20px
`;


const Title = (props: Props) => {
  return (
    <Wrapper>
      <Text>{props.title}</Text>
      <BlueDot />
    </Wrapper>
  );
};

export default Title;
