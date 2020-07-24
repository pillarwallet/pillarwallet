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
import React, { useState } from 'react';
import { FlatList, ScrollView, RefreshControl } from 'react-native';
import styled from 'styled-components/native';
import isEmpty from 'lodash.isempty';
import { SDK_PROVIDER } from 'react-native-dotenv';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';

// actions
import {
  addKeyBasedAssetToTransferAction,
  fetchAvailableBalancesToTransferAction,
  removeKeyBasedAssetToTransferAction,
} from 'actions/keyBasedAssetTransferActions';

// constants
import { COLLECTIBLES } from 'constants/assetsConstants';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Wrapper } from 'components/Layout';
import SearchBlock from 'components/SearchBlock';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import { BaseText } from 'components/Typography';
import TextInput from 'components/Input';

// utils
import { fontSizes, spacing, fontStyles } from 'utils/variables';
import { parseNumber, isValidNumber, formatFullAmount, isValidNumberDecimals } from 'utils/common';
import { getBalance } from 'utils/assets';
import { themedColors } from 'utils/themes';

// types
import type { Balances, Asset, KeyBasedAssetTransfer } from 'models/Asset';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';


type Props = {
  navigation: NavigationScreenProp<*>,
  fetchAvailableBalancesToTransfer: () => void,
  removeKeyBasedAssetToTransfer: (asset: Asset) => void,
  addKeyBasedAssetToTransfer: (asset: Asset) => void,
  keyBasedAssetsToTransfer: KeyBasedAssetTransfer[],
  availableBalances: Balances,
  isFetchingAvailableBalances: boolean,
};

const ErrorHolder = styled.View`
  width: 100%;
  padding: 0 ${spacing.mediumLarge}px;
`;

const ErrorText = styled(BaseText)`
  color: ${themedColors.negative};
  ${fontStyles.small};
  width: 100%;
  text-align: right;
`;

const AmountInputWrapper = styled.View`
  height: 70px;
  justify-content: center;
  min-width: 180px;
`;

const AmountInput = styled(TextInput)`
  ${fontSizes.small};
  text-align: right;
  max-width: 200px;
`;

const KeyBasedAssetTransferEditAmount = ({
  keyBasedAssetsToTransfer,
  navigation,
  isFetchingAvailableBalances,
  availableBalances,
  fetchAvailableBalancesToTransfer,
  removeKeyBasedAssetToTransfer,
  addKeyBasedAssetToTransfer,
}: Props) => {
  const [inSearchMode, setInSearchMode] = useState(false);
  const [updatedAssets, setUpdatedAssets] = useState({});
  const [errorMessages, setErrorMessages] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const onAvailableBalancesRefresh = () => {
    if (isFetchingAvailableBalances) return;
    fetchAvailableBalancesToTransfer();
  };

  const handleAmountChange = (text: string, asset: Asset) => {
    const { symbol, decimals } = asset;
    const balance = getBalance(availableBalances, symbol);
    const amountFormatted = text.toString().replace(/,/g, '.');
    const amount = parseNumber(text);

    let errorMessage;
    if (!isValidNumber(text.toString())) {
      errorMessage = 'Incorrect number entered';
    } else if (amount > balance) {
      errorMessage = 'Amount should not exceed total balance';
    } else if (!isValidNumberDecimals(amount, decimals)) {
      errorMessage = 'Amount should not contain decimal places';
    }

    // resets or sets new
    setErrorMessages({ ...errorMessages, [symbol]: errorMessage });

    const updated = { ...asset, amount: amountFormatted || 0 };
    setUpdatedAssets({ ...updatedAssets, [symbol]: updated });
  };

  const renderAsset = ({ item }) => {
    const { symbol, amount, name } = item;
    const assetBalance = getBalance(availableBalances, symbol);
    const formattedAssetBalance = formatFullAmount(assetBalance);
    const fullIconUrl = `${SDK_PROVIDER}/${item.iconUrl}?size=3`;
    const displayAmount = updatedAssets[symbol]?.amount || '';
    const errorMessage = errorMessages[symbol];
    return (
      <ListItemWithImage
        label={name}
        itemImageUrl={fullIconUrl}
        fallbackToGenericToken
        rightColumnInnerStyle={{ flex: 1, justifyContent: 'center' }}
        customAddon={(
          <AmountInputWrapper>
            <AmountInput
              onChangeText={(text) => handleAmountChange(text, item)}
              value={isEmpty(updatedAssets[symbol]) ? amount : displayAmount}
              placeholder={formattedAssetBalance}
              keyboardType="decimal-pad"
            />
          </AmountInputWrapper>
        )}
        customAddonFullWidth={errorMessage && <ErrorHolder><ErrorText>{errorMessage}</ErrorText></ErrorHolder>}
      />
    );
  };

  const onNextPress = async () => {
    Object.values(updatedAssets).forEach((asset) => {
      // toggle with new amount
      removeKeyBasedAssetToTransfer(asset);
      if (asset?.amount > 0) addKeyBasedAssetToTransfer(asset);
    });
    navigation.goBack();
  };

  const assets = keyBasedAssetsToTransfer
    .filter((assetTransfer) => assetTransfer?.asset?.tokenType !== COLLECTIBLES)
    .map((assetTransfer) => assetTransfer?.asset);

  const filteredAssets = !searchQuery || searchQuery.trim().length < 2
    ? assets
    : assets.filter((asset) => asset.name.toUpperCase().includes(searchQuery.toUpperCase()));

  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [{ title: 'Edit amount' }],
        rightItems: [!isEmpty(updatedAssets) ? { link: 'Save', onPress: onNextPress } : {}],
      }}
    >
      <ScrollView scrollEnabled={!inSearchMode} contentContainerStyle={{ flex: 1 }}>
        <SearchBlock
          searchInputPlaceholder="Search asset"
          onSearchChange={(query) => setSearchQuery(query)}
          itemSearchState={searchQuery.length >= 2}
          navigation={navigation}
          wrapperStyle={{ paddingHorizontal: spacing.large, paddingVertical: spacing.mediumLarge }}
          onSearchFocus={() => setInSearchMode(true)}
          onSearchBlur={() => setInSearchMode(false)}
        />
        <FlatList
          data={filteredAssets}
          scrollEnabled={!inSearchMode}
          keyExtractor={item => item.symbol}
          renderItem={renderAsset}
          initialNumToRender={9}
          contentContainerStyle={{ flexGrow: 1 }}
          ListEmptyComponent={(
            <Wrapper
              flex={1}
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
          )}
          refreshControl={
            <RefreshControl
              refreshing={isFetchingAvailableBalances}
              onRefresh={onAvailableBalancesRefresh}
            />
          }
        />
      </ScrollView>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  keyBasedAssetTransfer: {
    data: keyBasedAssetsToTransfer,
    availableBalances,
    isFetchingAvailableBalances,
  },
}: RootReducerState): $Shape<Props> => ({
  keyBasedAssetsToTransfer,
  availableBalances,
  isFetchingAvailableBalances,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchAvailableBalancesToTransfer: () => dispatch(fetchAvailableBalancesToTransferAction()),
  removeKeyBasedAssetToTransfer: (asset: Asset) => dispatch(removeKeyBasedAssetToTransferAction(asset)),
  addKeyBasedAssetToTransfer: (asset: Asset) => dispatch(addKeyBasedAssetToTransferAction(asset)),
});

export default connect(mapStateToProps, mapDispatchToProps)(KeyBasedAssetTransferEditAmount);
