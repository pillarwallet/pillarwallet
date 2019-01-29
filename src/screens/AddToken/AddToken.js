// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as React from 'react';
import styled from 'styled-components/native';
import { Animated, FlatList, Keyboard } from 'react-native';
import { CachedImage } from 'react-native-cached-image';
import type { NavigationEventSubscription, NavigationScreenProp } from 'react-navigation';
import debounce from 'lodash.debounce';
import { List, ListItem, Body, Switch } from 'native-base';
import { SDK_PROVIDER } from 'react-native-dotenv';

import type { Assets, Asset } from 'models/Asset';
import { connect } from 'react-redux';
import { baseColors, fontSizes, fontWeights, UIColors } from 'utils/variables';
import { partial } from 'utils/common';
import Button from 'components/Button';
import Toast from 'components/Toast';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import { Container, ScrollWrapper, Wrapper } from 'components/Layout';
import SearchBar from 'components/SearchBar';
import { SubHeading, BaseText, BoldText, LightText } from 'components/Typography';
import Header from 'components/Header';
import Spinner from 'components/Spinner';

import {
  addAssetAction,
  removeAssetAction,
  updateAssetsAction,
  fetchAssetsBalancesAction,
  startAssetsSearchAction,
  searchAssetsAction,
  resetSearchAssetsResultAction,
} from 'actions/assetsActions';
import { ETH, FETCHING, FETCHED } from 'constants/assetsConstants';

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

const TokensWrapper = styled(Wrapper)`
   flex: 1;
   height: 100%;
   background-color: ${baseColors.white};
   border-color: ${UIColors.defaultDividerColor};
   border-top-width: 1;
`;

const TokenListItemBody = styled.View`
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
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

const HeaderWrapper = styled(Wrapper)`
  background-color: ${baseColors.snowWhite};
  z-index: 100;
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

const SearchSpinner = styled(Wrapper)`
  padding-top: 20;
`;

const FullScreenOverlayWrapper = styled.TouchableOpacity`
  z-index: 10;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  position: absolute;
`;

const FullScreenOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,.6);
`;

const AnimatedFullScreenOverlay = Animated.createAnimatedComponent(FullScreenOverlay);

type Props = {
  navigation: NavigationScreenProp<*>,
  supportedAssets: Asset[],
  assets: Assets,
  wallet: Object,
  fetchAssetsBalances: Function,
  updateAssets: Function,
  addAsset: Function,
  removeAsset: Function,
  searchAssets: Function,
  startAssetsSearch: Function,
  resetSearchAssetsResult: Function,
  assetsSearchResults: Asset[],
  assetsSearchState: string,
}

type State = {
  query: string,
  searchIsFocused: boolean,
  fullScreenOverlayOpacity: Animated.Value,
}

const MIN_QUERY_LENGTH = 2;
const genericToken = require('assets/images/tokens/genericToken.png');

class AddToken extends React.Component<Props, State> {
  _willBlur: NavigationEventSubscription;
  formChanged: boolean = false;

  state = {
    query: '',
    searchIsFocused: false,
    fullScreenOverlayOpacity: new Animated.Value(0),
  };

  constructor(props: Props) {
    super(props);
    this.doAssetsSearch = debounce(this.doAssetsSearch, 500);
  }

  componentDidMount() {
    const { navigation } = this.props;
    this._willBlur = navigation.addListener('willBlur', () => {
      Keyboard.dismiss();
      this.animateFullScreenOverlayOpacity(true);
    });
  }

  componentWillUnmount() {
    this._willBlur.remove();
  }

  animateFullScreenOverlayOpacity = (active: boolean, onEnd?: Function) => {
    const { fullScreenOverlayOpacity } = this.state;
    if (!active) {
      fullScreenOverlayOpacity.setValue(0);
      Animated.timing(fullScreenOverlayOpacity, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }).start();
    } else {
      fullScreenOverlayOpacity.setValue(1);
      Animated.timing(fullScreenOverlayOpacity, {
        toValue: 0,
        duration: 80,
        useNativeDriver: true,
      }).start(() => onEnd && onEnd());
    }
  };

  handleSearchFocus = () => {
    this.setState({
      searchIsFocused: true,
    });
    this.animateFullScreenOverlayOpacity(false);
  };

  animateAfterDelay = () => {
    this.setState({
      searchIsFocused: false,
    });
  };

  handleSearchBlur = () => {
    Keyboard.dismiss();
    this.animateFullScreenOverlayOpacity(true, this.animateAfterDelay);
  };

  handleAssetToggle = (asset: Asset, enabled: Boolean) => {
    const { addAsset, removeAsset } = this.props;
    this.formChanged = true;
    if (enabled) {
      addAsset(asset);
      return;
    }
    removeAsset(asset);
  };

  renderTokenListItem({
    symbol, name, fullIconUrl, actionBlock, isLastItem,
  }) {
    return (
      <TokenListItem key={symbol}>
        <TokenThumbnail source={{ uri: fullIconUrl }} fallbackSource={genericToken} />
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

  showTopTokensListItems() {
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
        return this.renderTokenListItem({
          symbol, name, fullIconUrl, actionBlock, isLastItem,
        });
      });
  }

  renderFoundTokensList() {
    const { assets, assetsSearchResults } = this.props;

    const renderItem = ({ item: asset, index }) => {
      const { symbol, name, iconUrl } = asset;
      const isAdded = !!assets[symbol];
      const fullIconUrl = `${SDK_PROVIDER}/${iconUrl}?size=3`;

      const actionBlock = isAdded
        ? <TokenStatus>Added</TokenStatus>
        : (<Button
          title="Add"
          onPress={() => this.addTokenToWallet(asset)}
          keyboardShouldPersistTaps="always"
          small
        />);

      const isLastItem = (assetsSearchResults.length - index) === 1;
      return this.renderTokenListItem({
        symbol, name, fullIconUrl, actionBlock, isLastItem,
      });
    };

    return (
      <FlatList
        data={assetsSearchResults}
        keyExtractor={(item) => item.address}
        renderItem={renderItem}
        onScroll={() => Keyboard.dismiss()}
        keyboardShouldPersistTaps="always"
        ListHeaderComponent={() => <ListHeading>FOUND TOKENS</ListHeading>}
      />
    );
  }

  addTokenToWallet = (asset: Asset) => {
    const {
      assets,
      fetchAssetsBalances,
      updateAssets,
      wallet,
    } = this.props;

    const updatedAssetList = { ...assets };
    updatedAssetList[asset.symbol] = asset;

    updateAssets(updatedAssetList);
    fetchAssetsBalances(updatedAssetList, wallet.address);

    Toast.show({
      title: 'Added asset',
      message: `Added asset "${asset.name}" to your wallet.`,
      type: 'info',
      autoClose: true,
    });
  };

  doAssetsSearch = (query: string) => {
    const { searchAssets, resetSearchAssetsResult } = this.props;
    if (query.length < MIN_QUERY_LENGTH) {
      resetSearchAssetsResult();
      return;
    }
    searchAssets(query);
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
    const formattedQuery = !query ? '' : query.trim();

    this.setState({
      query: formattedQuery,
    });
    this.props.startAssetsSearch();
    this.doAssetsSearch(formattedQuery);
  };

  render() {
    const { query, searchIsFocused, fullScreenOverlayOpacity } = this.state;
    const { supportedAssets, assetsSearchResults, assetsSearchState } = this.props;
    const isSearchOver = assetsSearchState === FETCHED;
    const isSearching = assetsSearchState === FETCHING;
    const inSearchMode = (query.length >= MIN_QUERY_LENGTH && !!assetsSearchState);
    const resultsFound = !!assetsSearchResults.length;

    return (
      <Container inset={{ bottom: 0 }}>
        <HeaderWrapper>
          <Header title="add tokens" onBack={this.handleScreenDismissal} />
          <Wrapper regularPadding>
            <SearchBar
              inputProps={{
                onChange: this.handleSearchChange,
                onBlur: this.handleSearchBlur,
                onFocus: this.handleSearchFocus,
                value: query,
                autoCapitalize: 'none',
              }}
              placeholder="Token name"
              marginTop={15}
            />
          </Wrapper>
        </HeaderWrapper>
        {searchIsFocused && !inSearchMode &&
          <FullScreenOverlayWrapper onPress={this.handleSearchBlur}>
            <AnimatedFullScreenOverlay
              style={{
                opacity: fullScreenOverlayOpacity,
              }}
            />
          </FullScreenOverlayWrapper>
        }
        <TokensWrapper>
          {!inSearchMode &&
            <ScrollWrapper>
              <ListHeading>TOP { supportedAssets.length } TOKENS</ListHeading>
              <List>
                {this.showTopTokensListItems()}
              </List>
              <Footer>
                <FooterText>
                  Alternatively, you can simply send the tokens to your Pillar wallet. It will appear in the Assets list
                  once the transaction is confirmed on the blockchain.
                </FooterText>
              </Footer>
            </ScrollWrapper>
          }
          {inSearchMode && resultsFound && isSearchOver &&
            <Wrapper>
              {this.renderFoundTokensList()}
            </Wrapper>
          }
          {inSearchMode && !resultsFound && isSearchOver &&
            <TokenSearchStatusWrapper center>
              <EmptyStateParagraph
                title="Token not found"
                bodyText="Check if the name was entered correctly or add custom token"
              />
            </TokenSearchStatusWrapper>
          }
          {isSearching &&
            <SearchSpinner center>
              <Spinner />
            </SearchSpinner>
          }
        </TokensWrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({
  assets: {
    data: assets,
    supportedAssets,
    assetsSearchState,
    assetsSearchResults,
  },
  wallet: { data: wallet },
}) => ({
  supportedAssets,
  assets,
  assetsSearchState,
  assetsSearchResults,
  wallet,
});

const mapDispatchToProps = (dispatch) => ({
  addAsset: (asset: Asset) => dispatch(addAssetAction(asset)),
  removeAsset: (asset: Asset) => dispatch(removeAssetAction(asset)),
  updateAssets: (assets: Assets) => dispatch(updateAssetsAction(assets)),
  fetchAssetsBalances: (assets: Assets, walletAddress) => {
    dispatch(fetchAssetsBalancesAction(assets, walletAddress));
  },
  startAssetsSearch: () => dispatch(startAssetsSearchAction()),
  searchAssets: (query: string) => dispatch(searchAssetsAction(query)),
  resetSearchAssetsResult: () => dispatch(resetSearchAssetsResultAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(AddToken);
