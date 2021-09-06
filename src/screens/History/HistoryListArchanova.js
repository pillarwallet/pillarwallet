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

import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigation } from 'react-navigation-hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Components
import ActivityFeed from 'components/legacy/ActivityFeed';
import RefreshControl from 'components/RefreshControl';

// Constants
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import { CHAIN } from 'constants/chainConstants';

// Selectors
import { useActiveAccount, useRootSelector } from 'selectors';
import { accountCollectiblesHistorySelector } from 'selectors/collectibles';
import { archanovaAccountEthereumHistorySelector, isFetchingHistorySelector } from 'selectors/history';

// Actions
import { fetchTransactionsHistoryAction } from 'actions/historyActions';

// Utils
import { mapTransactionsHistory } from 'utils/feedData';
import { getAccountId } from 'utils/accounts';
import { parseTimestamp } from 'utils/common';


function HistoryListArchanova() {
  const navigation = useNavigation();
  const safeArea = useSafeAreaInsets();
  const dispatch = useDispatch();

  const isRefreshing = useRootSelector(isFetchingHistorySelector);
  const feedItems = useHistoryFeedItems();

  const handleRefresh = () => {
    dispatch(fetchTransactionsHistoryAction());
  };

  const flatListProps = {
    refreshControl: <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />,
  };

  return (
    <ActivityFeed
      feedData={feedItems}
      flatListProps={flatListProps}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: safeArea.bottom }}
      navigation={navigation}
      isForAllAccounts
    />
  );
}

export default HistoryListArchanova;

// Extracted from legacy `Home` screen
function useHistoryFeedItems(): any[] {
  const accounts = useRootSelector((root) => root.accounts.data);
  const walletEvents = useRootSelector((root) => root.walletEvents.data);
  const activeAccount = useActiveAccount();

  const mappedArchanovaEthereumWalletEvents = useMemo(() => {
    const archanovaEthereumWalletEvents = activeAccount
      ? walletEvents?.[getAccountId(activeAccount)]?.ethereum ?? []
      : [];

    return archanovaEthereumWalletEvents.map((walletEvent) => ({
      ...walletEvent,
      createdAt: new Date(parseTimestamp(walletEvent.date) / 1000),
    }));
  }, [activeAccount, walletEvents]);

  const transactions = useRootSelector(archanovaAccountEthereumHistorySelector);
  const mappedTransactions = useMemo(
    () => mapTransactionsHistory(
      transactions,
      accounts,
      TRANSACTION_EVENT,
      true,
      true,
    ),
    [transactions, accounts],
  );

  // archanova supports only Ethereum mainnet
  const accountCollectiblesHistory = useRootSelector(accountCollectiblesHistorySelector);
  const mappedCollectiblesTransactions = useMemo(() => {
    const collectiblesTransactions = accountCollectiblesHistory[CHAIN.ETHEREUM] ?? [];

    return mapTransactionsHistory(
      collectiblesTransactions,
      accounts,
      COLLECTIBLE_TRANSACTION,
      true,
    );
  }, [accountCollectiblesHistory, accounts]);

  return [
    ...mappedTransactions,
    ...mappedCollectiblesTransactions,
    ...mappedArchanovaEthereumWalletEvents,
  ];
}
