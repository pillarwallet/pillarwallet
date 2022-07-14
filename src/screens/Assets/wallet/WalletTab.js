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
import Modal from 'components/Modal';
import Banner from 'components/Banner/Banner';

// Screens
import ReceiveModal from 'screens/Asset/ReceiveModal';

// Constants
import { ASSET, BRIDGE_FLOW, SEND_TOKEN_FROM_HOME_FLOW, ADD_CASH } from 'constants/navigationConstants';

// Selectors
import {
  useRootSelector,
  useFiatCurrency,
  useIsExchangeAvailable,
  supportedAssetsPerChainSelector,
  useActiveAccount,
  activeAccountAddressSelector,
} from 'selectors';
import { useIsPillarPaySupported } from 'selectors/archanova';
import { useSupportedChains } from 'selectors/chains';

// Utils
import { findAssetByAddress } from 'utils/assets';
import { spacing } from 'utils/variables';
import { isKeyBasedAccount } from 'utils/accounts';
import { getActiveScreenName } from 'utils/navigation';

// Types
import type { SectionBase } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';

// Local
import PillarPaySummary from '../components/PillarPaySummary';
import WalletListItem from './WalletListItem';
import { type FlagPerChain, useExpandItemsPerChain, buildAssetDataNavigationParam } from '../utils';
import { type WalletItem, useWalletTotalBalance, useWalletBalancePerChain, useWalletAssetsPerChain } from './selectors';

function WalletTab() {
  const { tRoot } = useTranslationWithPrefix('assets.wallet');
  const navigation = useNavigation();
  const safeArea = useSafeAreaInsets();

  const initialChain: ?Chain = navigation.getParam('chain');
  const { expandItemsPerChain, toggleExpandItems } = useExpandItemsPerChain(initialChain);

  const totalBalance = useWalletTotalBalance();
  const sections = useSectionData(expandItemsPerChain);
  const currency = useFiatCurrency();
  const screenName = getActiveScreenName(navigation);

  const supportedAssets = useRootSelector(supportedAssetsPerChainSelector);

  const activeAccount = useActiveAccount();
  const accountAddress = useRootSelector(activeAccountAddressSelector);

  const isExchangeAvailable = useIsExchangeAvailable();
  const isPillarPaySupported = useIsPillarPaySupported();

  const showReceiveModal = () => {
    Modal.open(() => <ReceiveModal address={accountAddress} />);
  };

  const navigateToAssetDetails = (item: WalletItem) => {
    const { chain, assetAddress } = item;

    const chainSupportedAssets = supportedAssets[chain] ?? [];

    const asset = findAssetByAddress(chainSupportedAssets, assetAddress);
    if (!asset) return;

    const assetData = buildAssetDataNavigationParam(asset, chain);
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
        <Banner screenName={screenName} bottomPosition={false} />
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

  const renderItem = (item: WalletItem) => {
    return (
      <WalletListItem
        title={item.title}
        iconUrl={item.iconUrl}
        value={item.value}
        change={item.change}
        assetSymbol={item.assetSymbol}
        assetAddress={item.assetAddress}
        onPress={() => navigateToAssetDetails(item)}
        chain={item.chain}
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
    isExchangeAvailable &&
    hasPositiveBalance && {
      title: tRoot('button.swap'),
      iconName: 'exchange',
      onPress: () => navigation.navigate(BRIDGE_FLOW),
    },
    hasPositiveBalance && {
      title: tRoot('button.send'),
      iconName: 'send',
      onPress: () => navigation.navigate(SEND_TOKEN_FROM_HOME_FLOW),
    },
    !isKeyBasedAccount(activeAccount) &&
    !hasPositiveBalance && {
      title: tRoot('button.addCash'),
      iconName: 'plus',
      onPress: () => navigation.navigate(ADD_CASH),
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
  balance: ?BigNumber,
};

const useSectionData = (expandItemsPerChain: FlagPerChain): Section[] => {
  const chains = useSupportedChains();
  const assetsPerChain = useWalletAssetsPerChain();
  const balancePerChain = useWalletBalancePerChain();

  return chains.map((chain) => {
    const items = assetsPerChain[chain] ?? [];
    const balance = balancePerChain[chain];
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
