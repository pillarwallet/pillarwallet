// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import type { NavigationScreenProp } from 'react-navigation';
import { List, ListItem, Body, Right, Switch } from 'native-base';
import type { Assets, Asset } from 'models/Asset';
import { connect } from 'react-redux';
import { baseColors, fontSizes, UIColors } from 'utils/variables';
import { partial } from 'utils/common';
import { Container, ScrollWrapper } from 'components/Layout';
import { SubTitle, BoldText, LightText } from 'components/Typography';
import Header from 'components/Header';
import {
  addAssetAction,
  removeAssetAction,
  updateAssetsAction,
  fetchAssetsBalancesAction,
} from 'actions/assetsActions';
import { ETH } from 'constants/assetsConstants';
import { SDK_PROVIDER } from 'react-native-dotenv';

const TokenName = styled(BoldText)`
  font-size: ${fontSizes.small};
`;

const TokenSymbol = styled(LightText)`
  color: ${baseColors.darkGray};
  font-size: ${fontSizes.small};
`;

const TokenListItem = styled(ListItem)`
  margin: 0;
  border-color: ${UIColors.defaultDividerColor};
  border-bottom-width: 1px;
`;

const TokenThumbnail = styled(CachedImage)`
  width: 44px;
  height: 44px;
  border-radius: 22px;
`;

type Props = {
  navigation: NavigationScreenProp<*>,
  supportedAssets: Asset[],
  assets: Assets,
  wallet: Object,
  fetchAssetsBalances: Function,
  updateAssets: Function,
  addAsset: Function,
  removeAsset: Function,
}

class AddToken extends React.Component<Props> {
  formChanged: boolean = false;

  handleAssetToggle = (asset: Asset, enabled: Boolean) => {
    const { addAsset, removeAsset } = this.props;
    this.formChanged = true;
    if (enabled) {
      addAsset(asset);
      return;
    }
    removeAsset(asset);
  };

  generateAddTokenListItems() {
    const { assets, supportedAssets } = this.props;
    return supportedAssets
      .filter(({ symbol }) => symbol !== ETH)
      .map(({
        symbol, name, iconUrl, ...rest
      }) => {
        const boundAssetToggleHandler = partial(this.handleAssetToggle, {
          symbol,
          name,
          iconUrl,
          ...rest,
        });
        const fullIconUrl = `${SDK_PROVIDER}/${iconUrl}?size=3`;
        return (
          <TokenListItem key={symbol}>
            <TokenThumbnail source={{ uri: fullIconUrl }} />
            <Body style={{ marginLeft: 20 }}>
              <TokenName>{name}</TokenName>
              <TokenSymbol>{symbol}</TokenSymbol>
            </Body>
            <Right>
              <Switch
                onValueChange={boundAssetToggleHandler}
                value={!!assets[symbol]}
              />
            </Right>
          </TokenListItem>
        );
      });
  }

  handleScreenDismissal = () => {
    const {
      navigation,
      fetchAssetsBalances,
      updateAssets,
      assets,
      wallet,
    } = this.props;
    if (this.formChanged) {
      updateAssets(assets);
      fetchAssetsBalances(assets, wallet.address);
    }
    navigation.goBack(null);
  };

  render() {
    const titleText = 'manage tokens';
    let header;
    if (this.formChanged) {
      header = <Header title={titleText} nextText="Save" onNextPress={this.handleScreenDismissal} />;
    } else {
      header = <Header title={titleText} onClose={this.handleScreenDismissal} />;
    }

    return (
      <Container>
        {header}
        <ScrollWrapper regularPadding>
          <SubTitle>
            Toggle ERC-20 tokens your wallet should display.
          </SubTitle>
          <List>
            {this.generateAddTokenListItems()}
          </List>
        </ScrollWrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({ assets: { data: assets, supportedAssets }, wallet: { data: wallet } }) => ({
  supportedAssets,
  assets,
  wallet,
});

const mapDispatchToProps = (dispatch) => ({
  addAsset: (asset: Asset) => dispatch(addAssetAction(asset)),
  removeAsset: (asset: Asset) => dispatch(removeAssetAction(asset)),
  updateAssets: (assets: Assets) => dispatch(updateAssetsAction(assets)),
  fetchAssetsBalances: (assets: Assets, walletAddress) => {
    dispatch(fetchAssetsBalancesAction(assets, walletAddress));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(AddToken);
