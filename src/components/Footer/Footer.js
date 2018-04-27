// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Footer as NBFooter } from 'native-base';

const NavigationFooter = styled(NBFooter)`
  padding: 0;
  height: 55;
`;

const DefaultFooter = styled.View`
  flex-direction: column;
  align-items: center;
  width: 100%;
  justify-content: flex-end;
  padding: ${props => (props.padding ? '20px' : '0')};
`;

type Props = {
  type?: string,
  children?: React.Node
};

const Footer = (props: Props) => {
  const type = props.type || '';
  const { children } = props;
  switch (type) {
    case 'navigation': return <NavigationFooter>{children}</NavigationFooter>;
    default: return <DefaultFooter>{children}</DefaultFooter>;
  }
};

export default Footer;
