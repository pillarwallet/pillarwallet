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
import React, { useState, useMemo } from 'react';

// Components
import HistoryList from 'components/HistoryList';
import TabView from 'components/layout/TabView';

// Selectors
import {
  activeAccountAddressSelector,
  supportedAssetsPerChainSelector,
  useAccounts,
  useActiveAccount,
  useRootSelector,
} from 'selectors';
import { accountHistorySelector, archanovaAccountEthereumHistorySelector } from 'selectors/history';
import { accountCollectiblesHistorySelector } from 'selectors/collectibles';

// Constants
import { CHAIN } from 'constants/chainConstants';
import { ARCHANOVA_WALLET_ENS_MIGRATION } from 'constants/archanovaConstants';

// Utils
import { getHistoryEventsFromTransactions, parseHistoryEventFee } from 'utils/history';
import { addressesEqual } from 'utils/assets';
import { useChainsConfig } from 'utils/uiConfig';
import { getAccountId, getMigratedEnsName } from 'utils/accounts';

// Types
import { EVENT_TYPE, type Event, type WalletEvent, type EnsNameRegisteredEvent } from 'models/History';
import type { Chain } from 'models/Chain';

function MultiChainHistoryEtherspot() {
  const [tabIndex, setTabIndex] = useState(0);

  const chainsConfig = useChainsConfig();

  const chains = [
    CHAIN.ETHEREUM,
    CHAIN.POLYGON,
    CHAIN.BINANCE,
    CHAIN.XDAI,
    CHAIN.OPTIMISM,
    CHAIN.ARBITRUM,
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
  const historyEvents = useHistoryEvents(chain);
  const walletEvents = useWalletEvents(chain);
  const ensRegisteredEvent = useEnsRegisteredEvent(chain);

  let items = [
    ...historyEvents,
    ...walletEvents,
  ];

  if (ensRegisteredEvent) {
    items = [...items, ensRegisteredEvent];
  }

  return <HistoryList items={items} chain={chain} />;
}

function useHistoryEvents(chain: Chain): Event[] {
  const activeAccountAddress = useRootSelector(activeAccountAddressSelector);
  const accountHistory = useRootSelector(accountHistorySelector);
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
    chainSupportedAssets,
  );

  return [
    ...mappedTransactionsHistory,
    ...mappedCollectiblesHistory,
  ];
}

function useWalletEvents(chain: Chain): WalletEvent[] {
  const walletEvents = useRootSelector((root) => root.walletEvents.data);
  const activeAccount = useActiveAccount();

  return useMemo(() => {
    if (!activeAccount) return [];

    const activeAccountId = getAccountId(activeAccount);

    const accountChainWalletEvents = walletEvents?.[activeAccountId]?.[chain] ?? [];

    // $FlowFixMe: does not cover WalletActivated and flow fails
    return accountChainWalletEvents.map((event) => ({
      ...event,
      date: new Date(event.date),
    }));
  }, [activeAccount, walletEvents, chain]);
}

function useEnsRegisteredEvent(chain: Chain): ?EnsNameRegisteredEvent {
  const archanovaAccountHistory = useRootSelector(archanovaAccountEthereumHistorySelector);
  const accountHistory = useHistoryEvents(chain);
  const accounts = useAccounts();
  const activeAccount = useActiveAccount();

  return useMemo(() => {
    // $FlowFixMe: fails getting exact extra
    const createdAt = activeAccount?.extra?.ethereum?.createdAt;

    // ENS is registered on Ethereum only, createdAt might not be pulled yet
    if (chain !== CHAIN.ETHEREUM || !createdAt) return null;

    const migratedEnsTransaction = archanovaAccountHistory.find(({ tag }) => tag === ARCHANOVA_WALLET_ENS_MIGRATION);
    const accountActivatedTransaction = accountHistory.find(({ type }) => type === EVENT_TYPE.WALLET_ACTIVATED);

    const ensRegisteredDate = migratedEnsTransaction
      ? new Date(migratedEnsTransaction.createdAt)
      : accountActivatedTransaction?.date;

    const transactionHash = migratedEnsTransaction
      ? migratedEnsTransaction.hash
      // $FlowFixMe: fails to get hash from different event types
      : accountActivatedTransaction?.hash;

    const transactionFee = migratedEnsTransaction
      ? parseHistoryEventFee(
        chain,
        migratedEnsTransaction?.feeWithGasToken,
        migratedEnsTransaction?.gasUsed,
        migratedEnsTransaction?.gasPrice,
      )
      // $FlowFixMe: fails to fee hash from different event types
      : accountActivatedTransaction?.fee;

    return {
      id: `ethereum-${EVENT_TYPE.ENS_NAME_REGISTERED}`,
      type: EVENT_TYPE.ENS_NAME_REGISTERED,
      // As per acceptance criteria, the ENS history item needs to be
      // visually after the wallet creation history item. Adding 1000ms
      // achieves this.
      date: ensRegisteredDate ?? new Date(Date.parse(createdAt) + 1000),
      ensName: getMigratedEnsName(accounts),
      hash: transactionHash,
      fee: transactionFee,
    };
  }, [chain, archanovaAccountHistory, accountHistory, accounts, activeAccount]);
}
