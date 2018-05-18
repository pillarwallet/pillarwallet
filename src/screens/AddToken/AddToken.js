// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { List, ListItem, Body, Right, Switch, Thumbnail } from 'native-base';
import type { Assets, Asset } from 'models/asset';
import { connect } from 'react-redux';
import { baseColors, fontWeights, fontSizes, UIColors } from 'utils/variables';
import { Container, Wrapper } from 'components/Layout';
import ButtonIcon from 'components/ButtonIcon';
import { Paragraph } from 'components/Typography';
import Title from 'components/Title';
import { addAssetAction, removeAssetAction, fetchAssetsBalancesAction } from 'actions/assetsActions';
import tokens from 'utils/erc_whitelist.json';

const tokenIcons = {};

tokenIcons.PLR = require('assets/images/tokens/PLR/icon.png');
tokenIcons.QTM = require('assets/images/tokens/QTM/icon.png');
tokenIcons.OMG = require('assets/images/tokens/OMG/icon.png');
tokenIcons.ICX = require('assets/images/tokens/ICX/icon.png');
tokenIcons.STORJ = require('assets/images/tokens/STORJ/icon.png');
tokenIcons.BAT = require('assets/images/tokens/BAT/icon.png');
tokenIcons.GNT = require('assets/images/tokens/GNT/icon.png');
tokenIcons.PPT = require('assets/images/tokens/PPT/icon.png');
tokenIcons.SALT = require('assets/images/tokens/SALT/icon.png');

const TokenName = styled.Text`
  font-size: ${fontSizes.medium};
  font-weight: ${fontWeights.bold};
`;

const TokenSymbol = styled.Text`
  color: ${baseColors.darkGray};
  font-size: ${fontSizes.medium};
  font-weight: ${fontWeights.light};
`;

const TokenListItem = styled(ListItem) `
  margin: 0;
`;

const CloseButton = styled(ButtonIcon) `
  position: absolute;
  right: 5px;
  top: 5px;
  zIndex: 5;
`;

type Props = {
  navigation: NavigationScreenProp<*>,
  assets: Assets,
  wallet: Object,
  fetchAssetsBalances: Function,
  addAsset: Function,
  removeAsset: Function,
}

class AddToken extends React.Component<Props> {

  handleAssetToggle = (asset: Asset, enabled: Boolean) => {
    const { addAsset, removeAsset } = this.props
    if (enabled) {
      addAsset(asset);
      return;
    }
    removeAsset(asset);
  }

  generateAddTokenListItems() {
    const { assets } = this.props;
    return tokens.map(({ symbol, name, ...rest }) => (
      <TokenListItem key={symbol}>
        <Thumbnail square size={80} source={tokenIcons[symbol]} />
        <Body style={{ marginLeft: 20 }}>
          <TokenName>{name}</TokenName>
          <TokenSymbol>{symbol}</TokenSymbol>
        </Body>
        <Right>
          <Switch onValueChange={this.handleAssetToggle.bind(null, { symbol, name, ...rest })} value={!!assets[symbol]} />
        </Right>
      </TokenListItem>
    ));
  }

  handleScreenDissmisal = () => {
    const { navigation, fetchAssetsBalances, assets, wallet } = this.props;
    fetchAssetsBalances(assets, wallet.address);
    navigation.goBack(null);
  }

  render() {
    return (
      <Container>
        <Wrapper padding>
          <CloseButton
            icon="close"
            onPress={this.handleScreenDissmisal}
            color={UIColors.primary}
            fontSize={42}
          />
          <Title title="add token" />
          <Paragraph>
            Toggle ERC-20 tokens your wallet should display.
          </Paragraph>
          <List>
            {this.generateAddTokenListItems()}
          </List>
        </Wrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({ assets: { data: assets }, wallet: { data: wallet } }) => ({
  assets,
  wallet,
});

const mapDispatchToProps = (dispatch) => ({
  addAsset: (asset: Asset) => dispatch(addAssetAction(asset)),
  removeAsset: (asset: Asset) => dispatch(removeAssetAction(asset)),
  fetchAssetsBalances: (assets, walletAddress) =>
    dispatch(fetchAssetsBalancesAction(assets, walletAddress)),
});

export default connect(mapStateToProps, mapDispatchToProps)(AddToken);