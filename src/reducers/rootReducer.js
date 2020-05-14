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
import { LOG_OUT } from 'constants/authConstants';
import type { DbAction } from 'models/DbAction';

import { defaultTheme } from 'utils/themes';

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
import contactsReducer from './contactsReducer';
import invitationsReducer from './invitationsReducer';
import chatReducer from './chatReducer';
import sessionReducer from './sessionReducer';
import txNoteReducer from './txNoteReducer';
import oAuthReducer from './oAuthReducer';
import txCountReducer from './txCountReducer';
import collectiblesReducer from './collectiblesReducer';
import badgesReducer from './badgesReducer';
import exchangeReducer from './exchangeReducer';
import accountsReducer from './accountsReducer';
import balancesReducer from './balancesReducer';
import paymentNetworkReducer from './paymentNetworkReducer';
import featureFlagsReducer from './featureFlagsReducer';
import blockchainNetworkReducer from './blockchainNetworkReducer';
import userSettingsReducer from './userSettingsReducer';
import bitcoinReducer from './bitcoinReducer';
import userEventsReducer from './userEventsReducer';
import walkthroughsReducer from './walkthroughsReducer';
import syntheticsReducer from './syntheticsReducer';
import ensRegistryReducer from './ensRegistryReducer';
import insightsReducer from './insightsReducer';
import referralsReducer from './referralsReducer';
import phoneContactsReducer from './phoneContactsReducer';

// types
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
import type { RatesReducerState } from './ratesReducer';
import type { UserReducerState } from './userReducer';
import type { HistoryReducerState, HistoryAction } from './historyReducer';
import type { NotificationsReducerState } from './notificationsReducer';
import type { ContactsReducerState } from './contactsReducer';
import type { InvitationsReducerState } from './invitationsReducer';
import type { ChatReducerState } from './chatReducer';
import type { SessionReducerState } from './sessionReducer';
import type { TxNoteReducerState } from './txNoteReducer';
import type { OAuthReducerState } from './oAuthReducer';
import type { TxCountReducerState } from './txCountReducer';
import type { CollectiblesReducerState, CollectiblesAction } from './collectiblesReducer';
import type { BadgesReducerState, BadgesReducerAction } from './badgesReducer';
import type { ExchangeReducerState, ExchangeReducerAction } from './exchangeReducer';
import type { AccountsReducerState, AccountsAction } from './accountsReducer';
import type { BalancesReducerState, BalancesAction } from './balancesReducer';
import type { PaymentNetworkReducerState, PaymentNetworkAction } from './paymentNetworkReducer';
import type { FeatureFlagsReducerState, FeatureFlagsReducerAction } from './featureFlagsReducer';
import type { BlockchainNetworkAction, BlockchainNetworkReducerState } from './blockchainNetworkReducer';
import type { UserSettingsReducerAction, UserSettingsReducerState } from './userSettingsReducer';
import type { BitcoinReducerAction, BitcoinReducerState } from './bitcoinReducer';
import type { UserEventsReducerAction, UserEventsReducerState } from './userEventsReducer';
import type { WalkthroughsReducerAction, WalkthroughsReducerState } from './walkthroughsReducer';
import type { SyntheticsReducerAction, SyntheticsReducerState } from './syntheticsReducer';
import type { EnsRegistryReducerAction, EnsRegistryReducerState } from './ensRegistryReducer';
import type { InsightsReducerAction, InsightsReducerState } from './insightsReducer';
import type { ReferralsReducerAction, ReferralsReducerState } from './referralsReducer';
import type { PhoneContactsReducerAction, PhoneContactsReducerState } from './phoneContactsReducer';

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
  contacts: ContactsReducerState,
  invitations: InvitationsReducerState,
  chat: ChatReducerState,
  session: SessionReducerState,
  txNotes: TxNoteReducerState,
  oAuthTokens: OAuthReducerState,
  txCount: TxCountReducerState,
  collectibles: CollectiblesReducerState,
  badges: BadgesReducerState,
  exchange: ExchangeReducerState,
  accounts: AccountsReducerState,
  balances: BalancesReducerState,
  paymentNetwork: PaymentNetworkReducerState,
  featureFlags: FeatureFlagsReducerState,
  blockchainNetwork: BlockchainNetworkReducerState,
  userSettings: UserSettingsReducerState,
  bitcoin: BitcoinReducerState,
  userEvents: UserEventsReducerState,
  walkthroughs: WalkthroughsReducerState,
  synthetics: SyntheticsReducerState,
  ensRegistry: EnsRegistryReducerState,
  referrals: ReferralsReducerState,
  insights: InsightsReducerState,
  phoneContacts: PhoneContactsReducerState,
|};

type RootReducerAction =
  | AccountsAction
  | AppSettingsReducerAction
  | BadgesReducerAction
  | BalancesAction
  | BlockchainNetworkAction
  | BlockchainNetworkReducerState
  | CollectiblesAction
  | ExchangeReducerAction
  | FeatureFlagsReducerAction
  | HistoryAction
  | PaymentNetworkAction
  | SmartWalletReducerAction
  | WalletConnectReducerAction
  | WalletConnectSessionsReducerAction
  | UserSettingsReducerAction
  | BitcoinReducerAction
  | UserEventsReducerAction
  | WalkthroughsReducerAction
  | DbAction
  | SyntheticsReducerAction
  | EnsRegistryReducerAction
  | InsightsReducerAction
  | ReferralsReducerAction
  | PhoneContactsReducerAction;

export type GetState = () => RootReducerState;
export type ThunkAction = (
  dispatch: Dispatch, // eslint-disable-line no-use-before-define
  getState: GetState,
  api: Object,
) => any;
export type Dispatch = (
  action: RootReducerAction | Promise<RootReducerAction> | ThunkAction,
) => void;

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
  contacts: contactsReducer,
  invitations: invitationsReducer,
  chat: chatReducer,
  session: sessionReducer,
  txNotes: txNoteReducer,
  oAuthTokens: oAuthReducer,
  txCount: txCountReducer,
  collectibles: collectiblesReducer,
  badges: badgesReducer,
  exchange: exchangeReducer,
  accounts: accountsReducer,
  balances: balancesReducer,
  paymentNetwork: paymentNetworkReducer,
  featureFlags: featureFlagsReducer,
  blockchainNetwork: blockchainNetworkReducer,
  userSettings: userSettingsReducer,
  bitcoin: bitcoinReducer,
  userEvents: userEventsReducer,
  walkthroughs: walkthroughsReducer,
  synthetics: syntheticsReducer,
  ensRegistry: ensRegistryReducer,
  insights: insightsReducer,
  referrals: referralsReducer,
  phoneContacts: phoneContactsReducer,
});

export const initialState = appReducer(undefined, {});

const rootReducer = (state: RootReducerState, action: RootReducerAction) => {
  if (action.type === LOG_OUT) {
    return appReducer({ appSettings: { isFetched: true, data: { theme: defaultTheme } } }, {});
  }
  return appReducer(state, action);
};

export default rootReducer;
