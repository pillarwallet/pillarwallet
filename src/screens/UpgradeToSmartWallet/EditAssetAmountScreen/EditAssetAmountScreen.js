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
import { formatAmount } from 'utils/common';
import { getBalance } from 'utils/assets';
import assetsConfig from 'configs/assetsConfig';
import type { Assets, Balances } from 'models/Asset';

type Props = {
  navigation: NavigationScreenProp<*>,
  fetchAssetsBalances: (assets: Assets) => Function,
  assets: Assets,
  balances: Balances,
  navigation: NavigationScreenProp<*>,
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
              value={this.state.amounts[item.name]}
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
    const { assets, fetchAssetsBalances } = this.props;
    fetchAssetsBalances(assets);
  };

  render() {
    const { navigation, assets, balances } = this.props;
    const { query } = this.state;
    const assetsArray = Object.values(assets);
    const nonEmptyAssets = assetsArray.filter((asset: any) => {
      return getBalance(balances, asset.symbol) !== 0;
    });

    const filteredNonEmptyAssets = (!query || query.trim() === '' || query.length < 2)
      ? nonEmptyAssets
      : nonEmptyAssets.filter((asset: any) => asset.name.toUpperCase().includes(query.toUpperCase()));

    return (
      <Container>
        <TopWrapper>
          <SearchBlock
            headerProps={{
              title: 'edit amount',
              onBack: () => navigation.goBack(null),
              nextText: 'Save',
              onNextPress: () => { navigation.goBack(); },
            }}
            searchInputPlaceholder="Search asset"
            onSearchChange={(q) => this.handleSearchChange(q)}
            itemSearchState={query.length >= 2}
            navigation={navigation}
            backgroundColor={baseColors.white}
          />
        </TopWrapper>
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
  assets: { data: assets, balances },
}) => ({
  assets,
  balances,
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchAssetsBalances: (assets) => dispatch(fetchAssetsBalancesAction(assets)),
});


export default connect(mapStateToProps, mapDispatchToProps)(EditAssetAmountScreen);

