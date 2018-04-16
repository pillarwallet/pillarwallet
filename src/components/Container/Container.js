// @flow
import styled from 'styled-components/native';

const Container = styled.SafeAreaView`
  flex: 1;
  margin: 24px;
  align-items: ${props => (props.center ? 'flex-start' : 'normal')};
  justify-content: ${props => (props.center ? 'center' : 'normal')};
`;

export default Container;
