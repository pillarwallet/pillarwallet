// @flow
import * as React from 'react';
import styled from 'styled-components';

type Props = {
  name: string,
  amount: number,
  color: string
}

const AssetCardWrapper = styled.View`
  background-color: ${props => props.color};
  height: 72;
  box-shadow: 0px 0 4px rgba(0,0,0,.2);
  border: 1px solid rgba(0,0,0,.2);
  border-radius: 4;
  margin-bottom: -12;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
  padding: 12px;
`;

const AssetCardIcon = styled.View`
  width: 36;
  height: 36;
  border-radius: 18;
  background: rgba(0,0,0,.2);
  margin-right: 12;
`;

const AssetCardName = styled.Text`
  flex: 1;
`;

const AssetCardAmount = styled.Text`
  flex: 1;
  text-align: right;
`;


export default class AssetCard extends React.Component<Props> {
  componentDidMount() {
    // empty
  }

  render() {
    return (
      <AssetCardWrapper color={this.props.color}>
        <AssetCardIcon />
        <AssetCardName>{this.props.name}</AssetCardName>
        <AssetCardAmount>{this.props.amount}</AssetCardAmount>
      </AssetCardWrapper>
    );
  }
}
