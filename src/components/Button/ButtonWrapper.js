// @flow
import styled from 'styled-components/native';

const ButtonWrapper = styled.TouchableHighlight`
  align-items: center;
  padding: ${props => (props.small ? '5px' : '10px 40px')};
  background: ${props => props.backgroundColor};
  margin-bottom: ${props => (props.marginBottom)};
  border-radius: 20;
  width: ${props => (props.width || '80%')};
`;

export default ButtonWrapper;
