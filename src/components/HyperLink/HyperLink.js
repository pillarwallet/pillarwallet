// @flow
import * as React from 'react';
import { Linking } from 'react-native';
import styled from 'styled-components/native';
import { BaseText } from 'components/Typography';

type Props = {
  children: React.Node,
  url: string,
}

const HyperLinkText = styled(BaseText)`
  color: rgb(32,119,253);
`;

const HyperLink = (props: Props) => {
  return (
    <HyperLinkText onPress={() => Linking.openURL(props.url)}>
      {props.children}
    </HyperLinkText>
  );
};

export default HyperLink;
