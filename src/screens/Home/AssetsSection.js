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
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Constants
import { CHAINS } from 'constants/assetsConstants';
import { ASSETS, CONTACTS_FLOW, SERVICES_FLOW } from 'constants/navigationConstants';

// Selectors
import { useFiatCurrency } from 'selectors';

// Utils
import { formatValue, formatFiatValue, formatFiatChangeExtended } from 'utils/format';
import { useChainsConfig, useAssetCategoriesConfig } from 'utils/uiConfig';
import { useThemeColors } from 'utils/themes';

// Types
import type { ChainSummaries, ChainBalances, Balance } from 'models/Home';
import type { Chain, AssetCategory } from 'models/Asset';

// Local
import HomeListHeader from './components/HomeListHeader';
import HomeListItem from './components/HomeListItem';

type Props = {|
  chainSummaries: ChainSummaries,
  chainBalances: ChainBalances,
|};

function AssetsSection({ chainSummaries, chainBalances }: Props) {
  const { t, tRoot } = useTranslationWithPrefix('home.assets');
  const navigation = useNavigation();

  const fiatCurrency = useFiatCurrency();

  const chainsConfig = useChainsConfig();
  const categoriesConfig = useAssetCategoriesConfig();
  const colors = useThemeColors();

  const renderChain = (chain: Chain, showHeader: boolean) => {
    const summary = chainSummaries[chain];
    const categoryBalances = chainBalances[chain];
    const { title, iconName, color } = chainsConfig[chain];

    if (!summary && !categoryBalances) return null;

    return (
      <React.Fragment key={chain}>
        {showHeader && (
          <HomeListHeader
            key={`${chain}-header`}
            title={title}
            iconName={iconName}
            color={color}
            walletAddress={summary?.walletAddress}
          />
        )}

        {!!categoryBalances &&
          Object.keys(categoryBalances).map((category) =>
            renderBalanceItem(chain, category, categoryBalances[category]),
          )}

        {summary?.collectibleCount != null && (
          <HomeListItem
            key={`${chain}-collectibles`}
            title={tRoot('assetCategories.collectibles')}
            iconName="collectible"
            onPress={() => navigation.navigate(ASSETS)}
            value={formatValue(summary.collectibleCount)}
          />
        )}

        {summary?.contactCount != null && (
          <HomeListItem
            key={`${chain}-contacts`}
            title={t('contacts')}
            iconName="contacts"
            onPress={() => navigation.navigate(CONTACTS_FLOW)}
            value={formatValue(summary.contactCount)}
          />
        )}

        {/* Temporary entry until other UI provided */}
        {chain === CHAINS.ETHEREUM && (
          <HomeListItem
            key={`${chain}-services`}
            title={t('services')}
            iconName="info"
            onPress={() => navigation.navigate(SERVICES_FLOW)}
          />
        )}
      </React.Fragment>
    );
  };

  const renderBalanceItem = (chain: Chain, category: AssetCategory, balance: ?Balance) => {
    if (!balance || !categoriesConfig[category]) return null;

    const formattedBalance = formatFiatValue(balance?.balanceInFiat ?? 0, fiatCurrency);

    const initialBalance = balance.changeInFiat ? balance.balanceInFiat.minus(balance.changeInFiat) : null;
    const formattedChange = formatFiatChangeExtended(balance.changeInFiat, initialBalance, fiatCurrency);
    const { title, iconName } = categoriesConfig[category];

    return (
      <HomeListItem
        key={`${chain}-${category}`}
        title={title}
        iconName={iconName}
        onPress={() => navigation.navigate(ASSETS, { category })}
        value={formattedBalance}
        secondaryValue={formattedChange}
        secondaryValueColor={balance.changeInFiat?.gte(0) ? colors.positive : colors.secondaryText}
      />
    );
  };

  return <Container>{Object.keys(chainBalances).map((key) => renderChain(key, true))}</Container>;
}

export default AssetsSection;

const Container = styled.View``;
