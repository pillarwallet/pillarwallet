// @flow
import styled from 'styled-components/native';

const PinDot = styled.View`
  width: 12px;
  height: 12px;
  background-color: gray;
  border-radius: 6;
  opacity: ${props => (props.active ? 1 : 0.5)};
`;

export default PinDot;
