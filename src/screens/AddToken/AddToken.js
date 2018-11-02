// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import type { NavigationScreenProp } from 'react-navigation';
import { List, ListItem, Body, Switch } from 'native-base';
import type { Assets, Asset } from 'models/Asset';
import { connect } from 'react-redux';
import { baseColors, fontSizes, UIColors } from 'utils/variables';
import { partial } from 'utils/common';
import { findList as findAssets } from 'utils/erc20TokensSearch';
import Button from 'components/Button';
import Toast from 'components/Toast';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import { Container, ScrollWrapper, Wrapper } from 'components/Layout';
import SearchBar from 'components/SearchBar';
import { SubHeading, BoldText, LightText } from 'components/Typography';
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
  padding: 0 0 0 20px;
  border-bottom-width: 0;
`;

const TokensWrapper = styled(ScrollWrapper)`
   backgroundColor: ${baseColors.white};
   border-color: ${UIColors.defaultDividerColor};
   border-top-width: 1;
`;

const FoundTokenListItemBodyWrapper = styled.View`
  flex: 1;
  flexDirection: row;
  justifyContent: space-between;
  padding: 15px 20px 15px 0;
  border-color: ${UIColors.defaultDividerColor};
  border-bottom-width: 1;
`;

const TokenThumbnail = styled(CachedImage)`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background: ${baseColors.lightGray};
  margin-right: 15px;
`;

const TokenStatus = styled(LightText)`
  font-size: ${fontSizes.small};
  line-height: ${fontSizes.medium};
  color: ${baseColors.darkGray};
`;

const ListHeading = styled(SubHeading)`
  padding: 20px 20px 0 20px;
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

type State = {
  query: string,
  isSearching: boolean,
  foundAssets: Array<Object>,
}

class AddToken extends React.Component<Props, State> {
  state = {
    query: '',
    isSearching: false,
    foundAssets: [],
  };

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
            <FoundTokenListItemBodyWrapper>
              <Body>
                <TokenName>{name}</TokenName>
                <TokenSymbol>{symbol}</TokenSymbol>
              </Body>
              <Wrapper center>
                <Switch
                  onValueChange={boundAssetToggleHandler}
                  value={!!assets[symbol]}
                />
              </Wrapper>
            </FoundTokenListItemBodyWrapper>
          </TokenListItem>
        );
      });
  }

  generateFoundTokenListItems() {
    const { foundAssets } = this.state;
    const { assets } = this.props;

    return foundAssets.map(asset => {
      const {
        symbol, name, address, iconUrl,
      } = asset;
      const isAdded = !!assets[symbol];
      const fullIconUrl = `${SDK_PROVIDER}/${iconUrl}?size=3`;

      return (
        <TokenListItem key={address}>
          <TokenThumbnail source={{ uri: fullIconUrl }} />
          <FoundTokenListItemBodyWrapper>
            <Body style={{ marginRight: 10 }}>
              <TokenName>{name}</TokenName>
              <TokenSymbol>{symbol}</TokenSymbol>
            </Body>
            <Wrapper center>
              {!isAdded &&
              <Button
                title="Add to wallet"
                onPress={() => this.addTokenToWallet(asset)}
                small
              />
              }
              {isAdded &&
              <TokenStatus>In wallet</TokenStatus>
              }
            </Wrapper>
          </FoundTokenListItemBodyWrapper>
        </TokenListItem>
      );
    });
  }

  addTokenToWallet = (asset: Asset) => {
    const {
      assets,
      fetchAssetsBalances,
      navigation,
      updateAssets,
      wallet,
    } = this.props;

    const updatedAssetList = { ...assets };
    updatedAssetList[asset.symbol] = asset;

    updateAssets(updatedAssetList);
    fetchAssetsBalances(updatedAssetList, wallet.address);
    navigation.goBack(null);

    Toast.show({
      title: 'Added asset',
      message: `Added asset "${asset.name}" to your wallet.`,
      type: 'info',
      autoClose: true,
    });
  };

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

  handleSearchChange = (query: string) => {
    const formatedQuery = !query ? '' : query.trim();
    const isSearching = formatedQuery.length > 1;

    this.setState({
      query: formatedQuery,
      isSearching,
    });

    if (isSearching) {
      this.setState({
        foundAssets: findAssets(this.props.supportedAssets, formatedQuery),
      });
    }
  };

  render() {
    const titleText = 'add tokens';
    const { query, isSearching, foundAssets } = this.state;
    const { supportedAssets } = this.props;

    let header;
    if (this.formChanged) {
      header = <Header title={titleText} nextText="Save" onNextPress={this.handleScreenDismissal} />;
    } else {
      header = <Header title={titleText} onClose={this.handleScreenDismissal} />;
    }

    return (
      <Container>
        {header}
        <Wrapper regularPadding style={{ backgroundColor: baseColors.snowWhite }}>
          <SearchBar
            inputProps={{
              onChange: this.handleSearchChange,
              value: query,
              autoCapitalize: 'none',
            }}
            placeholder="Token name"
            marginTop={15}
          />
        </Wrapper>
        <TokensWrapper>
          {!isSearching &&
            <ScrollWrapper>
              <ListHeading>TOP { supportedAssets.length } TOKENS</ListHeading>
              <List>
                {this.generateAddTokenListItems()}
              </List>
            </ScrollWrapper>
          }
          {isSearching && !!foundAssets.length &&
            <ScrollWrapper>
              <ListHeading>TOKENS FOUND</ListHeading>
              <List>
                {this.generateFoundTokenListItems()}
              </List>
            </ScrollWrapper>
          }
          {isSearching && !foundAssets.length &&
            <Wrapper center fullScreen style={{ paddingBottom: 100 }}>
              <EmptyStateParagraph title="Token not found" bodyText="Please check smart contract address" />
            </Wrapper>
          }
        </TokensWrapper>
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
