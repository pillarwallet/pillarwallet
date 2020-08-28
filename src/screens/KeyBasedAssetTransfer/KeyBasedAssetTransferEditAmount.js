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
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

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
import type { Balances, KeyBasedAssetTransfer, AssetData } from 'models/Asset';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';


type Props = {
  navigation: NavigationScreenProp<*>,
  fetchAvailableBalancesToTransfer: () => void,
  removeKeyBasedAssetToTransfer: (assetData: AssetData) => void,
  addKeyBasedAssetToTransfer: (assetData: AssetData, amount: number) => void,
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
  const [updatedValues, setUpdatedValues] = useState({});
  const [errorMessages, setErrorMessages] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const onAvailableBalancesRefresh = () => {
    if (isFetchingAvailableBalances) return;
    fetchAvailableBalancesToTransfer();
  };

  const handleAmountChange = (text: string, assetData: AssetData) => {
    const { token: symbol, decimals } = assetData;
    const balance = getBalance(availableBalances, symbol);
    const amountFormatted = text.toString().replace(/,/g, '.');
    const amount = parseNumber(text);

    let errorMessage;
    if (!isValidNumber(text.toString())) {
      errorMessage = t('error.amount.invalidNumber');
    } else if (amount > balance) {
      errorMessage = t('error.amount.exceedBalance');
    } else if (!isValidNumberDecimals(amount, decimals)) {
      errorMessage = t('error.amount.shouldNotHaveDecimals');
    }

    // resets or sets new
    setErrorMessages({ ...errorMessages, [symbol]: errorMessage });

    const updated = { assetData, amount: amountFormatted || 0 };
    setUpdatedValues({ ...updatedValues, [symbol]: updated });
  };

  const renderAsset = ({ item }) => {
    const { assetData: { token: symbol, name, icon }, amount } = item;
    const assetBalance = getBalance(availableBalances, symbol);
    const formattedAssetBalance = formatFullAmount(assetBalance);
    const displayAmount = updatedValues[symbol]?.amount || '';
    const errorMessage = errorMessages[symbol];
    const value = isEmpty(updatedValues[symbol]) ? amount.toString() : displayAmount;
    return (
      <ListItemWithImage
        label={name}
        itemImageUrl={icon}
        fallbackToGenericToken
        rightColumnInnerStyle={{ flex: 1, justifyContent: 'center' }}
        customAddon={(
          <AmountInputWrapper>
            <AmountInput
              onChangeText={(text) => handleAmountChange(text, item.assetData)}
              value={value}
              placeholder={formattedAssetBalance}
              keyboardType="decimal-pad"
            />
          </AmountInputWrapper>
        )}
        customAddonFullWidth={errorMessage && <ErrorHolder><ErrorText>{errorMessage}</ErrorText></ErrorHolder>}
      />
    );
  };

  const onNextPress = () => {
    Object.values(updatedValues).forEach((updatedValue: any) => {
      // toggle with new amount
      removeKeyBasedAssetToTransfer(updatedValue.assetData);
      if (!!updatedValue?.amount && updatedValue.amount > 0) {
        addKeyBasedAssetToTransfer(updatedValue.assetData, updatedValue.amount);
      }
    });
    navigation.goBack();
  };

  const assetTransfers = keyBasedAssetsToTransfer.filter(
    (assetTransfer) => assetTransfer?.assetData?.tokenType !== COLLECTIBLES,
  );

  const filteredAssetTransfers = !searchQuery || searchQuery.trim().length < 2
    ? assetTransfers
    : assetTransfers.filter(
      ({ assetData }) => !!assetData.name && assetData.name.toUpperCase().includes(searchQuery.toUpperCase()),
    );

  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [{ title: t('transactions.title.amountEditScreen') }],
        rightItems: [!isEmpty(updatedValues) ? { link: 'Save', onPress: onNextPress } : {}],
      }}
    >
      <ScrollView scrollEnabled={!inSearchMode} contentContainerStyle={{ flex: 1 }}>
        <SearchBlock
          searchInputPlaceholder={t('label.searchAsset')}
          onSearchChange={(query) => setSearchQuery(query)}
          itemSearchState={searchQuery.length >= 2}
          navigation={navigation}
          wrapperStyle={{ paddingHorizontal: spacing.large, paddingVertical: spacing.mediumLarge }}
          onSearchFocus={() => setInSearchMode(true)}
          onSearchBlur={() => setInSearchMode(false)}
        />
        <FlatList
          data={filteredAssetTransfers}
          scrollEnabled={!inSearchMode}
          keyExtractor={item => item.assetData.token}
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
                title={t('transactions.emptyState.assetsList.title')}
                bodyText={t('transactions.emptyState.assetsList.paragraph')}
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
  removeKeyBasedAssetToTransfer: (assetData: AssetData) => dispatch(removeKeyBasedAssetToTransferAction(assetData)),
  addKeyBasedAssetToTransfer: (assetData: AssetData, amount: number) => dispatch(
    addKeyBasedAssetToTransferAction(assetData, amount),
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(KeyBasedAssetTransferEditAmount);
