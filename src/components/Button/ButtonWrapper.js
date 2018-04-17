// @flow
import styled from 'styled-components/native';

const ButtonWrapper = styled.TouchableHighlight`
  align-items: center;
  padding: ${props => (props.small ? '5px' : '10px')};
  background: ${props => props.backgroundColor};
  border-color: #00bfff;
  border-width: ${props => (props.secondary ? 1 : 0)};
  margin-bottom: ${props => (props.marginBottom)};
  border-radius: 20;
  width: 80%;
`;

export default ButtonWrapper;
