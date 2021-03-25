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
import { SectionList, RefreshControl } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import isEmpty from 'lodash.isempty';
import t from 'translations/translate';

// Actions
import {
  addKeyBasedAssetToTransferAction,
  calculateKeyBasedAssetsToTransferTransactionGasAction,
  fetchAvailableBalancesToTransferAction,
  fetchAvailableCollectiblesToTransferAction,
  removeKeyBasedAssetToTransferAction,
} from 'actions/keyBasedAssetTransferActions';

// Components
import { Footer, Wrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import AssetListItem from 'components/modern/AssetListItem';
import BalanceView from 'components/BalanceView';
import Button from 'components/Button';
import CheckBox from 'components/modern/CheckBox';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Text from 'components/modern/Text';
import TextWithCopy from 'components/TextWithCopy';

// utils
import { compactFalsy } from 'utils/array';
import {
  addressesEqual,
  getAssetData,
  getBalance,
  getBalanceBN,
  mapAssetToAssetData,
  mapCollectibleToAssetData,
  getBalanceInFiat,
} from 'utils/assets';
import { BigNumber } from 'utils/common';
import { appFont, fontStyles, spacing } from 'utils/variables';

// Constants
import { COLLECTIBLES } from 'constants/assetsConstants';
import { KEY_BASED_ASSET_TRANSFER_CONFIRM, KEY_BASED_ASSET_TRANSFER_EDIT_AMOUNT } from 'constants/navigationConstants';

// Types
import type { Asset, AssetData, Balances, KeyBasedAssetTransfer, Rates } from 'models/Asset';
import type { Collectibles } from 'models/Collectible';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

type Props = {
  fetchAvailableBalancesToTransfer: () => void,
  fetchAvailableCollectiblesToTransfer: () => void,
  isFetchingAvailableBalances: boolean,
  isFetchingAvailableCollectibles: boolean,
  availableBalances: Balances,
  availableCollectibles: Collectibles,
  addKeyBasedAssetToTransfer: (assetData: AssetData, amount?: BigNumber) => void,
  removeKeyBasedAssetToTransfer: (assetData: AssetData) => void,
  supportedAssets: Asset[],
  walletAddress: ?string,
  keyBasedAssetsToTransfer: KeyBasedAssetTransfer[],
  calculateTransactionsGas: () => void,
  rates: ?Rates,
  baseFiatCurrency: ?string,
};

const KeyBasedAssetTransferChoose = ({
  walletAddress,
  supportedAssets,
  rates,
  baseFiatCurrency,
  isFetchingAvailableBalances,
  isFetchingAvailableCollectibles,
  fetchAvailableBalancesToTransfer,
  fetchAvailableCollectiblesToTransfer,
  availableBalances,
  availableCollectibles,
  addKeyBasedAssetToTransfer,
  removeKeyBasedAssetToTransfer,
  keyBasedAssetsToTransfer,
  calculateTransactionsGas,
}: Props) => {
  const navigation = useNavigation();

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

  const onAssetSelect = (assetData: AssetData, amount?: BigNumber) => {
    const assetExist = keyBasedAssetsToTransfer.some((assetToTransfer) =>
      isMatchingAssetToTransfer(assetToTransfer, assetData),
    );
    removeKeyBasedAssetToTransfer(assetData);
    if (!assetExist) addKeyBasedAssetToTransfer(assetData, amount);
  };

  const prepareSectionsData = () => {
    const assets = Object.keys(availableBalances)
      // filter out extremely low balances that are shown as 0 in app anyway
      .filter((symbol) => !!getBalance(availableBalances, symbol))
      .map((symbol) => getAssetData(supportedAssets, [], symbol))
      .filter((assetData) => !isEmpty(assetData))
      .map(mapAssetToAssetData);

    const collectibles = availableCollectibles.map(mapCollectibleToAssetData);

    return compactFalsy([
      !!assets?.length && { title: t('label.tokens'), data: assets },
      !!collectibles?.length && { title: t('label.collectibles'), data: collectibles },
    ]);
  };

  const sections = prepareSectionsData();

  const renderSectionHeader = (section) => {
    return <SectionTitle>{section.title}</SectionTitle>;
  };

  const renderItem = (item: AssetData) => {
    if (item.tokenType === COLLECTIBLES) {
      const isChecked = keyBasedAssetsToTransfer.some((assetToTransfer) =>
        isMatchingAssetToTransfer(assetToTransfer, item),
      );
      const onCheck = () => onAssetSelect(item);

      return (
        <AssetListItem
          name={item.name}
          iconUrl={item.icon}
          onPress={onCheck}
          leftAddOn={<CheckBox value={isChecked} onValueChange={onCheck} />}
        />
      );
    }

    const checkedAsset = keyBasedAssetsToTransfer.find((assetToTransfer) =>
      isMatchingAssetToTransfer(assetToTransfer, item),
    );

    const assetAmountBN = checkedAsset?.draftAmount || getBalanceBN(availableBalances, item.token);
    const onCheck = () => onAssetSelect(item, assetAmountBN);

    return (
      <AssetListItem
        name={item.name}
        symbol={item.token}
        iconUrl={item.icon}
        balance={assetAmountBN}
        onPress={onCheck}
        onPressBalance={() =>
          navigation.navigate(KEY_BASED_ASSET_TRANSFER_EDIT_AMOUNT, {
            assetData: item,
            value: assetAmountBN,
          })
        }
        leftAddOn={<CheckBox value={!!checkedAsset} onValueChange={onCheck} />}
      />
    );
  };

  let totalValue = 0;
  keyBasedAssetsToTransfer.forEach((asset) => {
    totalValue += getBalanceInFiat(baseFiatCurrency, asset.draftAmount, rates || {}, asset.assetData.token);
  });

  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [{ title: t('transactions.title.transferAssetsToSmartWalletScreen') }],
      }}
      footer={
        !isEmpty(keyBasedAssetsToTransfer) && (
        <Footer>
          <Button
            title={t('button.next')}
            onPress={() => {
              calculateTransactionsGas(); // start calculating
              navigation.navigate(KEY_BASED_ASSET_TRANSFER_CONFIRM);
            }}
          />
        </Footer>
        )
      }
    >
      <WalletInfoContainer>
        <BalanceView fiatCurrency={baseFiatCurrency} balance={totalValue} />
        <WalletInfo>{t('transactions.label.migratingFrom')}</WalletInfo>
        <WalletInfoAddress>{walletAddress}</WalletInfoAddress>
      </WalletInfoContainer>

      <SectionList
        sections={sections}
        renderSectionHeader={({ section }) => renderSectionHeader(section)}
        renderItem={({ item }) => renderItem(item)}
        keyExtractor={(item) => item.token}
        refreshControl={
          <RefreshControl refreshing={isFetchingAvailableBalances} onRefresh={onAvailableBalancesRefresh} />
        }
        ListEmptyComponent={renderEmptyResult(t('transactions.label.noAssetsFound'), isFetchingAvailableBalances)}
      />
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  appSettings: {
    data: { baseFiatCurrency },
  },
  assets: { supportedAssets },
  rates: { data: rates },
  keyBasedAssetTransfer: {
    data: keyBasedAssetsToTransfer,
    availableBalances,
    availableCollectibles,
    isFetchingAvailableBalances,
    isFetchingAvailableCollectibles,
  },
  wallet: { data: walletData },
}: RootReducerState): $Shape<Props> => ({
  walletAddress: walletData?.address,
  supportedAssets,
  rates,
  baseFiatCurrency,
  keyBasedAssetsToTransfer,
  isFetchingAvailableBalances,
  isFetchingAvailableCollectibles,
  availableBalances,
  availableCollectibles,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  removeKeyBasedAssetToTransfer: (assetData: AssetData) => dispatch(removeKeyBasedAssetToTransferAction(assetData)),
  addKeyBasedAssetToTransfer: (assetData: AssetData, amount?: BigNumber) => dispatch(
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

const isMatchingAssetToTransfer = (assetToTransfer: KeyBasedAssetTransfer, asset: AssetData) => {
  if (asset?.tokenType === COLLECTIBLES) {
    return (
      assetToTransfer?.assetData?.id === asset?.id &&
      addressesEqual(assetToTransfer?.assetData?.contractAddress, asset?.contractAddress)
    );
  }

  return assetToTransfer?.assetData?.token === asset?.token;
};

const WalletInfoContainer = styled.View`
  align-items: center;
  margin: ${spacing.extraLarge}px 0 ${spacing.medium}px;
`;

const WalletInfo = styled(Text)`
  margin: ${spacing.extraSmall}px 0 ${spacing.small}px;
  color: ${({ theme }) => theme.colors.basic030};
`;

const WalletInfoAddress = styled(TextWithCopy)`
  ${fontStyles.small};
`;

const SectionTitle = styled(Text)`
  padding: ${spacing.largePlus}px ${spacing.large}px ${spacing.extraSmall}px;
  font-family: '${appFont.medium}';
  ${fontStyles.big};
  background-color: ${({ theme }) => theme.colors.basic070};
`;
