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
  height: 72;
  box-shadow: 0px 8px rgba(0,0,0,.2);
  border-radius: 4;
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
