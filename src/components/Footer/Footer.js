// @flow
import styled from 'styled-components/native';

const Footer = styled.View`
  flex-direction: column;
  align-items: center;
  width: 100%;
  justify-content: flex-end;
  padding: ${props => (props.padding ? '20px' : '0')};
`;

export default Footer;
