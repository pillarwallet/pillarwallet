// @flow
import styled from 'styled-components/native';

export const Grid = styled.View`
  flex: 1;
  flex-direction: column;
`;

export const Row = styled.View`
  flex-direction: row;
  flex: ${props => props.size ? props.size : 1};
  padding: ${props => props.customPadding || 0};
`;

export const Column = styled.View`
  flex-direction: column;
  flex: ${props => props.size ? props.size : 1};
`;
