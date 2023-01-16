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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import BalanceView from 'components/BalanceView';
import ChainListHeader from 'components/lists/ChainListHeader';
import ChainListFooter from 'components/lists/ChainListFooter';
import FiatChangeView from 'components/display/FiatChangeView';
import FloatingButtons from 'components/FloatingButtons';
import Banner from 'components/Banner/Banner';

// Constants
import { WALLETCONNECT } from 'constants/navigationConstants';

// Selectors
import { useFiatCurrency, useUsdToFiatRate } from 'selectors';
import { useSupportedChains } from 'selectors/chains';

// Utils
import { formatLiquidityPoolShare } from 'utils/format';
import { type HeaderListItem, prepareHeaderListItems } from 'utils/headerList';
import { getFiatValueFromUsd } from 'utils/rates';
import { spacing } from 'utils/variables';

// Types
import type { SectionBase } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';
import type { ServiceAssetBalance } from 'models/Balances';

// Local
import { type FlagPerChain, useExpandItemsPerChain } from '../utils';
import ServiceListHeader from '../components/ServiceListHeader';
import { useLiquidityPoolsTotalBalance, useLiquidityPoolsBalancePerChain, useLiquidityPoolAssets } from './selectors';
import LiquidityPoolListItem from './LiquidityPoolListItem';

function LiquidityPoolsTab() {
  const { t } = useTranslationWithPrefix('assets.liquidityPools');
  const navigation = useNavigation();
  const safeArea = useSafeAreaInsets();

  const initialChain: ?Chain = navigation.getParam('chain');
  const { expandItemsPerChain, toggleExpandItems } = useExpandItemsPerChain(initialChain);

  const totalBalance = useLiquidityPoolsTotalBalance();
  const sections = useSectionData(expandItemsPerChain);
  const currency = useFiatCurrency();
  const usdToFiatRate = useUsdToFiatRate();

  const navigateToWalletConnect = () => navigation.navigate(WALLETCONNECT);

  const buttons = [{ title: t('addLiquidity'), iconName: 'plus', onPress: navigateToWalletConnect }];

  const renderListHeader = () => {
    const { value, change } = totalBalance;
    return (
      <ListHeader>
        <BalanceView balance={totalBalance.value} style={styles.balanceView} />
        {!!change && <FiatChangeView value={value} change={totalBalance.change} currency={currency} />}
        <BannerContent>
          <Banner screenName="LIQUIDITY_POOLS" bottomPosition={false} />
        </BannerContent>
      </ListHeader>
    );
  };

  const renderSectionHeader = ({ chain, balance }: Section) => {
    return (
      <ChainListHeader
        chain={chain}
        balance={balance}
        isExpanded={expandItemsPerChain[chain] ?? null}
        onPress={() => toggleExpandItems(chain)}
      />
    );
  };

  const renderItem = (headerListItem: HeaderListItem<ServiceAssetBalance>) => {
    if (headerListItem.type === 'header') {
      return <ServiceListHeader title={headerListItem.key} />;
    }

    const { title, iconUrl, valueInUsd, changeInUsd, share } = headerListItem.item;
    const value = getFiatValueFromUsd(valueInUsd, usdToFiatRate);
    const change = getFiatValueFromUsd(changeInUsd, usdToFiatRate);
    const formattedShare = formatLiquidityPoolShare(share);

    return (
      <LiquidityPoolListItem
        title={title}
        subtitle={share ? t('poolShare', { share: formattedShare }) : null}
        iconUrl={iconUrl}
        value={value}
        change={change}
      />
    );
  };

  return (
    <Container>
      <SectionList
        sections={sections}
        renderSectionHeader={({ section }) => renderSectionHeader(section)}
        renderSectionFooter={() => <ChainListFooter />}
        renderItem={({ item }) => renderItem(item)}
        ListHeaderComponent={renderListHeader()}
        contentContainerStyle={{ paddingBottom: safeArea.bottom + FloatingButtons.SCROLL_VIEW_BOTTOM_INSET }}
      />

      <FloatingButtons items={buttons} />
    </Container>
  );
}

export default LiquidityPoolsTab;

type Section = {
  ...SectionBase<HeaderListItem<ServiceAssetBalance>>,
  chain: Chain,
    balance: BigNumber,
};

const useSectionData = (expandItemsPerChain: FlagPerChain): Section[] => {
  const chains = useSupportedChains();
  const balancePerChain = useLiquidityPoolsBalancePerChain();
  const assetsPerChain = useLiquidityPoolAssets();

  return chains.map((chain) => {
    const items = assetsPerChain[chain] ?? [];
    const balance = balancePerChain[chain] ?? BigNumber(0);
    const data = expandItemsPerChain[chain] ? prepareHeaderListItems(items, (item) => item.service) : [];
    return { key: chain, chain, balance, data };
  });
};

const styles = {
  balanceView: {
    marginBottom: spacing.extraSmall,
  },
};

const Container = styled.View`
  flex: 1;
`;

const ListHeader = styled.View`
  align-items: center;
  margin-top: ${spacing.largePlus}px;
  margin-bottom: 32px;
`;

const BannerContent = styled.View`
  width: 100%;
`;
