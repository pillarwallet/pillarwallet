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
import get from 'lodash.get';
import {
  SectionList,
  Keyboard,
  Switch,
  Alert,
} from 'react-native';
import styled from 'styled-components/native';
import isEqual from 'lodash.isequal';
import type { NavigationEventSubscription, NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { SDK_PROVIDER } from 'react-native-dotenv';
import debounce from 'lodash.debounce';
import { createStructuredSelector } from 'reselect';

// components
import { BaseText, BoldText } from 'components/Typography';
import Spinner from 'components/Spinner';
import Button from 'components/Button';
import Toast from 'components/Toast';
import { Container, Wrapper } from 'components/Layout';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import SearchBlock from 'components/SearchBlock';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Separator from 'components/Separator';
import Tabs from 'components/Tabs';

// types
import type { Assets, Asset } from 'models/Asset';
import type { Collectible } from 'models/Collectible';
import type { Badges } from 'models/Badge';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Accounts } from 'models/Account';

// actions
import {
  updateAssetsAction,
  fetchInitialAssetsAction,
  startAssetsSearchAction,
  searchAssetsAction,
  resetSearchAssetsResultAction,
  addAssetAction,
  removeAssetAction,
} from 'actions/assetsActions';
import { logScreenViewAction } from 'actions/analyticsActions';
import { deploySmartWalletAction } from 'actions/smartWalletActions';

// constants
import {
  FETCH_INITIAL_FAILED,
  FETCHED,
  FETCHING,
  ETH,
  TOKENS,
  COLLECTIBLES,
} from 'constants/assetsConstants';
import { EXTRASMALL, MINIMIZED, SIMPLIFIED } from 'constants/assetsLayoutConstants';
import { SMART_WALLET_UPGRADE_STATUSES, SMART_WALLET_DEPLOYMENT_ERRORS } from 'constants/smartWalletConstants';

// utils
import { baseColors, spacing, fontSizes, UIColors } from 'utils/variables';
import { getSmartWalletStatus } from 'utils/smartWallet';

// selectors
import { accountCollectiblesSelector } from 'selectors/collectibles';

// local components
import AssetsList from './AssetsList';
import CollectiblesList from './CollectiblesList';
import HeaderButtonsForSmartWallet from './HeaderButtonsForSmartWallet';

type Props = {
  fetchInitialAssets: () => Function,
  assets: Assets,
  collectibles: Collectible[],
  wallet: Object,
  rates: Object,
  assetsState: ?string,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: string,
  assetsLayout: string,
  updateAssets: Function,
  startAssetsSearch: Function,
  searchAssets: Function,
  resetSearchAssetsResult: Function,
  assetsSearchResults: Asset[],
  assetsSearchState: string,
  addAsset: Function,
  removeAsset: Function,
  deploySmartWallet: Function,
  badges: Badges,
  accounts: Accounts,
  smartWalletState: Object,
  smartWalletFeatureEnabled: boolean,
  logScreenView: (view: string, screen: string) => void,
}

type State = {
  forceHideRemoval: boolean,
  query: string,
  activeTab: string,
}

const genericToken = require('assets/images/tokens/genericToken.png');

const MIN_QUERY_LENGTH = 2;

const horizontalPadding = (layout, side) => {
  switch (layout) {
    case EXTRASMALL: {
      return spacing.rhythm - (spacing.rhythm / 4);
    }
    case MINIMIZED: {
      return spacing.rhythm - (spacing.rhythm / 4);
    }
    // case SIMPLIFIED: {
    //   if (Platform.OS === 'android') return 10;
    //   return side === 'left' ? 0 : spacing.rhythm - 9;
    // }
    default: {
      // if (Platform.OS === 'android') return 10;
      // return 0;
      return side === 'left' ? 0 : 10;
    }
  }
};

const TokensWrapper = styled(Wrapper)`
   flex: 1;
   height: 100%;
   padding-top: ${spacing.large}px;
   background-color: ${UIColors.defaultBackgroundColor};
`;

const SearchSpinner = styled(Wrapper)`
  padding-top: 20;
`;

const EmptyStateWrapper = styled(Wrapper)`
  padding-top: 90px;
  padding-bottom: 90px;
  align-items: center;
`;

const MessageTitle = styled(BoldText)`
  font-size: ${fontSizes.large}px;
  text-align: center;
`;

const Message = styled(BaseText)`
  padding-top: 20px;
  font-size: ${fontSizes.extraSmall}px;
  color: ${baseColors.darkGray};
  text-align: center;
`;

const ListWrapper = styled.View`
  position: relative;
  flex: 1;
`;

class AssetsScreen extends React.Component<Props, State> {
  didBlur: NavigationEventSubscription;
  willFocus: NavigationEventSubscription;

  constructor(props: Props) {
    super(props);
    this.state = {
      forceHideRemoval: false,
      query: '',
      activeTab: TOKENS,
    };
    this.doAssetsSearch = debounce(this.doAssetsSearch, 500);
  }

  static defaultProps = {
    assetsLayout: SIMPLIFIED,
  };

  componentDidMount() {
    const {
      fetchInitialAssets,
      assets,
      navigation,
      logScreenView,
    } = this.props;

    logScreenView('View assets list', 'Assets');

    if (!Object.keys(assets).length) {
      fetchInitialAssets();
    }

    this.willFocus = navigation.addListener(
      'willFocus',
      () => { this.setState({ forceHideRemoval: false }); },
    );

    this.didBlur = navigation.addListener(
      'didBlur',
      () => { this.setState({ forceHideRemoval: true }); },
    );
  }

  componentWillUnmount() {
    this.didBlur.remove();
    this.willFocus.remove();
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    return !isEq;
  }

  updateHideRemoval = (value: boolean) => {
    this.setState({ forceHideRemoval: value });
  };

  handleSearchChange = (query: string) => {
    const formattedQuery = !query ? '' : query.trim();

    this.setState({ query: formattedQuery });

    if (this.state.activeTab === TOKENS) {
      this.props.startAssetsSearch();
      this.doAssetsSearch(formattedQuery);
    }
  };

  doAssetsSearch = (query: string) => {
    const { searchAssets, resetSearchAssetsResult } = this.props;
    if (query.length < MIN_QUERY_LENGTH) {
      resetSearchAssetsResult();
      return;
    }
    searchAssets(query);
  };

  handleAssetToggle = (asset: Asset, added: Boolean) => {
    if (!added) {
      this.addTokenToWallet(asset);
    } else {
      this.hideTokenFromWallet(asset);
    }
  };

  handleAssetRemoval = (asset: Asset) => () => {
    const { assets, updateAssets } = this.props;
    const isETH = asset.symbol === ETH;

    if (isETH) {
      this.showETHRemovalNotification();
      return;
    }

    Alert.alert(
      'Are you sure?',
      `This will hide ${asset.name} from your wallet`,
      [
        { text: 'Cancel', onPress: () => this.setState({ forceHideRemoval: true }), style: 'cancel' },
        { text: 'Hide', onPress: () => { this.hideTokenFromWallet(asset); updateAssets(assets, [asset.symbol]); } },
      ],
    );
  };

  showETHRemovalNotification = () => {
    Toast.show({
      message: 'Ethereum is essential for Pillar',
      type: 'info',
      title: 'This asset cannot be switched off',
    });
  };

  renderFoundTokensList() {
    const {
      assets,
      assetsSearchResults,
    } = this.props;
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
      const fullIconUrl = `${SDK_PROVIDER}/${iconUrl}?size=3`;

      return (
        <ListItemWithImage
          label={name}
          subtext={symbol}
          itemImageUrl={fullIconUrl}
          fallbackSource={genericToken}
          small
        >
          <Switch
            onValueChange={() => this.handleAssetToggle(asset, isAdded)}
            value={!!isAdded}
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
        }}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
        ListEmptyComponent={
          <EmptyStateWrapper fullScreen>
            <EmptyStateParagraph
              title="Token not found"
              bodyText="Check if the name was entered correctly or add custom token"
            />
          </EmptyStateWrapper>
        }
        onScroll={() => Keyboard.dismiss()}
      />
    );
  }

  addTokenToWallet = (asset: Asset) => {
    const { addAsset } = this.props;

    addAsset(asset);
    Toast.show({
      title: null,
      message: `${asset.name} (${asset.symbol}) has been added`,
      type: 'info',
      autoClose: true,
    });
  };

  hideTokenFromWallet = (asset: Asset) => {
    const {
      removeAsset,
    } = this.props;

    if (asset.symbol === ETH) {
      this.showETHRemovalNotification();
      return;
    }

    removeAsset(asset);
    Toast.show({
      title: null,
      message: `${asset.name} (${asset.symbol}) has been hidden`,
      type: 'info',
      autoClose: true,
    });
  };

  setActiveTab = (activeTab) => {
    const { logScreenView } = this.props;
    logScreenView(`View tab Assets.${activeTab}`, 'Assets');

    this.setState({ activeTab });
  };

  renderBlockedScreen({ title, message }) {
    const { smartWalletState, deploySmartWallet } = this.props;
    let showSpinner = true;
    let showRetryDeploymentButton = false;

    const deploymentData = get(smartWalletState, 'upgrade.deploymentData', {});
    if (deploymentData.error) {
      showSpinner = false;
      showRetryDeploymentButton = true;
      title = 'Smart Wallet deployment failed';
      message = deploymentData.error === SMART_WALLET_DEPLOYMENT_ERRORS.INSUFFICIENT_FUNDS
        ? 'You need to top up your Smart Account first'
        : 'There was an error on our server. Please try to re-deploy the account by clicking the button bellow';
    }

    return (
      <Wrapper flex={1} regularPadding center>
        <MessageTitle>{ title }</MessageTitle>
        <Message>{ message }</Message>
        <Wrapper style={{ marginTop: 20, width: '100%', alignItems: 'center' }}>
          {showSpinner && <Spinner />}
          {showRetryDeploymentButton && <Button
            marginTop="20px"
            height={52}
            title="Retry"
            onPress={() => deploySmartWallet()}
          />}
        </Wrapper>
      </Wrapper>
    );
  }

  render() {
    const {
      assets,
      assetsState,
      fetchInitialAssets,
      assetsSearchState,
      navigation,
      collectibles,
      badges,
      accounts,
      smartWalletState,
      smartWalletFeatureEnabled,
    } = this.props;
    const { query, activeTab, forceHideRemoval } = this.state;

    if (!Object.keys(assets).length && assetsState === FETCHED) {
      return (
        <Container center inset={{ bottom: 0 }}>
          <BaseText style={{ marginBottom: 20 }}>Loading default assets</BaseText>
          {assetsState !== FETCH_INITIAL_FAILED && (
            <Spinner />
          )}
          {assetsState === FETCH_INITIAL_FAILED && (
            <Button title="Try again" onPress={() => fetchInitialAssets()} />
          )}
        </Container>
      );
    }

    const isSearchOver = assetsSearchState === FETCHED;
    const isSearching = assetsSearchState === FETCHING && query.length >= MIN_QUERY_LENGTH;
    const inSearchMode = (query.length >= MIN_QUERY_LENGTH && !!assetsSearchState);
    const isInCollectiblesSearchMode = (query && query.length >= MIN_QUERY_LENGTH) && activeTab === COLLECTIBLES;

    const assetsTabs = [
      {
        id: TOKENS,
        name: 'Tokens',
        onPress: () => this.setActiveTab(TOKENS),
      },
      {
        id: COLLECTIBLES,
        name: 'Collectibles',
        onPress: () => this.setActiveTab(COLLECTIBLES),
      },
    ];

    const filteredCollectibles = isInCollectiblesSearchMode
      ? collectibles.filter(({ name }) => name.toUpperCase().includes(query.toUpperCase()))
      : collectibles;

    const filteredBadges = isInCollectiblesSearchMode
      ? badges.filter(({ name = '' }) => name.toUpperCase().includes(query.toUpperCase()))
      : badges;

    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    const sendingBlockedMessage = smartWalletStatus.sendingBlockedMessage || {};
    const blockAssetsView = !!Object.keys(sendingBlockedMessage).length
      && smartWalletStatus.status !== SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED;

    const isSmartWallet = smartWalletStatus.hasAccount;

    return (
      <Container inset={{ bottom: 0 }} color={baseColors.white}>
        <SearchBlock
          headerProps={{
            title: 'assets',
            headerRightAddon: smartWalletFeatureEnabled && <HeaderButtonsForSmartWallet
              isSmartWallet={isSmartWallet}
              navigation={navigation}
            />,
            headerRightFlex: 2,
          }}
          headerRightFlex={4}
          hideSearch={blockAssetsView}
          searchInputPlaceholder={activeTab === TOKENS ? 'Search or add new asset' : 'Search'}
          onSearchChange={(q) => this.handleSearchChange(q)}
          itemSearchState={activeTab === TOKENS ? !!assetsSearchState : !!isInCollectiblesSearchMode}
          navigation={navigation}
          white
        />
        {blockAssetsView && this.renderBlockedScreen(sendingBlockedMessage)}
        {!blockAssetsView && (
          <TokensWrapper>
            {inSearchMode && isSearchOver &&
            <Wrapper>
              {this.renderFoundTokensList()}
            </Wrapper>
            }
            {isSearching &&
            <SearchSpinner center>
              <Spinner />
            </SearchSpinner>
            }
            {!inSearchMode &&
            <ListWrapper>
              {!isInCollectiblesSearchMode &&
              <Tabs
                initialActiveTab={activeTab}
                tabs={assetsTabs}
                isFloating
              />}
              {activeTab === TOKENS && (
                <AssetsList
                  navigation={navigation}
                  onHideTokenFromWallet={this.handleAssetRemoval}
                  horizontalPadding={horizontalPadding}
                  forceHideRemoval={forceHideRemoval}
                  updateHideRemoval={this.updateHideRemoval}
                />
              )}
              {activeTab === COLLECTIBLES && (
                <CollectiblesList
                  collectibles={filteredCollectibles}
                  badges={filteredBadges}
                  searchQuery={query}
                  navigation={navigation}
                  horizontalPadding={horizontalPadding}
                  updateHideRemoval={this.updateHideRemoval}
                />)}
            </ListWrapper>}
          </TokensWrapper>
        )}
      </Container>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
  wallet: { data: wallet },
  assets: {
    data: assets,
    assetsState,
    assetsSearchState,
    assetsSearchResults,
  },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency, appearanceSettings: { assetsLayout } } },
  badges: { data: badges },
  smartWallet: smartWalletState,
  featureFlags: { data: { SMART_WALLET_ENABLED: smartWalletFeatureEnabled } },
}) => ({
  wallet,
  accounts,
  assets,
  assetsState,
  assetsSearchState,
  assetsSearchResults,
  rates,
  baseFiatCurrency,
  assetsLayout,
  badges,
  smartWalletState,
  smartWalletFeatureEnabled,
});

const structuredSelector = createStructuredSelector({
  collectibles: accountCollectiblesSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchInitialAssets: () => dispatch(fetchInitialAssetsAction()),
  updateAssets: (assets: Assets, assetsToExclude: string[]) => dispatch(updateAssetsAction(assets, assetsToExclude)),
  startAssetsSearch: () => dispatch(startAssetsSearchAction()),
  searchAssets: (query: string) => dispatch(searchAssetsAction(query)),
  resetSearchAssetsResult: () => dispatch(resetSearchAssetsResultAction()),
  addAsset: (asset: Asset) => dispatch(addAssetAction(asset)),
  removeAsset: (asset: Asset) => dispatch(removeAssetAction(asset)),
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
  deploySmartWallet: () => dispatch(deploySmartWalletAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(AssetsScreen);
