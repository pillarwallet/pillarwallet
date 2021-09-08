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
import TokenListItem from 'components/lists/TokenListItem';
import CollectibleListItem from 'components/lists/CollectibleListItem';
import CheckBox from 'components/core/CheckBox';
import Text from 'components/core/Text';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Utils
import { getCollectibleKey } from 'utils/collectibles';
import { valueForAddress } from 'utils/common';
import { fontStyles, appFont, spacing } from 'utils/variables';

// Types
import type { SectionBase } from 'utils/types/react-native';
import type { Collectible } from 'models/Collectible';
import type { TokensToMigrateByAddress, CollectiblesToMigrateByCollectibleKey } from 'models/WalletMigrationArchanova';

// Local
import type { TokenWithBalance } from './utils';


type Props = {
  tokens: TokenWithBalance[],
  tokensToMigrate: TokensToMigrateByAddress,
  onPressToken: (address: string, balance: BigNumber, decimals: number) => mixed,
  onPressTokenBalance: (address: string, balance: BigNumber) => mixed,
  collectibles: Collectible[],
  collectiblesToMigrate: CollectiblesToMigrateByCollectibleKey,
  onPressCollectible: (contractAddress: string, id: string, isLegacy: boolean) => mixed,
};

const AssetList = ({
  tokens,
  tokensToMigrate,
  onPressToken,
  onPressTokenBalance,
  collectibles,
  collectiblesToMigrate,
  onPressCollectible,
}: Props) => {
  const sections = useSectionsData(tokens, collectibles);

  const renderSectionHeader = (section: Section) => <SectionHeader>{section.title}</SectionHeader>;

  const renderItem = (item: Item) => (item.collectible ? renderCollectible(item.collectible) : renderToken(item.token));

  const renderToken = ({ token, balance }: TokenWithBalance) => {
    const tokenToMigrate = valueForAddress(tokensToMigrate, token.address);
    const resultBalance = BigNumber(tokenToMigrate?.balance ?? balance);

    return (
      <TokenListItem
        name={token.name}
        address={token.address}
        symbol={token.symbol}
        iconUrl={token.iconUrl}
        balance={resultBalance}
        chain={CHAIN.ETHEREUM}
        onPress={() => onPressToken(token.address, resultBalance, token.decimals)}
        onPressBalance={() => onPressTokenBalance(token.address, resultBalance)}
        leftAddOn={
          <CheckBox
            value={!!tokenToMigrate}
            onValueChange={() => onPressToken(token.address, resultBalance, token.decimals)}
          />
        }
      />
    );
  };

  const renderCollectible = (collectible: Collectible) => {
    const collectibleToMigrate = !!collectiblesToMigrate[getCollectibleKey(collectible)];

    return (
      <CollectibleListItem
        collectible={collectible}
        onPress={() => onPressCollectible(collectible.contractAddress, collectible.id, collectible.isLegacy)}
        leftAddOn={
          <CheckBox
            value={!!collectibleToMigrate}
            onValueChange={() => onPressCollectible(collectible.contractAddress, collectible.id, collectible.isLegacy)}
          />
        }
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

type Item = TokenItem | CollectibleItem;
type TokenItem = {| key: string, token: TokenWithBalance |};
type CollectibleItem = {| key: string, collectible: Collectible |}

const useSectionsData = (tokens: TokenWithBalance[], collectibles: Collectible[]) => {
  const { t } = useTranslation();

  const sections: Section[] = [];

  if (tokens.length) {
    const items = tokens.map((token) => ({ key: token.token.address, token }));
    sections.push({
      key: 'tokens',
      title: t('label.tokens'),
      data: items,
    });
  }

  if (collectibles.length) {
    const items = collectibles.map((collectible) => ({
      key: `${collectible.contractAddress}-${collectible.id}`,
      collectible,
    }));
    sections.push({
      key: 'collectibles',
      title: t('label.collectibles'),
      data: items,
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

