// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';

// Components
import AssetListItem from 'components/modern/AssetListItem';
import CheckBox from 'components/modern/CheckBox';
import Text from 'components/modern/Text';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Utils
import { fontStyles, appFont, spacing } from 'utils/variables';

// Types
import type { SectionBase } from 'utils/types/react-native';
import type { WalletAssetBalanceInfo } from 'models/Balances';
import type { Collectible } from 'models/Collectible';
import type { AssetBalanceRecord } from 'models/WalletMigrationArchanova';


type Props = {
  assets: WalletAssetBalanceInfo[],
  collectibles: Collectible[],
  selectedAssets: AssetBalanceRecord,
  onSelectedAssetsChange: (assets: AssetBalanceRecord) => mixed,
  ListHeaderComponent: React.Element<any>,
};

const AssetList = ({ assets, collectibles, selectedAssets, onSelectedAssetsChange, ListHeaderComponent }: Props) => {
  const sections = useSectionsData(assets, collectibles);

  const renderSectionHeader = (section: Section) => <SectionHeader>{section.title}</SectionHeader>;

  const renderItem = (item: Item) => (item.collectible ? renderCollectible(item.collectible) : renderToken(item.asset));

  const renderToken = ({ asset, balance }: WalletAssetBalanceInfo) => {
    const isChecked = !!selectedAssets[asset.address];
    const onCheck = () => {
      if (isChecked) {
        const newValue = { ...selectedAssets };
        delete newValue[asset.address];
        onSelectedAssetsChange(newValue);
      } else {
        const newValue = { ...selectedAssets, [asset.address]: { address: asset.address, balance } };
        onSelectedAssetsChange(newValue);
      }
    };

    return (
      <AssetListItem
        name={asset.name}
        symbol={asset.symbol}
        iconUrl={asset.iconUrl}
        balance={balance}
        chain={CHAIN.ETHEREUM}
        onPress={onCheck}
        // onPressBalance={() =>
        //   navigation.navigate(KEY_BASED_ASSET_TRANSFER_EDIT_AMOUNT, {
        //     assetData: item,
        //     value: assetAmountBN,
        //   })
        // }
        leftAddOn={<CheckBox value={isChecked} onValueChange={onCheck} />}
      />
    );
  };

  const renderCollectible = (collectible: Collectible) => {
    const isChecked = !!selectedAssets[collectible.contractAddress];
    const onCheck = () => {
      if (isChecked) {
        const newValue = { ...selectedAssets };
        delete newValue[collectible.contractAddress];
        onSelectedAssetsChange(newValue);
      } else {
        const newValue = { ...selectedAssets, [collectible.contractAddress]: { address: collectible.contractAddress } };
        onSelectedAssetsChange(newValue);
      }
    };

    return (
      <AssetListItem
        name={collectible.name}
        iconUrl={collectible.icon}
        chain={CHAIN.ETHEREUM}
        onPress={onCheck}
        leftAddOn={<CheckBox value={isChecked} onValueChange={onCheck} />}
      />
    );
  };

  return (
    <SectionList
      sections={sections}
      renderSectionHeader={({ section }) => renderSectionHeader(section)}
      renderItem={({ item }) => renderItem(item)}
      ListHeaderComponent={ListHeaderComponent}
      contentInsetAdjustmentBehavior="scrollableAxes"
    />
  );
};

export default AssetList;

type Section = {
  ...SectionBase<Item>,
  title: string,
};

type Item = AssetItem | CollectibleItem;
type AssetItem = {| asset: WalletAssetBalanceInfo |};
type CollectibleItem = {| collectible: Collectible |};

const useSectionsData = (assets: WalletAssetBalanceInfo[], collectibles: Collectible[]) => {
  const { t } = useTranslation();

  const sections: Section[] = [];

  if (assets.length) {
    sections.push({
      key: 'tokens',
      title: t('label.tokens'),
      data: assets.map((asset) => ({ asset })),
    });
  }

  if (collectibles.length) {
    sections.push({
      key: 'collectibles',
      title: t('label.collectibles'),
      data: collectibles.map((collectible) => ({ collectible })),
    });
  }

  return sections;
};

const SectionHeader = styled(Text)`
  padding: ${spacing.small}px ${spacing.large}px;
  font-family: ${appFont.medium};
  ${fontStyles.big};
  background-color: ${({ theme }) => theme.colors.background};
`;

