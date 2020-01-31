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
import { FlatList, Keyboard, TextInput, View, ScrollView } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { SDK_PROVIDER } from 'react-native-dotenv';
import { createStructuredSelector } from 'reselect';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Wrapper } from 'components/Layout';
import SearchBlock from 'components/SearchBlock';
import Separator from 'components/Separator';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import { BaseText } from 'components/Typography';
import { fontSizes, spacing, fontStyles, appFont } from 'utils/variables';
import { connect } from 'react-redux';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { addAssetsToSmartWalletUpgradeAction } from 'actions/smartWalletActions';
import { formatAmount, parseNumber, isValidNumber } from 'utils/common';
import { getAssetsAsList, getBalance } from 'utils/assets';
import { themedColors } from 'utils/themes';
import assetsConfig from 'configs/assetsConfig';
import type { AssetTransfer, Assets, Balances } from 'models/Asset';
import { accountBalancesSelector } from 'selectors/balances';
import { accountAssetsSelector } from 'selectors/assets';

type Props = {
  navigation: NavigationScreenProp<*>,
  fetchAssetsBalances: () => Function,
  addedAssets: AssetTransfer[],
  assets: Assets,
  balances: Balances,
  navigation: NavigationScreenProp<*>,
  addAssetsToSmartWallet: Function,
};

type State = {
  query: string,
  amounts: Object,
  errors: Object,
  disableScroll: boolean,
};

const ErrorHolder = styled.View`
  width: 100%;
  justify-content: flex-end;
  align-items: flex-end;
  padding: 0 ${spacing.mediumLarge}px;
`;

const ErrorText = styled(BaseText)`
  color: ${themedColors.negative};
  ${fontStyles.medium};
  width: 100%;
  text-align: right;
`;

const genericToken = require('assets/images/tokens/genericToken.png');

class EditAssetAmountScreen extends React.Component<Props, State> {
  state = {
    query: '',
    amounts: {},
    errors: {},
    disableScroll: false,
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

  handleAmountChange = (text: string, assetName: string, balance: number, decimals: number) => {
    const amountFormatted = text.toString().replace(/,/g, '.');
    const amount = parseNumber(text);
    let errorMessage;

    if (!isValidNumber(amount.toString()) || amount.toString().split('.').length > 2) {
      errorMessage = 'Incorrect number entered.';
    } else if (amount > balance) {
      errorMessage = 'Amount should not exceed the sum of total balance';
    } else if (amount < 0) {
      errorMessage = 'Amount should be greater than 1 Wei (0.000000000000000001 ETH)';
    } else if (decimals === 0 && amount.toString().indexOf('.') > -1) {
      errorMessage = 'Amount should not contain decimal places';
    }

    this.setState({
      errors: {
        ...this.state.errors,
        [assetName]: errorMessage,
      },
      amounts: {
        ...this.state.amounts,
        [assetName]: amountFormatted,
      },
    });
  };

  renderAsset = ({ item }) => {
    const { balances } = this.props;
    const assetBalance = getBalance(balances, item.symbol);
    const formattedAssetBalance = formatAmount(assetBalance);
    const fullIconUrl = `${SDK_PROVIDER}/${item.iconUrl}?size=3`;
    const assetShouldRender = assetsConfig[item.symbol] && !assetsConfig[item.symbol].send;
    if (assetShouldRender) {
      return null;
    }
    const amount = this.state.amounts[item.name] || item.amount || '';
    const errorMessage = this.state.errors[item.name];
    return (
      <ListItemWithImage
        label={item.name}
        itemImageUrl={fullIconUrl || genericToken}
        fallbackSource={genericToken}
        rightColumnInnerStyle={{ flex: 1, justifyContent: 'center' }}
        customAddon={
          <View style={{ height: 70, justifyContent: 'center', minWidth: 180 }}>
            <TextInput
              style={{
                fontSize: fontSizes.big,
                textAlign: 'right',
                maxWidth: 200,
                fontFamily: appFont.regular,
              }}
              onChangeText={text => this.handleAmountChange(text, item.name, assetBalance, item.decimals)}
              value={amount ? amount.toString() : ''}
              placeholder={formattedAssetBalance}
              keyboardType="decimal-pad"
            />
          </View>
        }
        customAddonFullWidth={
          errorMessage && <ErrorHolder><ErrorText>{errorMessage}</ErrorText></ErrorHolder>
        }
      />
    );
  };

  refreshAssetsList = () => {
    const { fetchAssetsBalances } = this.props;
    fetchAssetsBalances();
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
    const { navigation, assets: allAssets, addedAssets } = this.props;
    const { query, errors, disableScroll } = this.state;
    const assetsArray = getAssetsAsList(allAssets);
    const assets = assetsArray
      .filter((asset: any) => addedAssets.find((addedAsset: any) => asset.name === addedAsset.name));
    const filteredAssets = (!query || query.trim() === '' || query.length < 2)
      ? assets
      : assets.filter((asset: any) => asset.name.toUpperCase().includes(query.toUpperCase()));
    const saveAvailable = Object.values(errors).filter(error => !!error).length === 0;
    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: 'Edit amount' }],
          rightItems: [saveAvailable ? { link: 'Save', onPress: this.onNextPress } : {}],
        }}
      >
        <ScrollView scrollEnabled={!disableScroll}>
          <SearchBlock
            searchInputPlaceholder="Search asset"
            onSearchChange={this.handleSearchChange}
            itemSearchState={query.length >= 2}
            navigation={navigation}
            wrapperStyle={{ paddingHorizontal: spacing.large, paddingVertical: spacing.mediumLarge }}
            onSearchFocus={() => this.setState({ disableScroll: true })}
            onSearchBlur={() => this.setState({ disableScroll: false })}
          />
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
            scrollEnabled={!disableScroll}
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
        </ScrollView>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  smartWallet: { upgrade: { transfer: { assets: addedAssets } } },
}) => ({
  addedAssets,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  assets: accountAssetsSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchAssetsBalances: () => dispatch(fetchAssetsBalancesAction()),
  addAssetsToSmartWallet: assets => dispatch(
    addAssetsToSmartWalletUpgradeAction(assets),
  ),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(EditAssetAmountScreen);
