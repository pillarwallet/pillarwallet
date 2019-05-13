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
import { utils } from 'ethers';
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
import { BaseText } from 'components/Typography';
import { baseColors, fontSizes } from 'utils/variables';
import { TOKENS, COLLECTIBLES } from 'constants/assetsConstants';
import { EDIT_ASSET_AMOUNT_TO_TRANSFER, UPGRADE_REVIEW } from 'constants/navigationConstants';
import { connect } from 'react-redux';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';
import {
  addAssetsToSmartWalletUpgradeAction,
  addCollectiblesToSmartWalletUpgradeAction,
} from 'actions/smartWalletActions';
import { fetchGasInfoAction } from 'actions/historyActions';
import { formatAmount } from 'utils/common';
import { getBalance } from 'utils/assets';
import assetsConfig from 'configs/assetsConfig';
import { accountBalancesSelector } from 'selectors/balances';
import { accountCollectiblesSelector } from 'selectors/collectibles';
import type { AssetTransfer, Assets, Balances } from 'models/Asset';
import type { Collectible, CollectibleTransfer } from 'models/Collectible';
import type { GasInfo } from 'models/GasInfo';

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
  fetchGasInfo: Function,
  gasInfo: GasInfo,
  session: Object,
};

type State = {
  query: string,
  assetsToTransfer: AssetTransfer[],
  collectiblesToTransfer: CollectibleTransfer[],
  activeTab: string,
};

const FooterInner = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
`;

const TopWrapper = styled.View`
  padding-bottom: 10px;
  border-bottom-width: 1px;
  border-bottom-color: #ededed;
  background-color: ${baseColors.white};
`;

const Label = styled(BaseText)`
  font-size: ${fontSizes.extraExtraSmall}px;
  color: #999999;
`;

const GAS_LIMIT = 500000;
const genericToken = require('assets/images/tokens/genericToken.png');

class ChooseAssetsScreen extends React.Component<Props, State> {
  state = {
    query: '',
    assetsToTransfer: [],
    collectiblesToTransfer: [],
    activeTab: TOKENS,
  };

  componentDidMount() {
    this.props.fetchGasInfo();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.session.isOnline !== this.props.session.isOnline && this.props.session.isOnline) {
      this.props.fetchGasInfo();
    }
  }

  handleSearchChange = (query: any) => {
    this.setState({ query });
  };

  toggleAssetInTransferList = (name: string, amount: number) => {
    const { assetsToTransfer } = this.state;
    // toggle asset in array
    const updated = assetsToTransfer.filter(asset => asset.name !== name);
    if (!assetsToTransfer.find((asset => asset.name === name))) {
      updated.push({ name, amount });
    }
    this.setState({ assetsToTransfer: updated });
  };

  toggleCollectiblesInTransferList = (name: string) => {
    const { collectiblesToTransfer } = this.state;
    // toggle asset in array
    const updated = collectiblesToTransfer.filter(asset => asset.name !== name);
    if (!collectiblesToTransfer.find((asset => asset.name === name))) {
      updated.push({ name });
    }
    this.setState({ collectiblesToTransfer: updated });
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
        onPress={() => this.toggleAssetInTransferList(item.name, item.amount)}
        customAddon={
          <Checkbox
            onPress={() => this.toggleAssetInTransferList(item.name, item.amount)}
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
        onPress={() => this.toggleCollectiblesInTransferList(item.name)}
        customAddon={
          <Checkbox
            onPress={() => this.toggleCollectiblesInTransferList(item.name)}
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
    navigation.navigate(UPGRADE_REVIEW);
  };

  render() {
    const {
      navigation,
      assets,
      balances,
      addedAssets,
      gasInfo,
    } = this.props;
    const {
      query,
      activeTab,
      assetsToTransfer,
      collectiblesToTransfer,
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

    const hasAssetsSelected = !!assetsToTransfer.length;
    const gasPrice = gasInfo.gasPrice.avg || 0;
    const gasPriceWei = utils.parseUnits(gasPrice.toString(), 'gwei').mul(GAS_LIMIT);
    const assetsTransferFee = formatAmount(utils.formatEther(
      gasPriceWei * (assetsToTransfer.length + collectiblesToTransfer.length)),
    );

    return (
      <Container>
        <TopWrapper>
          <SearchBlock
            headerProps={{
              title: 'choose assets',
              onBack: () => navigation.goBack(null),
              nextText: !hasAssetsSelected || 'Edit',
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
        <Footer>
          {hasAssetsSelected &&
          <FooterInner style={{ alignItems: 'center' }}>
            <Label>{`Fee ${assetsTransferFee} ETH`}</Label>
            <Button
              small
              title="Next"
              onPress={this.onNextPress}
            />
          </FooterInner>}
        </Footer>
      </Container>
    );
  }
}

const mapStateToProps = ({
  assets: { data: assets },
  smartWallet: { upgrade: { transfer: { assets: addedAssets } } },
  session: { data: session },
  history: { gasInfo },
}) => ({
  assets,
  addedAssets,
  session,
  gasInfo,
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
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(ChooseAssetsScreen);
