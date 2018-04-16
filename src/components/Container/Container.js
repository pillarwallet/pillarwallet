// @flow
import styled from 'styled-components/native';

const Container = styled.SafeAreaView`
  flex: 1;
  margin: 24px;
  align-items: ${props => (props.center ? 'flex-start' : 'stretch')};
  justify-content: ${props => (props.center ? 'center' : 'flex-start')};
`;

export default Container;
