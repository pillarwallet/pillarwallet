// @flow
import styled from 'styled-components/native';

export const Center = styled.View`
  align-items: center;
`;

export const Container = styled.SafeAreaView`
  flex: 1;
  align-items: ${props => (props.center ? 'center' : 'stretch')};
  justify-content: ${props => (props.center ? 'center' : 'flex-start')};
  background-color: white;
`;

