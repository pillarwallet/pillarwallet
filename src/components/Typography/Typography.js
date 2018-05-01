// @flow
import styled from 'styled-components/native';

export const Title = styled.Text`
  font-size: 24;
  margin: 20px 0;
  font-weight: 700;
  padding: ${props => (props.padding ? '0 20px' : '0')};
  text-align: ${props => (props.align || 'left')};
`;

export const Body = styled.Text`
  font-size: 16;
  margin-bottom: 10;
`;

export const Label = styled.Text`
  font-size: 14;
  color: rgb(155,155,155);
  margin-bottom: 10;
  align-self: flex-start;
`;
