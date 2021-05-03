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
import BottomModal from 'components/modern/BottomModal';
import FiatChangeView from 'components/modern/FiatChangeView';
import FloatingButtons from 'components/FloatingButtons';
import Modal from 'components/Modal';

// Selectors
import { useFiatCurrency } from 'selectors';
import { useSupportedChains } from 'selectors/smartWallet';

// Utils
import { sum } from 'utils/bigNumber';
import { spacing } from 'utils/variables';
import { type HeaderListItem, prepareHeaderListItems } from 'utils/headerList';
import { formatPercentValue } from 'utils/format';

// Types
import type { SectionBase } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';

// Local
import { type FlagPerChain, useExpandItemsPerChain } from '../utils';
import ChainListHeader from '../components/ChainListHeader';
import ServiceListHeader from '../components/ServiceListHeader';
import AssetListItem from '../items/AssetListItem';
import ServiceListItem from '../items/ServiceListItem';
import { type DepositItem, useDepositsBalance, useDepositsAssets, useDepositApps } from './selectors';

function DepositsTab() {
  const { t, tRoot } = useTranslationWithPrefix('assets.deposits');
  const navigation = useNavigation();
  const safeArea = useSafeAreaInsets();

  const { chain: initialChain } = navigation.state.params;

  const { expandItemsPerChain, toggleExpandItems } = useExpandItemsPerChain(initialChain);

  const totalBalance = useDepositsBalance();
  const sections = useSectionData(expandItemsPerChain);
  const apps = useDepositApps();
  const currency = useFiatCurrency();

  const navigateToServices = () => {
    Modal.open(() => (
      <BottomModal title={t('deposit')}>
        {apps.map(({ title, iconSource, navigationPath }) => (
          <ServiceListItem
            key={title}
            title={title}
            iconSource={iconSource}
            onPress={() => navigation.navigate(navigationPath)}
          />
        ))}
      </BottomModal>
    ));
  };

  const buttons = [apps.length > 0 && { title: t('deposit'), iconName: 'plus', onPress: navigateToServices }];

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

  const renderItem = (headerListItem: HeaderListItem<DepositItem>) => {
    if (headerListItem.type === 'header') {
      return <ServiceListHeader title={headerListItem.key} />;
    }

    const { title, iconSource, value, interests, currentApy, navigateAction } = headerListItem.item;
    const formattedCurrencApy = formatPercentValue(currentApy);
    const subtitle = formattedCurrencApy ? tRoot('label.currentApyFormat', { value: formattedCurrencApy }) : undefined;
    return (
      <AssetListItem
        title={title}
        subtitle={subtitle}
        iconSource={iconSource}
        value={value}
        change={interests}
        onPress={navigateAction}
      />
    );
  };

  return (
    <Container>
      <SectionList
        sections={sections}
        renderSectionHeader={({ section }) => renderSectionHeader(section)}
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
  ...SectionBase<HeaderListItem<DepositItem>>,
  chain: Chain,
  balance: BigNumber,
};

const useSectionData = (expandItemsPerChain: FlagPerChain): Section[] => {
  const chains = useSupportedChains();
  const assetsPerChain = useDepositsAssets();

  return chains.map((chain) => {
    const items = assetsPerChain[chain] ?? [];
    const balance = sum(items.map((item) => item.value));

    return {
      key: chain,
      chain,
      balance,
      data: expandItemsPerChain[chain] ? prepareHeaderListItems(items, (item) => item.service) : [],
    };
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
  margin: ${spacing.largePlus}px 0 ${spacing.small}px;
`;
