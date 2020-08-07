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
import { Keyboard, SectionList, FlatList, Alert, ScrollView } from 'react-native';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import debounce from 'lodash.debounce';
import type { NavigationScreenProp } from 'react-navigation';
import { getEnv } from 'configs/envConfig';
import t from 'translations/translate';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Tabs from 'components/Tabs';
import ButtonText from 'components/ButtonText';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Switcher from 'components/Switcher';
import Toast from 'components/Toast';
import SearchBlock from 'components/SearchBlock';
import Separator from 'components/Separator';
import { Wrapper } from 'components/Layout';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Spinner from 'components/Spinner';

import { getBalance } from 'utils/assets';
import { spacing } from 'utils/variables';

import { accountBalancesSelector } from 'selectors/balances';
import { accountAssetsSelector } from 'selectors/assets';
import { FETCHING, ETH, PLR } from 'constants/assetsConstants';

import {
  searchAssetsAction,
  resetSearchAssetsResultAction,
  addAssetAction,
  addMultipleAssetsAction,
} from 'actions/assetsActions';
import { hideAssetAction } from 'actions/userSettingsActions';

import type { Asset, Assets, Balances } from 'models/Asset';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';


type Props = {
  assetsSearchState: ?string,
  assetsSearchResults: Asset[],
  supportedAssets: Asset[],
  balances: Balances,
  assets: Assets,
  addAsset: (asset: Asset) => void,
  hideAsset: (asset: Asset) => void,
  searchAssets: (query: string) => void,
  resetSearchAssetsResult: () => void,
  addMultipleAssets: (assets: Asset[]) => void,
  navigation: NavigationScreenProp<*>,
};

type State = {
  activeTab: string,
  query: string,
};

const DISPLAYED = 'DISPLAYED';
const ALL_NON_ZERO = 'ALL_NON_ZERO';
const MIN_QUERY_LENGTH = 2;

const ButtonsWrapper = styled.View`
  align-items: flex-start;
  margin: 22px 20px;
`;

const EmptyStateWrapper = styled(Wrapper)`
  padding-top: 90px;
  padding-bottom: 90px;
  align-items: center;
`;

const SearchSpinner = styled(Wrapper)`
  padding-top: 20;
`;


class AssetSearch extends React.Component<Props, State> {
  displayedAssets: Asset[];

  constructor(props) {
    super(props);
    this.state = {
      activeTab: DISPLAYED,
      query: '',
    };

    const { supportedAssets, assets } = props;
    const displayedAssetsSymbols = Object.keys(assets);
    this.displayedAssets = displayedAssetsSymbols.map(symbol => supportedAssets.find(asset => asset.symbol === symbol));
    this.doAssetsSearch = debounce(this.doAssetsSearch, 500);
  }

  componentDidUpdate() {
    const { assets } = this.props;

    Object.keys(assets).forEach(symbol => {
      if (!this.displayedAssets.find(asset => symbol === asset.symbol)) {
        this.displayedAssets.push(assets[symbol]);
      }
    });
  }

  getTabs = () => {
    return [
      {
        id: DISPLAYED,
        name: t('assetSearchContent.tabs.visible.title'),
        onPress: () => this.setState({ activeTab: DISPLAYED }),
      },
      {
        id: ALL_NON_ZERO,
        name: t('assetSearchContent.tabs.withBalance.title'),
        onPress: () => this.setState({ activeTab: ALL_NON_ZERO }),
      },
    ];
  };

  handleAssetToggle = (asset: Asset, added: Boolean) => {
    if (!added) {
      this.addTokenToWallet(asset);
    } else {
      this.hideTokenFromWallet(asset);
    }
  };

  addTokenToWallet = (asset: Asset) => {
    const { addAsset } = this.props;
    addAsset(asset);
  };

  hideTokenFromWallet = (asset: Asset) => {
    const {
      hideAsset,
    } = this.props;

    if (asset.symbol === ETH || asset.symbol === PLR) {
      this.showNotHiddenNotification(asset);
      return;
    }

    Alert.alert(
      t('alert.hideAsset.title'),
      t('alert.hideAsset.message', { asset: asset.name }),
      [
        { text: t('alert.hideAsset.button.cancel'), style: 'cancel' },
        { text: t('alert.hideAsset.button.ok'), onPress: () => hideAsset(asset) },
      ],
    );
  };

  showNotHiddenNotification = (asset) => {
    Toast.show({
      message: t('toast.forbiddenToRemoveAsset.message', { asset: asset.name }),
      type: 'info',
      title: t('toast.forbiddenToRemoveAsset.title'),
    });
  };

  selectAllAssets = () => {
    const { assets, addMultipleAssets } = this.props;
    const allAssets = this.getAssetsList();
    const assetsToAdd = allAssets.filter(asset => !assets[asset.symbol]);
    addMultipleAssets(assetsToAdd);
  };

  handleSearchChange = (query: string) => {
    const formattedQuery = !query ? '' : query.trim();

    this.setState({
      query: formattedQuery,
    });

    this.doAssetsSearch(formattedQuery);
  };

  doAssetsSearch = (query: string) => {
    const { searchAssets, resetSearchAssetsResult } = this.props;
    if (query.length < MIN_QUERY_LENGTH) {
      resetSearchAssetsResult();
      return;
    }
    searchAssets(query);
  };

  isInSearchMode = () => this.state.query.length >= MIN_QUERY_LENGTH && !!this.props.assetsSearchState;

  renderFoundTokensList() {
    const { assets, assetsSearchResults } = this.props;
    const addedAssets = [];
    const foundAssets = [];

    assetsSearchResults.forEach((result) => {
      if (!assets[result.symbol]) {
        foundAssets.push(result);
      } else {
        addedAssets.push(result);
      }
    });

    const sections = [];
    if (addedAssets.length) sections.push({ title: 'ADDED TOKENS', data: addedAssets, extraData: assets });
    if (foundAssets.length) sections.push({ title: 'FOUND TOKENS', data: foundAssets, extraData: assets });

    const renderItem = ({ item: asset }) => {
      const {
        symbol,
        name,
        iconUrl,
      } = asset;

      const isAdded = !!assets[symbol];
      const fullIconUrl = `${getEnv('SDK_PROVIDER')}/${iconUrl}?size=3`;

      return (
        <ListItemWithImage
          label={name}
          subtext={symbol}
          itemImageUrl={fullIconUrl}
          fallbackToGenericToken
          small
        >
          <Switcher
            onToggle={() => this.handleAssetToggle(asset, isAdded)}
            isOn={!!isAdded}
          />
        </ListItemWithImage>
      );
    };

    return (
      <SectionList
        renderItem={renderItem}
        sections={sections}
        keyExtractor={(item) => item.symbol}
        style={{ width: '100%' }}
        contentContainerStyle={{
          width: '100%',
          paddingTop: spacing.mediumLarge,
        }}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
        ListEmptyComponent={
          <EmptyStateWrapper fullScreen>
            <EmptyStateParagraph
              title={t('assetSearchContent.tabs.visible.emptyState.title')}
              bodyText={t('assetSearchContent.tabs.visible.emptyState.paragraph')}
            />
          </EmptyStateWrapper>
        }
        onScroll={() => Keyboard.dismiss()}
        keyboardShouldPersistTaps="always"
      />
    );
  }

  renderToken = ({ item: token }) => {
    const { balances, assets } = this.props;
    const {
      name,
      iconUrl,
      symbol,
    } = token;
    const fullIconUrl = `${getEnv('SDK_PROVIDER')}/${iconUrl}?size=3`;
    const balance = getBalance(balances, symbol);
    const isAdded = !!assets[symbol];

    return (
      <ListItemWithImage
        label={name}
        itemImageUrl={fullIconUrl}
        subtext={`${balance} ${symbol}`}
        fallbackToGenericToken
      >
        <Switcher
          onToggle={() => this.handleAssetToggle(token, isAdded)}
          isOn={!!isAdded}
        />
      </ListItemWithImage>
    );
  };

  getAssetsList = () => {
    const { supportedAssets, balances } = this.props;
    const { activeTab } = this.state;

    if (activeTab === DISPLAYED) {
      return this.displayedAssets;
    }
    return supportedAssets.filter(({ symbol }) => getBalance(balances, symbol) > 0);
  };

  render() {
    const { assets, navigation, assetsSearchState } = this.props;
    const { activeTab, query } = this.state;
    const isSearching = assetsSearchState === FETCHING && query.length >= MIN_QUERY_LENGTH;
    const isInSearchMode = this.isInSearchMode();

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: t('assetSearchContent.title') }],
        }}
      >
        <ScrollView
          stickyHeaderIndices={[0]}
        >
          <>
            <SearchBlock
              searchInputPlaceholder={t('label.searchAsset')}
              onSearchChange={this.handleSearchChange}
              wrapperStyle={{
                paddingHorizontal: 20,
                paddingVertical: 16,
              }}
              itemSearchState={!!isInSearchMode}
              navigation={navigation}
            />
            {!isInSearchMode && (
              <Tabs
                tabs={this.getTabs()}
                activeTab={activeTab}
              />
            )}
          </>
          {!isInSearchMode && (
            <>
              <ButtonsWrapper>
                <ButtonText
                  buttonText={t('button.selectAll')}
                  onPress={this.selectAllAssets}
                  wrapperStyle={{ alignSelf: 'flex-start' }}
                />
              </ButtonsWrapper>
              <FlatList
                extraData={assets}
                data={this.getAssetsList()}
                renderItem={this.renderToken}
              />
            </>
        )}
          {isSearching &&
          <SearchSpinner center>
            <Spinner />
          </SearchSpinner>
        }
          {isInSearchMode && this.renderFoundTokensList()}
        </ScrollView>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  assets: {
    assetsSearchState,
    assetsSearchResults,
    supportedAssets,
  },
}: RootReducerState): $Shape<Props> => ({
  assetsSearchState,
  assetsSearchResults,
  supportedAssets,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  assets: accountAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  addAsset: (asset: Asset) => dispatch(addAssetAction(asset)),
  hideAsset: (asset: Asset) => dispatch(hideAssetAction(asset)),
  searchAssets: (query: string) => dispatch(searchAssetsAction(query)),
  resetSearchAssetsResult: () => dispatch(resetSearchAssetsResultAction()),
  addMultipleAssets: (assets: Asset[]) => dispatch(addMultipleAssetsAction(assets)),
});


export default connect(combinedMapStateToProps, mapDispatchToProps)(AssetSearch);
