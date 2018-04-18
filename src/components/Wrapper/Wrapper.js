// @flow
import styled from 'styled-components/native';

const Wrapper = styled.View`
  flex: 1;
  padding: ${props => (props.padding ? '0 20px' : '0')};
  justify-content: ${props => (props.center ? 'center' : 'flex-start')};
`;

export default Wrapper;
