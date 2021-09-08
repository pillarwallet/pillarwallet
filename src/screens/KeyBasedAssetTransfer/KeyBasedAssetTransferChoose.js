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
import { SectionList } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { connect, useDispatch } from 'react-redux';
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
import { switchToEtherspotAccountIfNeededAction } from 'actions/accountsActions';

// Components
import { Wrapper } from 'components/legacy/Layout';
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import TokenListItem from 'components/lists/TokenListItem';
import CollectibleListItem from 'components/lists/CollectibleListItem';
import BalanceView from 'components/BalanceView';
import Button from 'components/legacy/Button';
import CheckBox from 'components/core/CheckBox';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import RefreshControl from 'components/RefreshControl';
import Text from 'components/core/Text';
import TextWithCopy from 'components/legacy/TextWithCopy';

// utils
import { compactFalsy } from 'utils/array';
import {
  addressesEqual,
  getBalance,
  getBalanceBN,
  mapAssetToAssetData,
  getBalanceInFiat,
  findAssetByAddress,
} from 'utils/assets';
import { BigNumber } from 'utils/common';
import { appFont, fontStyles, spacing } from 'utils/variables';

// Constants
import { ASSET_TYPES } from 'constants/assetsConstants';
import { KEY_BASED_ASSET_TRANSFER_CONFIRM, KEY_BASED_ASSET_TRANSFER_EDIT_AMOUNT } from 'constants/navigationConstants';
import { CHAIN } from 'constants/chainConstants';

// Selectors
import { useChainRates, useChainSupportedAssets } from 'selectors';

// Types
import type { AssetData, KeyBasedAssetTransfer } from 'models/Asset';
import type { Collectible } from 'models/Collectible';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { WalletAssetsBalances } from 'models/Balances';
import type { Currency } from 'models/Rates';


type Props = {
  fetchAvailableBalancesToTransfer: () => void,
  fetchAvailableCollectiblesToTransfer: () => void,
  isFetchingAvailableBalances: boolean,
  isFetchingAvailableCollectibles: boolean,
  availableBalances: WalletAssetsBalances,
  availableCollectibles: Collectible[],
  addKeyBasedAssetToTransfer: (assetData: AssetData, amount?: BigNumber) => void,
  removeKeyBasedAssetToTransfer: (assetData: AssetData) => void,
  walletAddress: ?string,
  keyBasedAssetsToTransfer: KeyBasedAssetTransfer[],
  calculateTransactionsGas: () => void,
  baseFiatCurrency: ?Currency,
};

const KeyBasedAssetTransferChoose = ({
  walletAddress,
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
  const ethereumSupportedAssets = useChainSupportedAssets(CHAIN.ETHEREUM);
  const ethereumRates = useChainRates(CHAIN.ETHEREUM);
  const navigation = useNavigation();
  const dispatch = useDispatch();

  React.useEffect(() => {
    dispatch(switchToEtherspotAccountIfNeededAction());
  }, [dispatch]);

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
      .filter((assetAddress) => !!getBalance(availableBalances, assetAddress))
      .map((assetAddress) => findAssetByAddress(ethereumSupportedAssets, assetAddress))
      .filter(Boolean)
      .map(mapAssetToAssetData);

    return compactFalsy([
      !!assets?.length && { title: t('label.tokens'), data: assets },
      !!availableCollectibles?.length && { title: t('label.collectibles'), data: availableCollectibles },
    ]);
  };

  const sections = prepareSectionsData();

  const renderSectionHeader = (section) => {
    return <SectionTitle>{section.title}</SectionTitle>;
  };

  const renderItem = (item: AssetData) => {
    if (item.tokenType === ASSET_TYPES.COLLECTIBLE) {
      const isChecked = keyBasedAssetsToTransfer.some((assetToTransfer) =>
        isMatchingAssetToTransfer(assetToTransfer, item),
      );
      const onCheck = () => onAssetSelect(item);

      return (
        <CollectibleListItem
          collectible={item}
          onPress={onCheck}
          leftAddOn={<CheckBox value={isChecked} onValueChange={onCheck} />}
        />
      );
    }

    const checkedAsset = keyBasedAssetsToTransfer.find((assetToTransfer) =>
      isMatchingAssetToTransfer(assetToTransfer, item),
    );

    const assetAmountBN = checkedAsset?.draftAmount || getBalanceBN(availableBalances, item.contractAddress);
    const onCheck = () => onAssetSelect(item, assetAmountBN);

    return (
      <TokenListItem
        name={item.name}
        symbol={item.token}
        address={item.contractAddress}
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
        chain={CHAIN.ETHEREUM}
      />
    );
  };

  let totalValue = 0;
  keyBasedAssetsToTransfer.forEach((asset) => {
    totalValue += getBalanceInFiat(
      baseFiatCurrency,
      asset.draftAmount,
      ethereumRates,
      asset.assetData.contractAddress,
    );
  });

  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [{ title: t('transactions.title.transferAssetsToSmartWalletScreen') }],
      }}
      footer={
        !isEmpty(keyBasedAssetsToTransfer) && (
          <FooterContent>
            <Button
              title={t('button.next')}
              onPress={() => {
                calculateTransactionsGas(); // start calculating
                navigation.navigate(KEY_BASED_ASSET_TRANSFER_CONFIRM);
              }}
            />
          </FooterContent>
        )
      }
    >
      <WalletInfoContainer>
        <BalanceView balance={totalValue} />
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
  if (asset?.tokenType === ASSET_TYPES.COLLECTIBLE) {
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

const FooterContent = styled.View`
  width: 100%;
  padding: ${spacing.small}px ${spacing.large}px ${spacing.mediumLarge}px;
`;

const SectionTitle = styled(Text)`
  padding: ${spacing.largePlus}px ${spacing.large}px ${spacing.extraSmall}px;
  font-family: '${appFont.medium}';
  ${fontStyles.big};
  background-color: ${({ theme }) => theme.colors.basic070};
`;
