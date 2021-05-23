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
import FiatChangeView from 'components/modern/FiatChangeView';
import FloatingButtons from 'components/FloatingButtons';

// Constants
import { SERVICES_FLOW } from 'constants/navigationConstants';

// Selectors
import { useFiatCurrency } from 'selectors';
import { useSupportedChains } from 'selectors/chains';

// Utils
import { spacing } from 'utils/variables';
import { type HeaderListItem, prepareHeaderListItems } from 'utils/headerList';
import { formatPercentValue } from 'utils/format';

// Types
import type { SectionBase } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';
import type { DepositAssetBalance } from 'models/Balances';

// Local
import { type FlagPerChain, useExpandItemsPerChain } from '../utils';
import ChainListHeader from '../components/ChainListHeader';
import ChainListFooter from '../components/ChainListFooter';
import ServiceListHeader from '../components/ServiceListHeader';
import DepositListItem from './DepositListItem';
import { useDepositsBalance, useDepositsChainBalances, useDepositsAssets } from './selectors';

function DepositsTab() {
  const { t, tRoot } = useTranslationWithPrefix('assets.deposits');
  const navigation = useNavigation();
  const safeArea = useSafeAreaInsets();

  const initialChain: ?Chain = navigation.getParam('chain');
  const { expandItemsPerChain, toggleExpandItems } = useExpandItemsPerChain(initialChain);

  const totalBalance = useDepositsBalance();
  const sections = useSectionData(expandItemsPerChain);
  const currency = useFiatCurrency();

  const navigateToServices = () => {
    // TODO: navigate to new Wallet Connect screen when available
    navigation.navigate(SERVICES_FLOW);
  };

  const buttons = [{ title: t('deposit'), iconName: 'plus', onPress: navigateToServices }];

  const renderListHeader = () => {
    const { value, change } = totalBalance;
    return (
      <ListHeader>
        <BalanceView balance={totalBalance.value} style={styles.balanceView} />
        {!!change && <FiatChangeView value={value} change={totalBalance.change} currency={currency} />}
      </ListHeader>
    );
  };

  const renderSectionHeader = ({ chain, balance }: Section) => {
    return <ChainListHeader chain={chain} balance={balance} onPress={() => toggleExpandItems(chain)} />;
  };

  const renderItem = (headerListItem: HeaderListItem<DepositAssetBalance>) => {
    if (headerListItem.type === 'header') {
      return <ServiceListHeader title={headerListItem.key} />;
    }

    const { title, iconUrl, value, change, currentApy } = headerListItem.item;
    const formattedCurrentApy = formatPercentValue(currentApy);
    const subtitle = formattedCurrentApy ? tRoot('label.currentApyFormat', { value: formattedCurrentApy }) : undefined;

    return <DepositListItem title={title} subtitle={subtitle} iconUrl={iconUrl} value={value} change={change} />;
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

export default DepositsTab;

type Section = {
  ...SectionBase<HeaderListItem<DepositAssetBalance>>,
  chain: Chain,
  balance: BigNumber,
};

const useSectionData = (expandItemsPerChain: FlagPerChain): Section[] => {
  const chains = useSupportedChains();
  const balancePerChain = useDepositsChainBalances();
  const assetsPerChain = useDepositsAssets();

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
