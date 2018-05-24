// @flow
import styled from 'styled-components/native';

const ButtonWrapper = styled.TouchableHighlight`
  align-items: center;
  padding: ${props => props.noPadding ? '0' : '10px 40px'};
  background-color: ${props => props.theme.background};
  margin-top: ${props => props.marginTop || '0px'};
  margin-bottom: ${props => props.marginBottom || '0px'};
  margin-left: ${props => props.marginLeft || '0px'};
  margin-right: ${props => props.marginRight || '0px'};
  border-radius: 40;
  box-shadow: ${props => `0px .5px .5px ${props.theme.background}`};
  width: ${props => props.block ? '100%' : 'auto'};
`;

export default ButtonWrapper;
