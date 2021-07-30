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
import { combineReducers } from 'redux';

// constants
import { RESET_APP_STATE } from 'constants/authConstants';

// types
import type { DbAction } from 'models/DbAction';

// reducers
import offlineQueueReducer from './offlineQueueReducer';
import walletReducer from './walletReducer';
import smartWalletReducer from './smartWalletReducer';
import walletConnectReducer from './walletConnectReducer';
import walletConnectSessionsReducer from './walletConnectSessionsReducer';
import assetsReducer from './assetsReducer';
import appSettingsReducer from './appSettingsReducer';
import ratesReducer from './ratesReducer';
import userReducer from './userReducer';
import historyReducer from './historyReducer';
import notificationsReducer from './notificationsReducer';
import sessionReducer from './sessionReducer';
import txCountReducer from './txCountReducer';
import collectiblesReducer from './collectiblesReducer';
import accountsReducer from './accountsReducer';
import assetsBalancesReducer from './assetsBalancesReducer';
import paymentNetworkReducer from './paymentNetworkReducer';
import blockchainNetworkReducer from './blockchainNetworkReducer';
import userSettingsReducer from './userSettingsReducer';
import userEventsReducer from './userEventsReducer';
import walkthroughsReducer from './walkthroughsReducer';
import syntheticsReducer from './syntheticsReducer';
import ensRegistryReducer from './ensRegistryReducer';
import insightsReducer from './insightsReducer';
import keyBasedAssetTransferReducer from './keyBasedAssetTransferReducer';
import walletMigrationArchanovaReducer from './walletMigrationArchanovaReducer';
import contactsReducer from './contactsReducer';
import onboardingReducer from './onboardingReducer';
import cacheReducer from './cacheReducer';
import transactionEstimateReducer from './transactionEstimateReducer';
import liquidityPoolsReducer from './liquidityPoolsReducer';
import totalBalancesReducer from './totalBalancesReducer';

// local types
import type { OfflineQueueReducerState } from './offlineQueueReducer';
import type { WalletReducerState } from './walletReducer';
import type { SmartWalletReducerState, SmartWalletReducerAction } from './smartWalletReducer';
import type { WalletConnectReducerState, WalletConnectReducerAction } from './walletConnectReducer';
import type {
  WalletConnectSessionsReducerAction,
  WalletConnectSessionsReducerState,
} from './walletConnectSessionsReducer';
import type { AssetsReducerState } from './assetsReducer';
import type { AppSettingsReducerAction, AppSettingsReducerState } from './appSettingsReducer';
import type { RatesReducerState, RatesReducerAction } from './ratesReducer';
import type { UserReducerState } from './userReducer';
import type { HistoryReducerState, HistoryAction } from './historyReducer';
import type { NotificationsReducerState } from './notificationsReducer';
import type { SessionReducerState } from './sessionReducer';
import type { TxCountReducerState } from './txCountReducer';
import type { CollectiblesReducerState, CollectiblesAction } from './collectiblesReducer';
import type { AccountsReducerState, AccountsAction } from './accountsReducer';
import type { AssetsBalancesReducerState, AssetsBalancesReducerAction } from './assetsBalancesReducer';
import type { PaymentNetworkReducerState, PaymentNetworkAction } from './paymentNetworkReducer';
import type { BlockchainNetworkAction, BlockchainNetworkReducerState } from './blockchainNetworkReducer';
import type { UserSettingsReducerAction, UserSettingsReducerState } from './userSettingsReducer';
import type { UserEventsReducerAction, UserEventsReducerState } from './userEventsReducer';
import type { WalkthroughsReducerAction, WalkthroughsReducerState } from './walkthroughsReducer';
import type { SyntheticsReducerAction, SyntheticsReducerState } from './syntheticsReducer';
import type { EnsRegistryReducerAction, EnsRegistryReducerState } from './ensRegistryReducer';
import type { InsightsReducerAction, InsightsReducerState } from './insightsReducer';
import type {
  KeyBasedAssetTransferReducerAction,
  KeyBasedAssetTransferReducerState,
} from './keyBasedAssetTransferReducer';
import type {
  WalletMigrationArchanovaReducerState,
  WalletMigrationArchanovaReducerAction,
} from './walletMigrationArchanovaReducer';
import type { ContactsReducerAction, ContactsReducerState } from './contactsReducer';
import type { CacheAction, CacheReducerState } from './cacheReducer';
import type { OnboardingReducerAction, OnboardingReducerState } from './onboardingReducer.js';
import type { TransactionEstimateReducerAction, TransactionEstimateReducerState } from './transactionEstimateReducer';
import type { LiquidityPoolsReducerState, LiquidityPoolsReducerAction } from './liquidityPoolsReducer';
import type { TotalBalancesReducerState, TotalBalancesReducerAction } from './totalBalancesReducer';

export type RootReducerState = {|
  offlineQueue: OfflineQueueReducerState,
  wallet: WalletReducerState,
  smartWallet: SmartWalletReducerState,
  walletConnect: WalletConnectReducerState,
  walletConnectSessions: WalletConnectSessionsReducerState,
  assets: AssetsReducerState,
  appSettings: AppSettingsReducerState,
  rates: RatesReducerState,
  user: UserReducerState,
  history: HistoryReducerState,
  notifications: NotificationsReducerState,
  session: SessionReducerState,
  txCount: TxCountReducerState,
  collectibles: CollectiblesReducerState,
  accounts: AccountsReducerState,
  assetsBalances: AssetsBalancesReducerState,
  paymentNetwork: PaymentNetworkReducerState,
  blockchainNetwork: BlockchainNetworkReducerState,
  userSettings: UserSettingsReducerState,
  userEvents: UserEventsReducerState,
  walkthroughs: WalkthroughsReducerState,
  synthetics: SyntheticsReducerState,
  ensRegistry: EnsRegistryReducerState,
  insights: InsightsReducerState,
  keyBasedAssetTransfer: KeyBasedAssetTransferReducerState,
  walletMigrationArchanova: WalletMigrationArchanovaReducerState,
  contacts: ContactsReducerState,
  onboarding: OnboardingReducerState,
  cache: CacheReducerState,
  transactionEstimate: TransactionEstimateReducerState,
  liquidityPools: LiquidityPoolsReducerState,
  totalBalances: TotalBalancesReducerState,
|};

type RootReducerAction =
  | AccountsAction
  | AppSettingsReducerAction
  | AssetsBalancesReducerAction
  | BlockchainNetworkAction
  | CollectiblesAction
  | HistoryAction
  | PaymentNetworkAction
  | SmartWalletReducerAction
  | WalletConnectReducerAction
  | WalletConnectSessionsReducerAction
  | UserSettingsReducerAction
  | UserEventsReducerAction
  | WalkthroughsReducerAction
  | DbAction
  | SyntheticsReducerAction
  | EnsRegistryReducerAction
  | InsightsReducerAction
  | KeyBasedAssetTransferReducerAction
  | WalletMigrationArchanovaReducerAction
  | ContactsReducerAction
  | OnboardingReducerAction
  | CacheAction
  | TransactionEstimateReducerAction
  | LiquidityPoolsReducerAction
  | TotalBalancesReducerAction
  | RatesReducerAction;

export type GetState = () => RootReducerState;
export type ThunkAction = (
  dispatch: Dispatch,
  getState: GetState,
) => any;
export type Dispatch = (
  action: RootReducerAction | Promise<RootReducerAction> | ThunkAction,
) => void;

// Note: this intended as temporary solution for typing reselect selectors
// real solution would be apply reselect flow typing.
export type Selector<T> = (state: RootReducerState) => T;

const appReducer = combineReducers({
  offlineQueue: offlineQueueReducer,
  wallet: walletReducer,
  smartWallet: smartWalletReducer,
  walletConnect: walletConnectReducer,
  walletConnectSessions: walletConnectSessionsReducer,
  assets: assetsReducer,
  appSettings: appSettingsReducer,
  rates: ratesReducer,
  user: userReducer,
  history: historyReducer,
  notifications: notificationsReducer,
  session: sessionReducer,
  txCount: txCountReducer,
  collectibles: collectiblesReducer,
  accounts: accountsReducer,
  assetsBalances: assetsBalancesReducer,
  paymentNetwork: paymentNetworkReducer,
  blockchainNetwork: blockchainNetworkReducer,
  userSettings: userSettingsReducer,
  userEvents: userEventsReducer,
  walkthroughs: walkthroughsReducer,
  synthetics: syntheticsReducer,
  ensRegistry: ensRegistryReducer,
  insights: insightsReducer,
  keyBasedAssetTransfer: keyBasedAssetTransferReducer,
  walletMigrationArchanova: walletMigrationArchanovaReducer,
  contacts: contactsReducer,
  onboarding: onboardingReducer,
  cache: cacheReducer,
  transactionEstimate: transactionEstimateReducer,
  liquidityPools: liquidityPoolsReducer,
  totalBalances: totalBalancesReducer,
});

export const initialState = appReducer(undefined, {});

const rootReducer = (state: RootReducerState, action: RootReducerAction) => {
  if (action.type === RESET_APP_STATE) {
    /**
     * resets reducer state, ref – https://stackoverflow.com/a/35641992
     *
     * keep passed state (action.payload) or reset completely,
     * undefined will reset everything
     */
    // $FlowFixMe
    state = typeof action.payload === 'object' ? action.payload : undefined;
  }
  return appReducer(state, action);
};

export default rootReducer;
