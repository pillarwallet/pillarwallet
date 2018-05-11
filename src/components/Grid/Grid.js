// @flow
import styled from 'styled-components/native';

export const Grid = styled.View`
  flex-direction: column;
`;

export const Row = styled.View`
  flex-direction: row;
`;

export const Column = styled.View`
  flex: ${props => props.size ? props.size : 1};
`;
