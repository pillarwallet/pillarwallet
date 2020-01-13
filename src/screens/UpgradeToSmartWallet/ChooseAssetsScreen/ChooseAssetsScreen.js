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
import { FlatList, Keyboard, ScrollView, View } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { SDK_PROVIDER } from 'react-native-dotenv';
import { createStructuredSelector } from 'reselect';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Footer, Wrapper } from 'components/Layout';
import SearchBlock from 'components/SearchBlock';
import Separator from 'components/Separator';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Checkbox from 'components/Checkbox';
import Button from 'components/Button';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Tabs from 'components/Tabs';
import Toast from 'components/Toast';
import { spacing } from 'utils/variables';
import { TOKENS, COLLECTIBLES } from 'constants/assetsConstants';
import { EDIT_ASSET_AMOUNT_TO_TRANSFER, UPGRADE_REVIEW } from 'constants/navigationConstants';
import { connect } from 'react-redux';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';
import {
  addAssetsToSmartWalletUpgradeAction,
  addCollectiblesToSmartWalletUpgradeAction,
} from 'actions/smartWalletActions';
import { formatAmount } from 'utils/common';
import { getAssetsAsList, getBalance } from 'utils/assets';
import assetsConfig from 'configs/assetsConfig';
import { accountBalancesSelector } from 'selectors/balances';
import { accountCollectiblesSelector } from 'selectors/collectibles';
import type { AssetTransfer, Assets, Balances } from 'models/Asset';
import type { Collectible, CollectibleTransfer } from 'models/Collectible';
import { accountAssetsSelector } from 'selectors/assets';

type Props = {
  navigation: NavigationScreenProp<*>,
  fetchAssetsBalances: () => Function,
  assets: Assets,
  balances: Balances,
  fetchAllCollectiblesData: Function,
  collectibles: Collectible[],
  addAssetsToSmartWallet: Function,
  addCollectiblesToSmartWallet: Function,
  addedAssets: AssetTransfer[],
  session: Object,
};

type State = {
  query: string,
  assetsToTransfer: AssetTransfer[],
  collectiblesToTransfer: CollectibleTransfer[],
  activeTab: string,
  disableScroll: boolean,
};

const FooterInner = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
`;

const genericToken = require('assets/images/tokens/genericToken.png');

class ChooseAssetsScreen extends React.Component<Props, State> {
  state = {
    query: '',
    assetsToTransfer: [],
    collectiblesToTransfer: [],
    activeTab: TOKENS,
    disableScroll: false,
  };

  handleSearchChange = (query: any) => {
    this.setState({ query });
  };

  toggleAssetInTransferList = (name: string, amount: number) => {
    const { assetsToTransfer } = this.state;
    // toggle asset in array
    const updated = assetsToTransfer.filter(asset => asset.name !== name);
    if (!assetsToTransfer.find(asset => asset.name === name)) {
      updated.push({ name, amount });
    }
    this.setState({ assetsToTransfer: updated });
  };

  toggleCollectiblesInTransferList = (key: string) => {
    const { collectiblesToTransfer } = this.state;
    // toggle asset in array
    const updated = collectiblesToTransfer.filter(asset => asset.key !== key);
    if (!collectiblesToTransfer.find(asset => asset.key === key)) {
      updated.push({ key });
    }
    this.setState({ collectiblesToTransfer: updated });
  };

  renderAsset = ({ item }) => {
    const assetShouldRender = assetsConfig[item.symbol] && !assetsConfig[item.symbol].send;
    if (assetShouldRender) {
      return null;
    }
    const { assetsToTransfer } = this.state;
    const fullIconUrl = `${SDK_PROVIDER}/${item.iconUrl}?size=3`;
    const formattedAmount = formatAmount(item.amount);
    return (
      <ListItemWithImage
        label={item.name}
        itemImageUrl={fullIconUrl || genericToken}
        itemValue={`${formattedAmount} ${item.symbol}`}
        fallbackSource={genericToken}
        onPress={() => this.toggleAssetInTransferList(item.name, item.amount)}
        customAddon={
          <View style={{
            position: 'absolute',
            right: 0,
            top: 0,
            height: '100%',
            justifyContent: 'center',
          }}
          >
            <Checkbox
              onPress={() => this.toggleAssetInTransferList(item.name, item.amount)}
              checked={!!assetsToTransfer.find(asset => asset.name === item.name)}
              rounded
              wrapperStyle={{ width: 24, marginLeft: 12 }}
            />
          </View>
        }
        rightColumnInnerStyle={{ flexDirection: 'row', paddingRight: 40 }}
      />
    );
  };

  renderCollectible = ({ item }) => {
    const { collectiblesToTransfer } = this.state;
    const collectibleKey = `${item.assetContract}${item.name}`;
    return (
      <ListItemWithImage
        label={item.name}
        itemImageUrl={item.icon || genericToken}
        fallbackSource={genericToken}
        onPress={() => this.toggleCollectiblesInTransferList(collectibleKey)}
        customAddon={
          <Checkbox
            onPress={() => this.toggleCollectiblesInTransferList(collectibleKey)}
            checked={!!collectiblesToTransfer.find(asset => asset.key === collectibleKey)}
            rounded
            wrapperStyle={{ width: 24, marginRight: 4 }}
          />
        }
      />
    );
  };

  refreshAssetsList = () => {
    const { fetchAssetsBalances } = this.props;
    fetchAssetsBalances();
  };

  setActiveTab = (activeTab) => {
    this.setState({ activeTab });
  };

  renderAssets = (nonEmptyAssets) => {
    const { query } = this.state;
    const filteredNonEmptyAssets = (!query || query.trim() === '' || query.length < 2)
      ? nonEmptyAssets
      : nonEmptyAssets.filter((asset: any) => asset.name.toUpperCase().includes(query.toUpperCase()));

    return (
      <FlatList
        keyExtractor={item => item.symbol}
        data={filteredNonEmptyAssets}
        renderItem={this.renderAsset}
        ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
        contentContainerStyle={{
          flexGrow: 1,
        }}
        refreshing={false}
        onRefresh={this.refreshAssetsList}
        onScroll={() => Keyboard.dismiss()}
        ListEmptyComponent={
          <Wrapper
            fullScreen
            style={{
              paddingTop: 90,
              paddingBottom: 90,
              alignItems: 'center',
            }}
          >
            <EmptyStateParagraph
              title="No assets found"
              bodyText={nonEmptyAssets.length
                ? 'Check if the name was entered correctly'
                : 'There are no assets in this wallet'
              }
            />
          </Wrapper>
        }
      />
    );
  };

  renderCollectibles = () => {
    const { query } = this.state;
    const { collectibles, fetchAllCollectiblesData } = this.props;
    const filteredCollectibles = (!query || query.trim() === '' || query.length < 2)
      ? collectibles
      : collectibles.filter(({ name }) => name.toUpperCase().includes(query.toUpperCase()));

    return (
      <FlatList
        keyExtractor={item => `${item.assetContract}${item.id}`}
        data={filteredCollectibles}
        renderItem={this.renderCollectible}
        ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
        contentContainerStyle={{
          flexGrow: 1,
        }}
        refreshing={false}
        onRefresh={fetchAllCollectiblesData}
        onScroll={() => Keyboard.dismiss()}
        ListEmptyComponent={
          <Wrapper
            fullScreen
            style={{
              paddingTop: 90,
              paddingBottom: 90,
              alignItems: 'center',
            }}
          >
            <EmptyStateParagraph
              title="No collectibles found"
              bodyText={collectibles.length
                ? 'Check if the name was entered correctly'
                : 'There are no collectibles in this wallet'
              }
            />
          </Wrapper>
        }
      />
    );
  };

  updateAssetsAndCollectiblesToTransfer = async () => {
    const {
      addAssetsToSmartWallet,
      addCollectiblesToSmartWallet,
      addedAssets,
    } = this.props;
    const { assetsToTransfer, collectiblesToTransfer } = this.state;
    const updatedAssetsToTransfer = assetsToTransfer.map(asset => {
      const addedAsset = addedAssets.find(addedAssetCheck => addedAssetCheck.name === asset.name);
      const amount = addedAsset ? addedAsset.amount : asset.amount;
      return { ...asset, amount };
    });
    await addAssetsToSmartWallet(updatedAssetsToTransfer);
    await addCollectiblesToSmartWallet(collectiblesToTransfer);
  };

  onEditPress = async () => {
    const { navigation } = this.props;
    await this.updateAssetsAndCollectiblesToTransfer();
    navigation.navigate(EDIT_ASSET_AMOUNT_TO_TRANSFER);
  };

  onNextPress = async (isSeparateFund) => {
    const { navigation } = this.props;
    await this.updateAssetsAndCollectiblesToTransfer();
    if (isSeparateFund) {
      // mock
      navigation.goBack(null);
      Toast.show({
        message: 'Your Smart wallet has been funded',
        type: 'success',
        title: 'Success',
        autoClose: true,
      });
    } else {
      navigation.navigate(UPGRADE_REVIEW);
    }
  };

  render() {
    const {
      navigation,
      assets,
      balances,
      addedAssets,
    } = this.props;
    const {
      query,
      activeTab,
      assetsToTransfer = [],
      collectiblesToTransfer = [],
      disableScroll,
    } = this.state;
    const assetsArray = getAssetsAsList(assets);
    const nonEmptyAssets = assetsArray
      .map((asset: any) => {
        const assetsTransferAmount = addedAssets.find(addedAsset => addedAsset.name === asset.name);

        // added/edited amount or default – all balance
        const amount = assetsTransferAmount
          ? assetsTransferAmount.amount
          : getBalance(balances, asset.symbol);

        return { ...asset, amount };
      })
      .filter(asset => asset.amount !== 0);

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

    const hasAssetsSelected = !!assetsToTransfer.length || !!collectiblesToTransfer.length;
    const options = navigation.getParam('options', { isSeparateRecovery: false });
    // NOTE: we can come to this page later when we decide to transfer assets to the existing smart wallet
    const { isSeparateFund } = options;

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: 'Choose assets to transfer' }],
          rightItems: [hasAssetsSelected ? { link: 'Edit', onPress: this.onEditPress } : {}],
        }}
      >
        <ScrollView
          stickyHeaderIndices={[1]}
          scrollEnabled={!disableScroll}
        >
          <SearchBlock
            searchInputPlaceholder="Search asset"
            onSearchChange={this.handleSearchChange}
            itemSearchState={query.length >= 2}
            navigation={navigation}
            wrapperStyle={{ paddingHorizontal: spacing.large, paddingVertical: spacing.mediumLarge }}
            onSearchFocus={() => this.setState({ disableScroll: true })}
            onSearchBlur={() => this.setState({ disableScroll: false })}
          />
          <Tabs tabs={assetsTabs} activeTab={activeTab} />
          {activeTab === TOKENS && this.renderAssets(nonEmptyAssets)}
          {activeTab === COLLECTIBLES && this.renderCollectibles()}
        </ScrollView>
        {!!hasAssetsSelected &&
        <Footer>
          {!isSeparateFund &&
          <FooterInner>
            <Button
              style={{ marginLeft: 'auto' }}
              small
              title="Next"
              onPress={() => this.onNextPress()}
            />
          </FooterInner>}
          {!!isSeparateFund &&
          <FooterInner style={{ alignItems: 'center', flexDirection: 'column', justifyContent: 'center' }}>
            <Button
              title="Fund wallet"
              onPress={() => this.onNextPress(true)}
              style={{ marginBottom: 10 }}
            />
          </FooterInner>
          }
        </Footer>}
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  smartWallet: { upgrade: { transfer: { assets: addedAssets } } },
  session: { data: session },
}) => ({
  addedAssets,
  session,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  collectibles: accountCollectiblesSelector,
  assets: accountAssetsSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchAssetsBalances: () => dispatch(fetchAssetsBalancesAction()),
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction()),
  addAssetsToSmartWallet: assets => dispatch(
    addAssetsToSmartWalletUpgradeAction(assets),
  ),
  addCollectiblesToSmartWallet: collectibles => dispatch(
    addCollectiblesToSmartWalletUpgradeAction(collectibles),
  ),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(ChooseAssetsScreen);
