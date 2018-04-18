// @flow
import styled from 'styled-components/native';

const Footer = styled.View`
  flex: 1;
  justify-content: flex-end;
  align-items: center;
  padding: ${props => (props.padding ? '0 20px' : '0')};
`;

export default Footer;
