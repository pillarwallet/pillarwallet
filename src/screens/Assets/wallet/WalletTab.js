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
import ChainListHeader from 'components/modern/ChainListHeader';
import ChainListFooter from 'components/modern/ChainListFooter';
import FiatChangeView from 'components/modern/FiatChangeView';
import FloatingButtons from 'components/FloatingButtons';
import Modal from 'components/Modal';
import AddFundsModal from 'components/AddFundsModal';
import ReceiveModal from 'screens/Asset/ReceiveModal';

// Contants
import { ASSET, EXCHANGE_FLOW, SEND_TOKEN_FROM_HOME_FLOW } from 'constants/navigationConstants';

// Selectors
import { useRootSelector, useRates, useFiatCurrency, activeAccountAddressSelector } from 'selectors';
import { assetRegistrySelector } from 'selectors/assets';
import { useIsPillarPaySupported } from 'selectors/archanova';
import { useSupportedChains } from 'selectors/chains';

// Utils
import { getRate, getAssetFromRegistry } from 'utils/assets';
import { sum } from 'utils/bigNumber';
import { spacing } from 'utils/variables';

// Types
import type { SectionBase } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';

// Local
import PillarPaySummary from '../components/PillarPaySummary';
import WalletListItem from './WalletListItem';
import { type FlagPerChain, useExpandItemsPerChain, buildAssetDataNavigationParam } from '../utils';
import { type WalletItem, useWalletBalance, useWalletAssets } from './selectors';

function WalletTab() {
  const { tRoot } = useTranslationWithPrefix('assets.wallet');
  const navigation = useNavigation();
  const safeArea = useSafeAreaInsets();

  const initialChain: ?Chain = navigation.getParam('chain');
  const { expandItemsPerChain, toggleExpandItems } = useExpandItemsPerChain(initialChain);

  const totalBalance = useWalletBalance();
  const sections = useSectionData(expandItemsPerChain);
  const currency = useFiatCurrency();
  const assetRegistry = useRootSelector(assetRegistrySelector);
  const accountAddress = useRootSelector(activeAccountAddressSelector);
  const isPillarPaySupported = useIsPillarPaySupported();

  const showReceiveModal = () => {
    Modal.open(() => <ReceiveModal address={accountAddress} />);
  };

  const showAddFundsModal = () => {
    Modal.open(() => <AddFundsModal receiveAddress={accountAddress} />);
  };

  const navigateToAssetDetails = (item: WalletItem) => {
    const asset = getAssetFromRegistry(assetRegistry, item.symbol);
    if (!asset) return;

    const assetData = buildAssetDataNavigationParam(asset);
    navigation.navigate(ASSET, { assetData });
  };

  const renderListHeader = () => {
    const { value, change } = totalBalance;
    return (
      <ListHeader>
        <BalanceView balance={totalBalance.value} />
        {!!change && (
          <FiatChangeView value={value} change={totalBalance.change} currency={currency} style={styles.balanceChange} />
        )}

        {isPillarPaySupported && <PillarPaySummary style={styles.pillarPay} />}
      </ListHeader>
    );
  };

  const renderSectionHeader = ({ chain, balance }: Section) => {
    return <ChainListHeader chain={chain} balance={balance} onPress={() => toggleExpandItems(chain)} />;
  };

  const renderItem = (item: WalletItem) => {
    return (
      <WalletListItem
        title={item.title}
        iconUrl={item.iconUrl}
        value={item.value}
        change={item.change}
        symbol={item.symbol}
        onPress={() => navigateToAssetDetails(item)}
      />
    );
  };

  const hasPositiveBalance = totalBalance.value.gt(0);
  const buttons = [
    hasPositiveBalance && {
      title: tRoot('button.receive'),
      iconName: 'qrcode',
      onPress: showReceiveModal,
    },
    hasPositiveBalance && {
      title: tRoot('button.swap'),
      iconName: 'exchange',
      onPress: () => navigation.navigate(EXCHANGE_FLOW),
    },
    hasPositiveBalance && {
      title: tRoot('button.send'),
      iconName: 'send',
      onPress: () => navigation.navigate(SEND_TOKEN_FROM_HOME_FLOW),
    },
    !hasPositiveBalance && {
      title: tRoot('button.addCash'),
      iconName: 'plus',
      onPress: showAddFundsModal,
    },
  ];

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

export default WalletTab;

type Section = {
  ...SectionBase<WalletItem>,
  chain: Chain,
  balance: BigNumber,
};

const useSectionData = (expandItemsPerChain: FlagPerChain): Section[] => {
  const chains = useSupportedChains();
  const assetsPerChain = useWalletAssets();
  const rates = useRates();
  const currency = useFiatCurrency();

  return chains.map((chain) => {
    const items = assetsPerChain[chain] ?? [];
    const balance = sum(items.map((item) => item.value.times(getRate(rates, item.symbol, currency))));
    const data = expandItemsPerChain[chain] ? items : [];
    return { key: chain, chain, balance, data };
  });
};

const styles = {
  balanceChange: {
    marginTop: spacing.extraSmall,
  },
  pillarPay: {
    marginTop: spacing.largePlus,
  },
};

const Container = styled.View`
  flex: 1;
`;

const ListHeader = styled.View`
  align-items: center;
  margin-top: ${spacing.largePlus}px;
  margin-bottom: 40px;
`;
