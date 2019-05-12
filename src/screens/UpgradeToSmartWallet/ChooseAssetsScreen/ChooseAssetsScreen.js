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
import { FlatList, Keyboard } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { SDK_PROVIDER } from 'react-native-dotenv';
import { createStructuredSelector } from 'reselect';

import { Container, Footer, Wrapper } from 'components/Layout';
import SearchBlock from 'components/SearchBlock';
import Separator from 'components/Separator';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Checkbox from 'components/Checkbox';
import Button from 'components/Button';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Tabs from 'components/Tabs';
import { baseColors } from 'utils/variables';
import { TOKENS, COLLECTIBLES } from 'constants/assetsConstants';
import { EDIT_ASSET_AMOUNT_TO_TRANSFER, UPGRADE_CONFIRM } from 'constants/navigationConstants';
import { connect } from 'react-redux';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';
import {
  addAssetsToSmartWalletUpgradeAction,
  addCollectiblesToSmartWalletUpgradeAction,
} from 'actions/smartWalletActions';
import { formatAmount } from 'utils/common';
import { getBalance } from 'utils/assets';
import assetsConfig from 'configs/assetsConfig';
import type { AssetTransfer, Assets, Balances } from 'models/Asset';
import type { Collectible, CollectibleTransfer } from 'models/Collectible';
import { accountBalancesSelector } from 'selectors/balances';
import { accountCollectiblesSelector } from 'selectors/collectibles';

type Props = {
  navigation: NavigationScreenProp<*>,
  fetchAssetsBalances: (assets: Assets) => Function,
  assets: Assets,
  balances: Balances,
  fetchAllCollectiblesData: Function,
  collectibles: Collectible[],
  addAssetsToSmartWallet: Function,
  addCollectiblesToSmartWallet: Function,
  addedAssets: AssetTransfer[],
};

type State = {
  query: string,
  assetsToTransfer: AssetTransfer[],
  collectiblesToTransfer: CollectibleTransfer[],
  activeTab: string,
};

const FooterInner = styled.View`
  background-color: ${baseColors.snowWhite};
  flex-direction: row;
  justify-content: flex-end;
  align-items: flex-start;
`;

const TopWrapper = styled.View`
  padding-bottom: 10px;
  border-bottom-width: 1px;
  border-bottom-color: #ededed;
  background-color: ${baseColors.white};
`;

const genericToken = require('assets/images/tokens/genericToken.png');

class ChooseAssetsScreen extends React.Component<Props, State> {
  state = {
    query: '',
    assetsToTransfer: [],
    collectiblesToTransfer: [],
    activeTab: TOKENS,
  };

  handleSearchChange = (query: any) => {
    this.setState({ query });
  };

  addAssetToTransferList = (name: string, amount: number) => {
    const { assetsToTransfer } = this.state;
    if (!assetsToTransfer.find(asset => asset.name === name)) {
      assetsToTransfer.push({ name, amount });
      this.setState({ assetsToTransfer });
    }
  };

  addCollectibleToTransferList = (name: string) => {
    const { collectiblesToTransfer } = this.state;
    if (!collectiblesToTransfer.find(collectible => collectible.name === name)) {
      collectiblesToTransfer.push({ name });
      this.setState({ collectiblesToTransfer });
    }
  };

  renderAsset = ({ item }) => {
    const { assetsToTransfer } = this.state;
    const fullIconUrl = `${SDK_PROVIDER}/${item.iconUrl}?size=3`;
    const assetShouldRender = assetsConfig[item.symbol] && !assetsConfig[item.symbol].send;
    if (assetShouldRender) {
      return null;
    }
    const formattedAmount = formatAmount(item.amount);
    return (
      <ListItemWithImage
        label={item.name}
        itemImageUrl={fullIconUrl || genericToken}
        itemValue={`${formattedAmount} ${item.symbol}`}
        fallbackSource={genericToken}
        onPress={() => this.addAssetToTransferList(item.name, item.amount)}
        customAddon={
          <Checkbox
            onPress={() => this.addAssetToTransferList(item.name, item.amount)}
            checked={!!assetsToTransfer.find(asset => asset.name === item.name)}
            rounded
            wrapperStyle={{ width: 24, marginRight: 4, marginLeft: 12 }}
          />
        }
        rightColumnInnerStyle={{ flexDirection: 'row' }}
      />
    );
  };

  renderCollectible = ({ item }) => {
    const { collectiblesToTransfer } = this.state;
    return (
      <ListItemWithImage
        label={item.name}
        itemImageUrl={item.icon || genericToken}
        fallbackSource={genericToken}
        onPress={() => this.addCollectibleToTransferList(item.name)}
        customAddon={
          <Checkbox
            onPress={() => this.addCollectibleToTransferList(item.name)}
            checked={collectiblesToTransfer.includes(item.name)}
            rounded
            wrapperStyle={{ width: 24, marginRight: 4 }}
          />
        }
      />
    );
  };

  refreshAssetsList = () => {
    const { assets, fetchAssetsBalances } = this.props;
    fetchAssetsBalances(assets);
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
      const addedAsset = addedAssets
        .find(addedAssetCheck => addedAssetCheck.name === asset.name);
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

  onNextPress = async () => {
    const { navigation } = this.props;
    await this.updateAssetsAndCollectiblesToTransfer();
    navigation.navigate(UPGRADE_CONFIRM);
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
      assetsToTransfer,
    } = this.state;
    const assetsArray = Object.values(assets);
    const nonEmptyAssets = assetsArray
      .map((asset: any) => {
        const assetsTransferAmount = addedAssets
          .find(addedAsset => addedAsset.name === asset.name);

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

    return (
      <Container>
        <TopWrapper>
          <SearchBlock
            headerProps={{
              title: 'choose assets',
              onBack: () => navigation.goBack(null),
              nextText: assetsToTransfer.length ? 'Edit' : null,
              onNextPress: this.onEditPress,
            }}
            searchInputPlaceholder="Search asset"
            onSearchChange={this.handleSearchChange}
            itemSearchState={query.length >= 2}
            navigation={navigation}
            backgroundColor={baseColors.white}
          />
          <Tabs initialActiveTab={activeTab} tabs={assetsTabs} bgColor={baseColors.white} />
        </TopWrapper>
        {activeTab === TOKENS && this.renderAssets(nonEmptyAssets)}
        {activeTab === COLLECTIBLES && this.renderCollectibles()}
        <Footer style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <FooterInner>
            {
              // TODO: add right amount of contacts selected to activate this button
            }
            <Button
              small
              title="Next"
              onPress={this.onNextPress}
              disabled={false}
            />
          </FooterInner>
        </Footer>
      </Container>
    );
  }
}

const mapStateToProps = ({
  assets: { data: assets },
  smartWallet: { upgrade: { transfer: { assets: addedAssets } } },
}) => ({
  assets,
  addedAssets,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  collectibles: accountCollectiblesSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchAssetsBalances: (assets) => dispatch(fetchAssetsBalancesAction(assets)),
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction()),
  addAssetsToSmartWallet: assets => dispatch(
    addAssetsToSmartWalletUpgradeAction(assets),
  ),
  addCollectiblesToSmartWallet: collectibles => dispatch(
    addCollectiblesToSmartWalletUpgradeAction(collectibles),
  ),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(ChooseAssetsScreen);
