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
import { FlatList, RefreshControl } from 'react-native';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import isEmpty from 'lodash.isempty';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// actions
import {
  addKeyBasedAssetToTransferAction,
  calculateKeyBasedAssetsToTransferTransactionGasAction,
  fetchAvailableBalancesToTransferAction,
  fetchAvailableCollectiblesToTransferAction,
  removeKeyBasedAssetToTransferAction,
} from 'actions/keyBasedAssetTransferActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Footer, Wrapper } from 'components/Layout';
import Button from 'components/Button';
import TextWithCopy from 'components/TextWithCopy';
import { BaseText } from 'components/Typography';
import Checkbox from 'components/Checkbox';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';

// utils
import { fontStyles, spacing } from 'utils/variables';
import {
  addressesEqual,
  getAssetData,
  getBalance,
  mapAssetToAssetData,
  mapCollectibleToAssetData,
} from 'utils/assets';
import { formatFullAmount } from 'utils/common';

// constants
import { TOKENS, COLLECTIBLES } from 'constants/assetsConstants';
import { KEY_BASED_ASSET_TRANSFER_CONFIRM, KEY_BASED_ASSET_TRANSFER_EDIT_AMOUNT } from 'constants/navigationConstants';

// types
import type { Asset, AssetData, Balances, KeyBasedAssetTransfer } from 'models/Asset';
import type { Collectibles } from 'models/Collectible';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

type Props = {
  navigation: NavigationScreenProp<*>,
  fetchAvailableBalancesToTransfer: () => void,
  fetchAvailableCollectiblesToTransfer: () => void,
  isFetchingAvailableBalances: boolean,
  isFetchingAvailableCollectibles: boolean,
  availableBalances: Balances,
  availableCollectibles: Collectibles,
  addKeyBasedAssetToTransfer: (assetData: AssetData, amount?: number) => void,
  removeKeyBasedAssetToTransfer: (assetData: AssetData) => void,
  supportedAssets: Asset[],
  walletAddress: ?string,
  keyBasedAssetsToTransfer: KeyBasedAssetTransfer[],
  calculateTransactionsGas: () => void,
};

const KeyBasedAssetTransferChoose = ({
  navigation,
  isFetchingAvailableBalances,
  isFetchingAvailableCollectibles,
  fetchAvailableBalancesToTransfer,
  fetchAvailableCollectiblesToTransfer,
  availableBalances,
  availableCollectibles,
  supportedAssets,
  walletAddress,
  addKeyBasedAssetToTransfer,
  removeKeyBasedAssetToTransfer,
  keyBasedAssetsToTransfer,
  calculateTransactionsGas,
}: Props) => {
  const onAvailableBalancesRefresh = () => {
    if (isFetchingAvailableBalances) return;
    fetchAvailableBalancesToTransfer();
  };

  const onAvailableCollectiblesRefresh = () => {
    if (isFetchingAvailableCollectibles) return;
    fetchAvailableCollectiblesToTransfer();
  };

  // initial fetching
  React.useEffect(() => {
    onAvailableBalancesRefresh();
    onAvailableCollectiblesRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availableAssets: AssetData[] = Object.keys(availableBalances)
    // filter those with extremely low balances that are shown as 0 in app anyway
    .filter((symbol) => !!getBalance(availableBalances, symbol))
    .map((symbol) => getAssetData(supportedAssets, [], symbol))
    .filter((assetData) => !isEmpty(assetData))
    .map(mapAssetToAssetData);

  const onAssetSelect = (assetData: AssetData, amount?: number) => {
    const assetExist = keyBasedAssetsToTransfer.some(
      (assetToTransfer) => isMatchingAssetToTransfer(assetToTransfer, assetData),
    );
    removeKeyBasedAssetToTransfer(assetData);
    if (!assetExist) addKeyBasedAssetToTransfer(assetData, amount);
  };

  const mappedAvailableCollectible: AssetData[] = availableCollectibles.map(mapCollectibleToAssetData);

  const renderAsset = ({ item }) => {
    const { icon, name: assetName, token: assetSymbol } = item;
    const assetBalance = getBalance(availableBalances, assetSymbol);
    const checkedAsset = keyBasedAssetsToTransfer.find((assetToTransfer) =>
      isMatchingAssetToTransfer(assetToTransfer, item),
    );
    const assetAmount = checkedAsset?.draftAmount || assetBalance;
    const formattedAmount = formatFullAmount(assetAmount);
    const onCheck = () => onAssetSelect(item, assetAmount);
    return (
      <ListItemWithImage
        label={assetName}
        itemImageUrl={icon}
        itemValue={t('tokenValue', { value: formattedAmount, token: assetSymbol })}
        fallbackToGenericToken
        onPress={onCheck}
        customAddon={renderCheckbox(onCheck, !!checkedAsset, { marginLeft: 12 })}
        rightColumnInnerStyle={{ flexDirection: 'row', paddingRight: 40 }}
      />
    );
  };

  const renderCollectible = ({ item }) => {
    const isChecked = keyBasedAssetsToTransfer.some(
      (assetToTransfer) => isMatchingAssetToTransfer(assetToTransfer, item),
    );
    const onCheck = () => onAssetSelect(item);
    return (
      <ListItemWithImage
        label={item.name}
        itemImageUrl={item.icon}
        fallbackToGenericToken
        onPress={onCheck}
        customAddon={renderCheckbox(onCheck, isChecked, { marginRight: 4 })}
        rightColumnInnerStyle={{ flexDirection: 'row', paddingRight: 40 }}
      />
    );
  };

  const editAmountSetting = {
    link: t('button.edit'),
    onPress: () => navigation.navigate(KEY_BASED_ASSET_TRANSFER_EDIT_AMOUNT),
  };

  const hasTokensSelected = !isEmpty(
    keyBasedAssetsToTransfer.filter(({ assetData }) => assetData?.tokenType !== COLLECTIBLES),
  );

  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [{ title: t('transactions.title.transferAssetsToSmartWalletScreen') }],
        rightItems: [hasTokensSelected ? editAmountSetting : {}],
      }}
      footer={
        !isEmpty(keyBasedAssetsToTransfer) && (
          <Footer>
            <FooterInner>
              <Button
                style={{ marginLeft: 'auto' }}
                small
                title={t('button.next')}
                onPress={() => {
                  calculateTransactionsGas(); // start calculating
                  navigation.navigate(KEY_BASED_ASSET_TRANSFER_CONFIRM);
                }}
                block={false}
              />
            </FooterInner>
          </Footer>
        )
      }
    >
      <WalletInfoContainer>
        <WalletInfoText>{t('transactions.label.migratingFrom')}</WalletInfoText>
        <WalletInfoAddress>{walletAddress}</WalletInfoAddress>
      </WalletInfoContainer>

      <FlatList
        data={availableAssets}
        keyExtractor={(item) => item.token}
        renderItem={renderAsset}
        initialNumToRender={9}
        ListEmptyComponent={renderEmptyResult(t('transactions.label.noAssetsFound'), isFetchingAvailableBalances)}
        refreshControl={
          <RefreshControl refreshing={isFetchingAvailableBalances} onRefresh={onAvailableBalancesRefresh} />
        }
      />
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  assets: { supportedAssets },
  keyBasedAssetTransfer: {
    data: keyBasedAssetsToTransfer,
    availableBalances,
    availableCollectibles,
    isFetchingAvailableBalances,
    isFetchingAvailableCollectibles,
  },
  wallet: { data: walletData },
}: RootReducerState): $Shape<Props> => ({
  keyBasedAssetsToTransfer,
  isFetchingAvailableBalances,
  isFetchingAvailableCollectibles,
  availableBalances,
  availableCollectibles,
  supportedAssets,
  walletAddress: walletData?.address,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  removeKeyBasedAssetToTransfer: (assetData: AssetData) => dispatch(removeKeyBasedAssetToTransferAction(assetData)),
  addKeyBasedAssetToTransfer: (assetData: AssetData, amount?: number) => dispatch(
    addKeyBasedAssetToTransferAction(assetData, amount),
  ),
  fetchAvailableBalancesToTransfer: () => dispatch(fetchAvailableBalancesToTransferAction()),
  fetchAvailableCollectiblesToTransfer: () => dispatch(fetchAvailableCollectiblesToTransferAction()),
  calculateTransactionsGas: () => dispatch(calculateKeyBasedAssetsToTransferTransactionGasAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(KeyBasedAssetTransferChoose);


const renderEmptyResult = (emptyMessage: string, isLoading: boolean) => (
  <Wrapper
    flex={1}
    style={{
      paddingTop: 90,
      paddingBottom: 90,
      alignItems: 'center',
    }}
  >
    {!isLoading && <EmptyStateParagraph title={emptyMessage} />}
  </Wrapper>
);

const isMatchingAssetToTransfer = (assetToTransfer: KeyBasedAssetTransfer, assetData: AssetData) => {
  if (assetData?.tokenType !== COLLECTIBLES) return assetToTransfer?.assetData?.token === assetData?.token;
  return (
    assetToTransfer?.assetData?.id === assetData?.id &&
    addressesEqual(assetToTransfer?.assetData?.contractAddress, assetData?.contractAddress)
  );
};

const renderCheckbox = (onPress, isChecked, wrapperStyle = {}) => (
  <CheckboxWrapper>
    <Checkbox onPress={onPress} checked={isChecked} rounded wrapperStyle={{ width: 24, ...wrapperStyle }} />
  </CheckboxWrapper>
);

const FooterInner = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
`;

const CheckboxWrapper = styled.View`
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  justify-content: center;
`;

const WalletInfoContainer = styled.View`
  align-items: center;
  margin-top: ${spacing.medium}px;
`;

const WalletInfoText = styled(BaseText)`
  ${fontStyles.regular};
  color: ${({ theme }) => theme.colors.basic030};
  margin-bottom: ${spacing.small}px;
`;

const WalletInfoAddress = styled(TextWithCopy)`
  ${fontStyles.small};
`;
