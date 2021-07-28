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
import { CHAIN } from 'constants/chainConstants';

// Selectors
import { useRootSelector } from 'selectors';
import { accountCollectiblesHistorySelector } from 'selectors/collectibles';
import { archanovaAccountEthereumHistorySelector } from 'selectors/history';

// Utils
import { mapTransactionsHistory } from 'utils/feedData';
import { isNotEtherspotUserEvent } from 'utils/userEvents';


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
  const userEvents = useRootSelector((root) => root.userEvents.data);
  const archanovaUserEvents = (userEvents.ethereum ?? []).filter(isNotEtherspotUserEvent);

  const transactions = useRootSelector(archanovaAccountEthereumHistorySelector);
  const mappedTransactions = mapTransactionsHistory(
    transactions,
    accounts,
    TRANSACTION_EVENT,
    true,
    true,
  );

  // archanova supports only Ethereum mainnet
  const accountCollectiblesHistory = useRootSelector(accountCollectiblesHistorySelector);
  const collectiblesTransactions = accountCollectiblesHistory[CHAIN.ETHEREUM] ?? [];
  const mappedCollectiblesTransactions = mapTransactionsHistory(
    collectiblesTransactions,
    accounts,
    COLLECTIBLE_TRANSACTION,
    true,
  );

  return [
    ...mappedTransactions,
    ...mappedCollectiblesTransactions,
    ...archanovaUserEvents,
  ];
}
