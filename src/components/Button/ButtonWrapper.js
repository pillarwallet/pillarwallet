// @flow
import styled from 'styled-components/native';

const ButtonWrapper = styled.TouchableHighlight`
  align-items: center;
  padding: ${props => (props.small ? '5px' : '12px 5px')};
  background: ${props => props.backgroundColor};
  margin-top: ${props => (props.marginTop)};
  margin-bottom: ${props => (props.marginBottom)};
  border-radius: 20;
  box-shadow: ${props => `0px .5px .5px ${props.backgroundColor}`};
  width: ${props => (props.width || '80%')};
`;

export default ButtonWrapper;
