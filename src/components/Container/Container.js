// @flow
import styled from 'styled-components/native';

const Container = styled.SafeAreaView`
  flex: 1;
  align-items: ${props => (props.center ? 'center' : 'stretch')};
  justify-content: ${props => (props.center ? 'center' : 'flex-start')};
`;

export default Container;
