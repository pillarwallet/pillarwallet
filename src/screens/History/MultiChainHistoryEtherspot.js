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
import React, { useState } from 'react';

// Components
import HistoryList from 'components/HistoryList';
import TabView from 'components/modern/TabView';

// Selectors
import {
  activeAccountAddressSelector,
  supportedAssetsPerChainSelector,
  useRootSelector,
} from 'selectors';
import { accountHistorySelector } from 'selectors/history';
import { accountAssetsPerChainSelector } from 'selectors/assets';
import { accountCollectiblesHistorySelector } from 'selectors/collectibles';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Utils
import { getHistoryEventsFromTransactions, parseHistoryEventFee } from 'utils/history';
import { addressesEqual, getAssetsAsList } from 'utils/assets';
import { useChainsConfig } from 'utils/uiConfig';

// Types
import { EVENT_TYPE, type Event } from 'models/History';
import type { Chain } from 'models/Chain';

function MultiChainHistoryEtherspot() {
  const [tabIndex, setTabIndex] = useState(0);

  const chainsConfig = useChainsConfig();

  const chains = [
    CHAIN.ETHEREUM,
    CHAIN.POLYGON,
    CHAIN.BINANCE,
    CHAIN.XDAI,
  ];

  const items = chains.map((chain) => {
    const { titleShort } = chainsConfig[chain];

    return {
      key: chain,
      title: titleShort,
      render: () => <ChainHistoryView chain={chain} />,
    };
  });

  return (
    <TabView
      items={items}
      tabIndex={tabIndex}
      onTabIndexChange={setTabIndex}
      scrollEnabled
    />
  );
}

export default MultiChainHistoryEtherspot;

function ChainHistoryView({ chain }: { chain: Chain }) {
  const items = useHistoryEvents(chain);

  return <HistoryList items={items} chain={chain} />;
}

function useHistoryEvents(chain: Chain): Event[] {
  const activeAccountAddress = useRootSelector(activeAccountAddressSelector);
  const accountHistory = useRootSelector(accountHistorySelector);
  const accountAssets = useRootSelector(accountAssetsPerChainSelector);
  const chainAccountAssets = getAssetsAsList(accountAssets[chain] ?? {});
  const supportedAssets = useRootSelector(supportedAssetsPerChainSelector);
  const chainSupportedAssets = supportedAssets[chain] ?? [];
  const accountCollectiblesHistory = useRootSelector(accountCollectiblesHistorySelector);

  const transactionsHistory = accountHistory[chain] ?? [];
  const collectiblesHistory = accountCollectiblesHistory[chain] ?? [];

  const mappedCollectiblesHistory = collectiblesHistory.map(({
    _id,
    hash,
    batchHash,
    createdAt,
    from: fromAddress,
    to: toAddress,
    icon: imageUrl,
    status,
    assetSymbol: title,
    feeWithGasToken,
    gasUsed,
    gasPrice,
  }) => {
    const fee = parseHistoryEventFee(chain, feeWithGasToken, gasUsed, gasPrice);
    const eventType = addressesEqual(fromAddress, activeAccountAddress)
      ? EVENT_TYPE.COLLECTIBLE_SENT
      : EVENT_TYPE.COLLECTIBLE_RECEIVED;

    return {
      id: _id,
      hash,
      batchHash,
      date: new Date(+createdAt * 1000),
      fromAddress,
      toAddress,
      imageUrl,
      type: eventType,
      status,
      title,
      fee,
    };
  });

  const mappedTransactionsHistory = getHistoryEventsFromTransactions(
    transactionsHistory,
    chain,
    activeAccountAddress,
    chainAccountAssets,
    chainSupportedAssets,
  );

  return [
    ...mappedTransactionsHistory,
    ...mappedCollectiblesHistory,
  ];
}
