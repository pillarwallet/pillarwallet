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
import { LayoutAnimation, SectionList } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';
import { orderBy } from 'lodash';

// Components
import BalanceView from 'components/BalanceView';
import BottomModal from 'components/modern/BottomModal';
import FiatChangeView from 'components/modern/FiatChangeView';
import FloatingButtons from 'components/FloatingButtons';
import Modal from 'components/Modal';

import { LENDING_ADD_DEPOSIT_FLOW, RARI_DEPOSIT } from 'constants/navigationConstants';

// Selectors
import { useRootSelector, useFiatCurrency } from 'selectors';
import { depositsBalanceSelector } from 'selectors/balances';
import { useSupportedChains } from 'selectors/smartWallet';

// Utils
import { sum } from 'utils/bigNumber';
import { LIST_ITEMS_APPEARANCE } from 'utils/layoutAnimations';
import { spacing } from 'utils/variables';

// Types
import type { SectionBase, ImageSource } from 'utils/types/react-native';
import { type Chain, type ChainRecord } from 'models/Chain';
import type { FiatBalance } from 'models/Value';

// Local
import ChainListHeader from '../items/ChainListHeader';
import ServiceListItem from '../items/ServiceListItem';
import AssetListItem from '../items/AssetListItem';

const aaveIcon = require('assets/images/apps/aave.png');
const rariIcon = require('assets/images/rari_logo.png');

type FlagPerChain = { [Chain]: ?boolean };

function DepositsTab() {
  const { t, tRoot } = useTranslationWithPrefix('assets.deposits');
  const navigation = useNavigation();
  const safeArea = useSafeAreaInsets();

  const { chain: initialChain } = navigation.state.params;

  const [showItemsPerChain, setShowItemsPerChain] = React.useState<FlagPerChain>({ [initialChain]: true });

  const categoryBalance = useCategoryBalance();
  const assets = useChainAssets();
  const currency = useFiatCurrency();
  const chains = useSupportedChains();

  const sections = chains.map((chain) => {
    const items = getSectionItems(assets[chain] ?? []);
    const balance = sum(items.map(item => item.value));

    return {
      key: chain,
      chain,
      balance,
      data: showItemsPerChain[chain] ? items : [],
    };
  });

  const toggleShowItems = (chain: Chain) => {
    LayoutAnimation.configureNext(LIST_ITEMS_APPEARANCE);
    // $FlowFixMe: flow is able to handle this
    setShowItemsPerChain({ ...showItemsPerChain, [chain]: !showItemsPerChain[chain] });
  };

  const navigateToServices = () => {
    Modal.open(() => (
      <BottomModal title={t('deposit')}>
        <ServiceListItem
          title={tRoot('services.aave')}
          iconSource={aaveIcon}
          onPress={() => navigation.navigate(LENDING_ADD_DEPOSIT_FLOW)}
        />
        <ServiceListItem
          title={tRoot('services.rari')}
          iconSource={rariIcon}
          onPress={() => navigation.navigate(RARI_DEPOSIT)}
        />
      </BottomModal>
    ));
  };

  const buttons = [{ title: t('deposit'), iconName: 'plus', onPress: navigateToServices }];

  const renderListHeader = () => {
    const { value, change } = categoryBalance;
    return (
      <ListHeader>
        <BalanceView balance={value} style={styles.balanceView} />
        {!!change && <FiatChangeView value={value} change={change} currency={currency} />}
      </ListHeader>
    );
  };

  const renderSectionHeader = ({ chain, balance }: Section) => {
    return <ChainListHeader chain={chain} balance={balance} onPress={() => toggleShowItems(chain)} />;
  };

  const renderItem = ({ title, iconSource, value, change, service, showServiceTitle }: Item) => {
    const subtitle = "Current APY: 2.04%";
    return (
      <AssetListItem
        title={title}
        subtitle={subtitle}
        iconSource={iconSource}
        value={value}
        change={change}
        serviceTitle={service}
        showServiceTitle={showServiceTitle}
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
  ...SectionBase<Item>,
  chain: Chain,
  balance: BigNumber,
};

type Item = {|
  key: string,
  service: string,
  showServiceTitle?: boolean, // Controls whether to show service title header
  title: string,
  iconSource: ImageSource,
  value: BigNumber,
  change?: BigNumber,
|};

// Because we display three level data (chain -> service -> item) but SectionList supports only two levels, we need to handle service header at the level of list item
export function getSectionItems(items: Item[]): Item[] {
  const sortedItems = orderBy(items, ['service', 'value'], ['asc', 'desc']);
  return sortedItems.map((item, index) => {
    return sortedItems[index - 1]?.service !== item.service ? { ...item, showServiceTitle: true } : item;
  });
}

const useCategoryBalance = (): FiatBalance => {
  const value = useRootSelector(depositsBalanceSelector);
  return { value: BigNumber(110), change: BigNumber(10) };
};

// PROVIDE REAL DATA HERE
const useChainAssets = (): ChainRecord<Item[]> => {
  const ethereum = [
    {
      key: 'rari-1',
      title: 'Stable pool',
      service: 'Rari',
      iconSource: rariIcon,
      value: BigNumber(10),
      change: BigNumber(1.2),
    },
    {
      key: 'rari-2',
      title: 'Yield pool',
      service: 'Rari',
      iconSource: rariIcon,
      value: BigNumber(15),
      change: BigNumber(5),
    },
    {
      key: 'aave-1',
      title: 'AAVE Pool 1',
      service: 'Aave',
      iconSource: aaveIcon,
      value: BigNumber(10),
      change: BigNumber(1.2),
    },
  ];

  const polygon = [
    {
      key: 'rari-3',
      title: 'Stable pool',
      service: 'Rari',
      iconSource: rariIcon,
      value: BigNumber(10),
      change: BigNumber(1.2),
    },
  ];

  return { ethereum, polygon };
};

const styles = {
  balanceView: {
    marginBottom: spacing.extraSmall,
  }
}

const Container = styled.View`
  flex: 1;
`;

const ListHeader = styled.View`
  align-items: center;
  margin: ${spacing.largePlus}px 0 ${spacing.small}px;
`;
