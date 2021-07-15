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
import { BigNumber } from 'bignumber.js';
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
import type { Collectible } from 'models/Collectible';
import type {
  TokensToMigrateByAddress,
  CollectiblesToMigrateByAddress,
} from 'models/WalletMigrationArchanova';

// Local
import type { TokenItem } from './utils';


type Props = {
  tokens: TokenItem[],
  tokensToMigrate: TokensToMigrateByAddress,
  onToggleToken: (address: string, balance: BigNumber) => mixed,
  collectibles: Collectible[],
  collectiblesToMigrate: CollectiblesToMigrateByAddress,
  onToggleCollectible: (address: string) => mixed,
};

const AssetList = ({
  tokens,
  tokensToMigrate,
  onToggleToken,
  collectibles,
  collectiblesToMigrate,
  onToggleCollectible,
}: Props) => {
  const sections = useSectionsData(tokens, collectibles);

  const renderSectionHeader = (section: Section) => <SectionHeader>{section.title}</SectionHeader>;

  const renderItem = (item: Item) => (item.collectible ? renderCollectible(item.collectible) : renderToken(item.token));

  const renderToken = ({ asset, balance }: TokenItem) => {
    const isChecked = !!tokensToMigrate[asset.address];
    const onCheck = () => onToggleToken(asset.address, balance);

    return (
      <AssetListItem
        name={asset.name}
        address={asset.address}
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
    const isChecked = !!collectiblesToMigrate[collectible.contractAddress];
    const onCheck = () => onToggleCollectible(collectible.contractAddress);

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
      contentInsetAdjustmentBehavior="scrollableAxes"
    />
  );
};

export default AssetList;

type Section = {
  ...SectionBase<Item>,
  title: string,
};

type Item = {| key: string, token: TokenItem |} | {| key: string, collectible: Collectible |};

const useSectionsData = (tokens: TokenItem[], collectibles: Collectible[]) => {
  const { t } = useTranslation();

  const sections: Section[] = [];

  if (tokens.length) {
    sections.push({
      key: 'tokens',
      title: t('label.tokens'),
      data: tokens.map((token) => ({ key: token.asset.address, token })),
    });
  }

  if (collectibles.length) {
    sections.push({
      key: 'collectibles',
      title: t('label.collectibles'),
      data: collectibles.map((collectible) => ({ key: collectible.contractAddress, collectible })),
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

