// @flow
import styled from 'styled-components/native';

const CheckboxVisible = styled.View`
  width: 30;
  height: 30;
  margin-right: 20;
  border-radius: 60;
  border-width: 2;
  border-color: ${props => (props.active ? '#00bfff' : 'gray')};
`;

export default CheckboxVisible;
