// @flow
import styled from 'styled-components/native';

const Footer = styled.View`
  justify-content: flex-end;
  align-items: center;
  align-self: flex-end;
  width: 100%;
  flex: 1;
  padding: ${props => (props.padding ? '20px' : '0')};
`;

export default Footer;
