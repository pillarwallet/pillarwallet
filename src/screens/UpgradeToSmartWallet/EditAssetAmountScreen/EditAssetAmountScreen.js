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
import { FlatList, Keyboard, TextInput, View } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { SDK_PROVIDER } from 'react-native-dotenv';
import { Container, Wrapper } from 'components/Layout';
import SearchBlock from 'components/SearchBlock';
import Separator from 'components/Separator';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import { BaseText } from 'components/Typography';
import { baseColors, fontSizes, spacing } from 'utils/variables';
import { connect } from 'react-redux';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { addAssetsToSmartWalletUpgradeAction } from 'actions/smartWalletActions';
import { formatAmount } from 'utils/common';
import { getBalance } from 'utils/assets';
import assetsConfig from 'configs/assetsConfig';
import type { AssetTransfer, Assets, Balances } from 'models/Asset';

type Props = {
  navigation: NavigationScreenProp<*>,
  fetchAssetsBalances: (assets: Assets) => Function,
  addedAssets: AssetTransfer[],
  allAssets: Assets,
  balances: Balances,
  navigation: NavigationScreenProp<*>,
  addAssetsToSmartWallet: Function,
};

type State = {
  query: string,
  amounts: Object,
};

const TopWrapper = styled.View`
  padding-bottom: 10px;
  border-bottom-width: 1px;
  border-bottom-color: #ededed;
  background-color: ${baseColors.white};
`;

const ErrorHolder = styled.View`
  width: 100%;
  justify-content: flex-end;
  align-items: flex-end;
  padding: 0 ${spacing.mediumLarge}px;
`;

const ErrorText = styled(BaseText)`
  color: ${baseColors.fireEngineRed};
  font-size: ${fontSizes.small}px;
  width: 100%;
  text-align: right;
`;

const genericToken = require('assets/images/tokens/genericToken.png');

class EditAssetAmountScreen extends React.Component<Props, State> {
  state = {
    query: '',
    amounts: {},
  };

  constructor(props) {
    super(props);
    const { addedAssets } = this.props;
    const amounts = {};
    addedAssets.forEach(asset => { amounts[asset.name] = asset.amount; });
    this.state = { ...this.state, amounts };
  }

  handleSearchChange = (query: any) => {
    this.setState({ query });
  };

  renderAsset = ({ item }) => {
    const { balances } = this.props;
    const assetBalance = formatAmount(getBalance(balances, item.symbol));
    const fullIconUrl = `${SDK_PROVIDER}/${item.iconUrl}?size=3`;
    const assetShouldRender = assetsConfig[item.symbol] && !assetsConfig[item.symbol].send;
    if (assetShouldRender) {
      return null;
    }
    const amountValue = this.state.amounts[item.name] || item.amount;
    return (
      <ListItemWithImage
        label={item.name}
        itemImageUrl={fullIconUrl || genericToken}
        fallbackSource={genericToken}
        rightColumnInnerStyle={{ flex: 1, justifyContent: 'center' }}
        customAddon={
          <View style={{ height: 70, justifyContent: 'center', minWidth: 180 }}>
            <TextInput
              style={{ fontSize: fontSizes.medium, textAlign: 'right', maxWidth: 200 }}
              onChangeText={(text) => this.setState({
                amounts: {
                  ...this.state.amounts,
                  [item.name]: text,
                },
              })}
              value={amountValue ? formatAmount(amountValue) : ''}
              placeholder={assetBalance}
              keyboardType="decimal-pad"
            />
          </View>
        }
        customAddonFullWidth={
          this.state.amounts[item.name] > assetBalance
            ? (<ErrorHolder><ErrorText>Amount should not exceed balance</ErrorText></ErrorHolder>)
            : null
        }
      />
    );
  };

  refreshAssetsList = () => {
    const { allAssets, fetchAssetsBalances } = this.props;
    fetchAssetsBalances(allAssets);
  };

  onNextPress = async () => {
    const { navigation, addedAssets, addAssetsToSmartWallet } = this.props;
    const { amounts } = this.state;
    const updatedAssets = addedAssets.map(asset => {
      const amount = amounts[asset.name] || asset.amount;
      return { ...asset, amount };
    });
    await addAssetsToSmartWallet(updatedAssets);
    navigation.goBack();
  };

  render() {
    const { navigation, allAssets, addedAssets } = this.props;
    const { query } = this.state;
    const assetsArray = Object.values(allAssets);
    const assets = assetsArray
      .filter((asset: any) => addedAssets.find((addedAsset: any) => asset.name === addedAsset.name));
    const filteredAssets = (!query || query.trim() === '' || query.length < 2)
      ? assets
      : assets.filter((asset: any) => asset.name.toUpperCase().includes(query.toUpperCase()));

    return (
      <Container>
        <TopWrapper>
          <SearchBlock
            headerProps={{
              title: 'edit amount',
              onBack: () => navigation.goBack(null),
              nextText: 'Save',
              onNextPress: this.onNextPress,
            }}
            searchInputPlaceholder="Search asset"
            onSearchChange={this.handleSearchChange}
            itemSearchState={query.length >= 2}
            navigation={navigation}
            backgroundColor={baseColors.white}
          />
        </TopWrapper>
        <FlatList
          keyExtractor={item => item.symbol}
          data={filteredAssets}
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
                bodyText="Check if the name was entered correctly"
              />
            </Wrapper>
          }
        />
      </Container>
    );
  }
}

const mapStateToProps = ({
  assets: { data: allAssets, balances },
  smartWallet: { upgrade: { transfer: { assets: addedAssets } } },
}) => ({
  allAssets,
  addedAssets,
  balances,
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchAssetsBalances: assets => dispatch(fetchAssetsBalancesAction(assets)),
  addAssetsToSmartWallet: assets => dispatch(
    addAssetsToSmartWalletUpgradeAction(assets),
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(EditAssetAmountScreen);

