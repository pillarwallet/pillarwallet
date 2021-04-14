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

import { BigNumber } from 'bignumber.js';
import { orderBy, groupBy } from 'lodash';

// Constants
import { TX_FAILED_STATUS, TX_PENDING_STATUS, TX_TIMEDOUT_STATUS, TRANSACTION_EVENT } from 'constants/historyConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';
import {
  PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT,
  PAYMENT_NETWORK_ACCOUNT_TOPUP,
  PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
  PAYMENT_NETWORK_TX_SETTLEMENT,
} from 'constants/paymentNetworkConstants';
import { USER_EVENT, PPN_INIT_EVENT, WALLET_CREATE_EVENT, WALLET_BACKUP_EVENT } from 'constants/userEventsConstants';
import { BADGE_REWARD_EVENT } from 'constants/badgesConstants';
import {
  SET_SMART_WALLET_ACCOUNT_ENS,
  SMART_WALLET_ACCOUNT_DEVICE_ADDED,
  SMART_WALLET_ACCOUNT_DEVICE_REMOVED,
  SMART_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER,
} from 'constants/smartWalletConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { AAVE_LENDING_DEPOSIT_TRANSACTION, AAVE_LENDING_WITHDRAW_TRANSACTION } from 'constants/lendingConstants';
import { POOLTOGETHER_WITHDRAW_TRANSACTION, POOLTOGETHER_DEPOSIT_TRANSACTION } from 'constants/poolTogetherConstants';
import {
  SABLIER_CREATE_STREAM,
  SABLIER_WITHDRAW,
  SABLIER_CANCEL_STREAM,
  SABLIER_STREAM_ENDED,
  SABLIER_EVENT,
} from 'constants/sablierConstants';
import { DAI } from 'constants/assetsConstants';
import { WBTC_SETTLED_TRANSACTION, WBTC_PENDING_TRANSACTION } from 'constants/exchangeConstants';
import {
  RARI_DEPOSIT_TRANSACTION,
  RARI_WITHDRAW_TRANSACTION,
  RARI_TRANSFER_TRANSACTION,
  RARI_CLAIM_TRANSACTION,
  RARI_TOKENS_DATA,
  RARI_GOVERNANCE_TOKEN_DATA,
} from 'constants/rariConstants';
import {
  LIQUIDITY_POOLS_ADD_LIQUIDITY_TRANSACTION,
  LIQUIDITY_POOLS_REMOVE_LIQUIDITY_TRANSACTION,
  LIQUIDITY_POOLS_STAKE_TRANSACTION,
  LIQUIDITY_POOLS_UNSTAKE_TRANSACTION,
  LIQUIDITY_POOLS_REWARDS_CLAIM_TRANSACTION,
} from 'constants/liquidityPoolsConstants';

// Selectors
import { useRootSelector } from 'selectors';
import { combinedCollectiblesHistorySelector } from 'selectors/collectibles';
import { combinedHistorySelector } from 'selectors/history';
import { sablierEventsSelector } from 'selectors/sablier';
import { isSmartWalletActivatedSelector } from 'selectors/smartWallet';

// Utils
import {
  findAccountByAddress,
  checkIfSmartWalletAccount,
  checkIfKeyBasedAccount,
  getInactiveUserAccounts,
  getAccountAddress,
  getAccountTypeByAddress,
} from 'utils/accounts';
import { addressesEqual } from 'utils/assets';
import { uniqBy } from 'utils/common';
import { mapNotNil } from 'utils/array';
import { images, getImageUrl, isSvgImage } from 'utils/images';
import { useTheme } from 'utils/themes';

// Types
import type { SectionBase } from 'utils/types/react-native';
import type { HistoryItem } from 'models/History';
import type { Transaction } from 'models/Transaction';
import type { Theme } from 'models/Theme';

import get from 'lodash.get';
import t from 'translations/translate';

import type { Accounts } from 'models/Account';
import type { CollectibleTrx } from 'models/Collectible';

type Context = {|
  theme: Theme,
  isSmartWalletActivated: boolean;
|}

export function useHistoryItems(): HistoryItem[] {
  const isSmartWalletActivated = useRootSelector(isSmartWalletActivatedSelector);
  const theme = useTheme();

  const feedData = useFeeData();

  const context = { theme, isSmartWalletActivated };

  return mapNotNil(feedData, item => mapTransactionToHistoryItem(item, context));
}

// Logic for generating Archanova history feed items, extracted from legacy `Home` screen
function useFeeData(): any[] {
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

// Logic for transforming raw history items into `Transaction` items, extracted from `utils/feedData`
export function mapTransactionsHistory(
  history: Object[],
  accounts: Accounts,
  eventType: string,
  keepHashDuplicatesIfBetweenAccounts?: boolean,
  duplicatePPN?: boolean,
): Transaction[] {
  const concatedHistory = history
    .map(({ type, ...rest }) => {
      if (eventType === TRANSACTION_EVENT) {
        return { ...rest, transactionType: type };
      }
      return rest;
    })
    .map(({ ...rest }) => ({ ...rest, type: eventType }))
    .map(({ to, from, ...rest }) => {
      // apply to wallet accounts only if received from other account address
      const account =
        eventType !== COLLECTIBLE_TRANSACTION &&
        (findAccountByAddress(from, getInactiveUserAccounts(accounts)) ||
          findAccountByAddress(to, getInactiveUserAccounts(accounts)));

      const accountType = account ? account.type : null;

      return {
        to,
        from,
        accountType,
        ...rest,
      };
    });

  if (keepHashDuplicatesIfBetweenAccounts) {
    const accountsAddresses = accounts.map((acc) => getAccountAddress(acc));
    const ascendingHistory = orderBy(concatedHistory, ['createdAt'], ['asc']);

    const historyWithTrxBetweenAcc = ascendingHistory.reduce((alteredHistory, historyItem) => {
      const { from: fromAddress, to: toAddress, hash } = historyItem;
      const isTransactionFromUsersAccount = accountsAddresses.some((userAddress) =>
        addressesEqual(fromAddress, userAddress),
      );
      const isTransactionToUsersAccount = accountsAddresses.some((userAddress) =>
        addressesEqual(toAddress, userAddress),
      );
      const eventWithSameHashExists = alteredHistory.some((item) => item.hash === hash);

      if (eventWithSameHashExists) {
        if (isTransactionFromUsersAccount && isTransactionToUsersAccount) {
          return [
            ...alteredHistory,
            {
              ...historyItem,
              accountType: getAccountTypeByAddress(toAddress, accounts),
              isReceived: true,
              betweenAccTrxDuplicate: true,
              _id: `${historyItem._id}_duplicate`,
              createdAt: historyItem.createdAt + 1,
            },
          ];
        }
        return alteredHistory;
      } else if (duplicatePPN) {
        const itemTag = get(historyItem, 'tag');
        if (itemTag && itemTag === PAYMENT_NETWORK_ACCOUNT_TOPUP) {
          const duplicate = {
            ...historyItem,
            smartWalletEvent: true,
            _id: `${historyItem._id}_duplicate`,
            createdAt: historyItem.createdAt - 1,
          };
          return [...alteredHistory, duplicate, historyItem];
        }
        return [...alteredHistory, historyItem];
      }
      return [...alteredHistory, historyItem];
    }, []);
    return orderBy(historyWithTrxBetweenAcc, ['createdAt'], ['desc']);
  }

  return uniqBy(concatedHistory, 'hash');
}

export function mapOpenSeaAndBCXTransactionsHistory(
  openSeaHistory: CollectibleTrx[],
  BCXHistory: Object[],
  keepDuplicates?: boolean,
): CollectibleTrx[] {
  const concatedCollectiblesHistory = openSeaHistory
    .map(({ hash, ...rest }) => {
      const historyEntry = BCXHistory.find(({ hash: bcxHash }) => {
        return hash.toUpperCase() === bcxHash.toUpperCase();
      });

      return {
        hash,
        ...rest,
        ...historyEntry,
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  if (keepDuplicates) return concatedCollectiblesHistory;
  return uniqBy(concatedCollectiblesHistory, 'hash');
}

// Logic for transforming `Transaction` items to `HistoryItems`, build on code extracted from `ActivityFeedItem.js`.
const NAMES = {
  SMART_WALLET: t('smartWallet'),
  KEY_WALLET: t('keyWallet'),
  PPN_NETWORK: t('pillarNetwork'),
  AAVE_DEPOSIT: t('aaveDeposit'),
  POOL_TOGETHER: t('poolTogether'),
};

const STATUSES = {
  CREATED: t('label.created'),
  IMPORTED: t('label.imported'),
  RECEIVED: t('label.received'),
  SENT: t('label.sent'),
  BACKUP: t('label.backedUp'),
  ACTIVATED: t('label.activated'),
  ADDED: t('label.added'),
  REMOVED: t('label.removed'),
};

const FROM = {
  PPN_NETWORK: t('label.fromPPN'),
};

const TO = {
  PPN_NETWORK: t('label.toPPN'),
};

function mapTransactionToHistoryItem(item: Transaction, context: Context): ?HistoryItem {
  switch (item.type) {
    case USER_EVENT:
      return mapUserEventsToHistoryItem(item, context);
    // case TRANSACTION_EVENT:
    //   return this.getTransactionEventData(item);
    // case COLLECTIBLE_TRANSACTION:
    //   return this.getCollectibleTransactionEventData(item);
    case BADGE_REWARD_EVENT:
      return mapBadgeRewardToHistoryItem(item);
    // case SABLIER_EVENT:
    //   return this.getSablierEventData(item);
    default:
    console.log("UNKNOW ITEM", item.type, item);
      return null;
  }
}

function mapUserEventsToHistoryItem(event: Object, { isSmartWalletActivated }: Context): ?HistoryItem {
  switch (event.subType) {
    case WALLET_CREATE_EVENT:
      switch (event.eventTitle) {
        case 'Wallet created':
          return {
            type: 'walletEvent',
            id: `${event.id}-${event.createdAt}`,
            date: new Date(event.createdAt * 1000),
            title: NAMES.KEY_WALLET,
            event: STATUSES.CREATED,
          };
        case 'Smart Wallet created':
          return {
            type: 'walletEvent',
            id: `${event.id}-${event.createdAt}`,
            date: new Date(event.createdAt * 1000),
            title: NAMES.SMART_WALLET,
            subtitle: isSmartWalletActivated ? undefined : t('label.needToActivate'),
            event: STATUSES.CREATED,
          };
        case 'Wallet imported':
          return {
            type: 'walletEvent',
            id: `${event.id}-${event.createdAt}`,
            date: new Date(event.createdAt * 1000),
            title: NAMES.KEY_WALLET,
            event: STATUSES.IMPORTED,
          };
        default:
          return null;
      }

    case PPN_INIT_EVENT:
      return {
        type: 'walletEvent',
        id: `${event.id}-${event.createdAt}`,
        date: new Date(event.createdAt * 1000),
        title: NAMES.PPN_NETWORK,
        subtitle: isSmartWalletActivated ? undefined : t('label.needToActivate'),
        event: STATUSES.CREATED,
      };

    case WALLET_BACKUP_EVENT:
      return {
        type: 'walletEvent',
        id: `${event.id}-${event.createdAt}`,
        date: new Date(event.createdAt * 1000),
        title: NAMES.KEY_WALLET,
        event: STATUSES.BACKUP,
      };
    default:
      return null;
  }
}

function mapBadgeRewardToHistoryItem(event: Object): HistoryItem {
  return {
    type: 'badgeEvent',
    id: `${event.id}-${event.createdAt}`,
    date: new Date(event.createdAt * 1000),
    title: event.name,
    subtitle: t('label.badge'),
    event: STATUSES.RECEIVED,
    iconUrl: event.imageUrl,
  };
}
