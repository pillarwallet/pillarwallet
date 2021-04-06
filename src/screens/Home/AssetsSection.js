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
import { CHAINS, ASSET_CATEGORIES } from 'constants/assetsConstants';
import { ASSETS, CONTACTS_FLOW, SERVICES_FLOW } from 'constants/navigationConstants';

// Selectors
import { useFiatCurrency } from 'selectors';

// Utils
import { formatFiatValue, formatFiatProfit } from 'utils/format';
import { useChainsConfig, useAssetCategoriesConfig } from 'utils/uiConfig';
import { useThemeColors } from 'utils/themes';

// Types
import type { ChainInfo, BalanceInfo } from 'models/Home';
import type { Chain, AssetCategory } from 'models/Asset';

// Local
import { useWalletInfo } from './utils';
import HomeListHeader from './components/HomeListHeader';
import HomeListItem from './components/HomeListItem';


type Props = {|
  showSideChains: boolean,
|};

function AssetsSection({ showSideChains }: Props) {
  const { t, tRoot } = useTranslationWithPrefix('home.assets');
  const navigation = useNavigation();

  const wallet = useWalletInfo();
  const fiatCurrency = useFiatCurrency();

  const chains = useChainsConfig();
  const categories = useAssetCategoriesConfig();
  const colors = useThemeColors();

  const renderBalanceItem = (category: AssetCategory, balance: ?BalanceInfo) => {
    if (!balance || !categories[category]) return null;

    const formattedBalance = formatFiatValue(balance?.balanceInFiat ?? 0, fiatCurrency);
    const formattedProfit = formatFiatProfit(balance.profitInFiat, balance.balanceInFiat, fiatCurrency);
    const { title, iconName } = categories[category];

    return (
      <HomeListItem
        title={title}
        iconName={iconName}
        onPress={() => navigation.navigate(ASSETS, { category })}
        value={formattedBalance}
        secondaryValue={formattedProfit}
        secondaryValueColor={balance.profitInFiat?.gte(0) ? colors.positive : colors.secondaryText}
      />
    );
  };

  const renderChainItems = (chainInfo: ?ChainInfo) => {
    if (!chainInfo) return null;

    const formattedCollectibles = chainInfo.collectibles?.toFixed() ?? '0';
    const formattedContacts = chainInfo.contacts?.toFixed() ?? '0';

    return (
      <>
        {renderBalanceItem(ASSET_CATEGORIES.WALLET, chainInfo.wallet)}
        {renderBalanceItem(ASSET_CATEGORIES.DEPOSITS, chainInfo.deposits)}
        {renderBalanceItem(ASSET_CATEGORIES.INVESTMENTS, chainInfo.investments)}
        {renderBalanceItem(ASSET_CATEGORIES.LIQUIDITY_POOLS, chainInfo.liquidityPools)}
        {renderBalanceItem(ASSET_CATEGORIES.REWARDS, chainInfo.rewards)}
        {renderBalanceItem(ASSET_CATEGORIES.DATASETS, chainInfo.datasets)}

        {chainInfo.collectibles != null && (
          <HomeListItem
            title={tRoot('assetCategories.collectibles')}
            iconName="wallet"
            onPress={() => navigation.navigate(ASSETS)}
            value={formattedCollectibles}
          />
        )}

        {chainInfo.contacts != null && (
          <HomeListItem
            title={t('contacts')}
            iconName="wallet"
            onPress={() => navigation.navigate(CONTACTS_FLOW)}
            value={formattedContacts}
          />
        )}

        {/* Temporary entry until other UI provided */}
        <HomeListItem title={t('services')} iconName="wallet" onPress={() => navigation.navigate(SERVICES_FLOW)} />
      </>
    );
  };

  const renderChain = (chain: Chain, chainInfo: ?ChainInfo) => {
    if (!chainInfo) return null;

    const { title, iconSource, color } = chains[chain];
    return (
      <>
        <HomeListHeader title={title} iconSource={iconSource} color={color} />
        {renderChainItems(chainInfo)}
      </>
    );
  };

  if (!showSideChains) {
    return <Container>{renderChainItems(wallet.ethereum)}</Container>;
  }

  return (
    <Container>
      {renderChain(CHAINS.ETHEREUM, wallet.ethereum)}
      {renderChain(CHAINS.BINANCE, wallet.binance)}
      {renderChain(CHAINS.XDAI, wallet.xdai)}
    </Container>
  );
}

export default AssetsSection;

const Container = styled.View``;
