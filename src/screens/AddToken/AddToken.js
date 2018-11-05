// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import type { NavigationScreenProp } from 'react-navigation';
import debounce from 'lodash.debounce';
import { List, ListItem, Body, Switch } from 'native-base';
import type { Assets, Asset } from 'models/Asset';
import { connect } from 'react-redux';
import { baseColors, fontSizes, fontWeights, UIColors } from 'utils/variables';
import { partial } from 'utils/common';
import { findList as findAssets } from 'utils/erc20TokensSearch';
import Button from 'components/Button';
import Toast from 'components/Toast';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import { Container, ScrollWrapper, Wrapper } from 'components/Layout';
import SearchBar from 'components/SearchBar';
import { SubHeading, BaseText, BoldText, LightText } from 'components/Typography';
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
   background-color: ${baseColors.white};
   border-color: ${UIColors.defaultDividerColor};
   border-top-width: 1;
`;

const TokenListItemBody = styled.View`
  flex: 1;
  flexDirection: row;
  justifyContent: space-between;
  padding: 15px 20px 15px 0;
  border-color: ${UIColors.defaultDividerColor};
  border-bottom-width: 1;
`;

const TokenSearchStatusWrapper = styled(Wrapper)`
  padding-top: 100px;
  padding-bottom: 60px;
  background-color: ${baseColors.white};
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

const Footer = styled(Wrapper)`
  background: ${baseColors.white};
  border-color: ${UIColors.defaultDividerColor};
  border-top-width: 1;
  padding: 15px 30px 20px 30px;
`;

const FooterText = styled(BaseText)`
  font-size: ${fontSizes.extraExtraSmall};
  font-weight: ${fontWeights.book};
  line-height: ${fontSizes.medium};
  color: ${baseColors.darkGray};
  letter-spacing: 0.2;
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

  constructor(props: Props) {
    super(props);
    this.searchAssets = debounce(this.searchAssets, 200);
  }

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

  generateTokenListItem({
    symbol, name, fullIconUrl, actionBlock, isLastItem,
  }) {
    return (
      <TokenListItem key={symbol}>
        <TokenThumbnail source={{ uri: fullIconUrl }} />
        <TokenListItemBody style={{ borderBottomWidth: isLastItem ? 0 : 1 }}>
          <Body>
            <TokenName>{name}</TokenName>
            <TokenSymbol>{symbol}</TokenSymbol>
          </Body>
          {!!actionBlock &&
            <Wrapper center>{actionBlock}</Wrapper>
          }
        </TokenListItemBody>
      </TokenListItem>
    );
  }

  generateAddTokenListItems() {
    const { assets, supportedAssets } = this.props;
    const filteredAssets = supportedAssets.filter(({ symbol }) => symbol !== ETH);
    return filteredAssets
      .map(({
        symbol, name, iconUrl, ...rest
      }, index) => {
        const boundAssetToggleHandler = partial(this.handleAssetToggle, {
          symbol,
          name,
          iconUrl,
          ...rest,
        });
        const fullIconUrl = `${SDK_PROVIDER}/${iconUrl}?size=3`;
        const actionBlock = (<Switch
          onValueChange={boundAssetToggleHandler}
          value={!!assets[symbol]}
        />);
        const isLastItem = (filteredAssets.length - index) === 1;
        return this.generateTokenListItem({
          symbol, name, fullIconUrl, actionBlock, isLastItem,
        });
      });
  }

  generateFoundTokenListItems() {
    const { foundAssets } = this.state;
    const { assets } = this.props;

    return foundAssets.map((asset, index) => {
      const {
        symbol, name, iconUrl,
      } = asset;
      const isAdded = !!assets[symbol];
      const fullIconUrl = `${SDK_PROVIDER}/${iconUrl}?size=3`;

      const actionBlock = (isAdded)
        ? (<TokenStatus>In wallet</TokenStatus>)
        : (<Button
          title="Add to wallet"
          onPress={() => this.addTokenToWallet(asset)}
          small
        />);

      const isLastItem = (foundAssets.length - index) === 1;
      return this.generateTokenListItem({
        symbol, name, fullIconUrl, actionBlock, isLastItem,
      });
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

  searchAssets = (query) => {
    const isSearching = query.length > 1;

    this.setState({ isSearching });
    if (isSearching) {
      this.setState({
        foundAssets: findAssets(this.props.supportedAssets, query),
      });
    }
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

    this.setState({
      query: formatedQuery,
    });
    this.searchAssets(formatedQuery);
  };

  render() {
    const { query, isSearching, foundAssets } = this.state;
    const { supportedAssets } = this.props;

    return (
      <Container>
        <Header title="add tokens" onBack={this.handleScreenDismissal} />
        <Wrapper regularPadding>
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
            <TokenSearchStatusWrapper center>
              <EmptyStateParagraph
                title="Token not found"
                bodyText="Check if the name was enetered correctly or add custom token"
              />
            </TokenSearchStatusWrapper>
          }
          <Footer>
            <FooterText>
              Alternatively, you can simply send the tokens to your Pillar wallet. It will appear in the Assets list
              once the transaction is confirmed on the blockchain.
            </FooterText>
          </Footer>
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
