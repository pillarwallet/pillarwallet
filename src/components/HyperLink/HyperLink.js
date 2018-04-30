// @flow
import * as React from 'react';
import { Linking } from 'react-native';
import styled from 'styled-components/native';

type Props = {
  children: any,
  url: string
}

const HyperLinkText = styled.Text`
  color: rgb(32,119,253);
`;

export default class HyperLink extends React.Component<Props> {
  openLink(url: string) {
    Linking.openURL(url);
  }

  render() {
    return (
      <HyperLinkText onPress={() => this.openLink(this.props.url)}>
        {this.props.children}
      </HyperLinkText>
    );
  }
}

