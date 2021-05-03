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

// Components
import BalanceView from 'components/BalanceView';
import BottomModal from 'components/modern/BottomModal';
import FiatChangeView from 'components/modern/FiatChangeView';
import FloatingButtons from 'components/FloatingButtons';
import Modal from 'components/Modal';

import { LENDING_ADD_DEPOSIT_FLOW, RARI_DEPOSIT } from 'constants/navigationConstants';

// Selectors
import { useFiatCurrency } from 'selectors';
import { useSupportedChains } from 'selectors/smartWallet';

// Utils
import { sum } from 'utils/bigNumber';
import { LIST_ITEMS_APPEARANCE } from 'utils/layoutAnimations';
import { spacing } from 'utils/variables';
import { type HeaderListItem, prepareHeaderListItems } from 'utils/headerList';
import { formatPercentValue } from 'utils/format';

// Types
import type { SectionBase } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';

// Local
import { type DepositItem, useDepositsBalance, useDepositsAssets } from '../selectors/deposits';
import ChainListHeader from '../components/ChainListHeader';
import ServiceListHeader from '../components/ServiceListHeader';
import AssetListItem from '../items/AssetListItem';
import ServiceListItem from '../items/ServiceListItem';

const aaveIcon = require('assets/images/apps/aave.png');
const rariIcon = require('assets/images/rari_logo.png');

type FlagPerChain = { [Chain]: ?boolean };

function DepositsTab() {
  const { t, tRoot } = useTranslationWithPrefix('assets.deposits');
  const navigation = useNavigation();
  const safeArea = useSafeAreaInsets();

  const { chain: initialChain } = navigation.state.params;

  const [showItemsPerChain, setShowItemsPerChain] = React.useState<FlagPerChain>({ [initialChain]: true });

  const totalBalance = useDepositsBalance();
  const assets = useDepositsAssets();
  const currency = useFiatCurrency();
  const chains = useSupportedChains();

  const sections: Section[] = chains.map((chain) => {
    const items = assets[chain] ?? [];
    const balance = sum(items.map((item) => item.value));

    return {
      key: chain,
      chain,
      balance,
      data: showItemsPerChain[chain] ? prepareHeaderListItems(items, (item) => item.service) : [],
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
    const { value, change } = totalBalance;
    return (
      <ListHeader>
        <BalanceView balance={totalBalance.value} style={styles.balanceView} />
        {!!change && <FiatChangeView value={value} change={totalBalance.change} currency={currency} />}
      </ListHeader>
    );
  };

  const renderSectionHeader = ({ chain, balance }: Section) => {
    return <ChainListHeader chain={chain} balance={balance} onPress={() => toggleShowItems(chain)} />;
  };

  const renderItem = (headerListItem: HeaderListItem<DepositItem>) => {
    if (headerListItem.type === 'header') {
      return <ServiceListHeader title={headerListItem.key} />;
    }

    const { title, iconSource, value, change, currentApy } = headerListItem.item;
    const formattedCurrencApy = formatPercentValue(currentApy);
    const subtitle = formattedCurrencApy ? tRoot('label.currentApyFormat', { value: formattedCurrencApy }) : undefined;
    return <AssetListItem title={title} subtitle={subtitle} iconSource={iconSource} value={value} change={change} />;
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
