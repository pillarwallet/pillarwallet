// @flow
import styled from 'styled-components/native';

const Wrapper = styled.View`
  background-color: ${props => props.color};
  height: 72;
  box-shadow: 0px 0 4px rgba(0,0,0,.2);
  border: 1px solid rgba(0,0,0,.2);
  border-radius: 4;
  margin-bottom: -12;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
  padding: 12px;
`;

export default Wrapper;
