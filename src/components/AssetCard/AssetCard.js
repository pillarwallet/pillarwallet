// @flow
import * as React from 'react';
import { Text, View } from 'react-native';
import styled from 'styled-components';

type Props = {
  title: string
}

const AssetCardWrapper = styled.View`
  background: red;
  flex: 1;
  height: 100;
`;

export default class AssetCard extends React.Component<Props> {
  componentDidMount() {
    // empty
  }

  render() {
    return (
      <AssetCardWrapper>
        <Text>{this.props.title}</Text>
      </AssetCardWrapper>
    );
  }
}
