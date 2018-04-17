// @flow
import styled from 'styled-components/native';

const Wrapper = styled.View`
  flex: 1;
  justify-content: ${props => (props.center ? 'center' : 'flex-start')};
`;

export default Wrapper;
