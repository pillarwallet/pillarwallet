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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Components
import ActivityFeed from 'components/ActivityFeed';

// Constants
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';

// Selectors
import { useRootSelector } from 'selectors';
import { combinedCollectiblesHistorySelector } from 'selectors/collectibles';
import { combinedHistorySelector } from 'selectors/history';
import { sablierEventsSelector } from 'selectors/sablier';

// Utils
import { mapTransactionsHistory, mapOpenSeaAndBCXTransactionsHistory } from 'utils/feedData';


function HistoryListArchanova() {
  const navigation = useNavigation();
  const safeArea = useSafeAreaInsets();

  const feedItems = useHistoryFeedItems();

  return (
    <ActivityFeed
      feedData={feedItems}
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
  const history = useRootSelector(combinedHistorySelector);
  const openSeaTxHistory = useRootSelector(combinedCollectiblesHistorySelector);
  const userEvents = useRootSelector((root) => root.userEvents.data);
  const badgesEvents = useRootSelector((root) => root.badges.badgesEvents);
  const sablierEvents = useRootSelector(sablierEventsSelector);

  const tokenTxHistory = history
    .filter(({ tranType }) => tranType !== 'collectible')
    .filter((historyItem) => historyItem.asset !== 'BTC');
  const bcxCollectiblesTxHistory = history.filter(({ tranType }) => tranType === 'collectible');

  const transactionsOnMainnet = mapTransactionsHistory(tokenTxHistory, accounts, TRANSACTION_EVENT, true, true);

  const collectiblesTransactions = mapOpenSeaAndBCXTransactionsHistory(
    openSeaTxHistory,
    bcxCollectiblesTxHistory,
    true,
  );

  const mappedCTransactions = mapTransactionsHistory(collectiblesTransactions, accounts, COLLECTIBLE_TRANSACTION, true);

  return [...transactionsOnMainnet, ...mappedCTransactions, ...userEvents, ...badgesEvents, ...sablierEvents];
}
