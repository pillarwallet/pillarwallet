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

// constants
import { SET_ETHERSPOT_ACCOUNTS } from 'constants/etherspotConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { SET_INITIAL_ASSETS } from 'constants/assetsConstants';
import { PPN_TOKEN } from 'configs/assetsConfig';
import { MARK_PLR_TANK_INITIALISED, UPDATE_PAYMENT_NETWORK_STAKED } from 'constants/paymentNetworkConstants';
import { SET_ESTIMATING_TRANSACTION } from 'constants/transactionEstimateConstants';

// actions
import { addAccountAction, setActiveAccountAction } from 'actions/accountsActions';
import { saveDbAction } from 'actions/dbActions';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchCollectiblesAction } from 'actions/collectiblesActions';
import { estimateTransactionAction } from 'actions/transactionEstimateActions';
import { checkUserENSNameAction } from 'actions/ensRegistryActions';

// services
import etherspot from 'services/etherspot';

// utils
import { normalizeWalletAddress } from 'utils/wallet';
import { formatUnits, reportErrorLog } from 'utils/common';
import {
  addressesEqual,
  getAssetData,
  getAssetsAsList,
  mapAssetToAssetData,
} from 'utils/assets';
import { findFirstEtherspotAccount } from 'utils/accounts';

// selectors
import { accountAssetsSelector } from 'selectors/assets';
import { accountHistorySelector } from 'selectors/history';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type SDKWrapper from 'services/api';
import type { Account as EtherspotAccount } from 'etherspot';


export const initEtherspotServiceAction = (privateKey: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      session: { data: { isOnline } },
    } = getState();

    if (!isOnline) return; // nothing to do

    await etherspot.init(privateKey);
  };
};

export const subscribeToEtherspotEventsAction = () => {
  return async () => {
    etherspot.subscribe();
  };
};

export const unsubscribeToEtherspotEventsAction = () => {
  return async () => {
    etherspot.unsubscribe();
  };
};

export const setEtherspotAccountsAction = (accounts: EtherspotAccount[]) => {
  return async (dispatch: Dispatch) => {
    if (!accounts) {
      // Note: there should be always at least one account, it syncs on Etherspot SDK init, otherwise it's failure
      reportErrorLog('setEtherspotAccountsAction failed: no accounts', { accounts });
      return;
    }

    dispatch({ type: SET_ETHERSPOT_ACCOUNTS, payload: accounts });
    await dispatch(saveDbAction('etherspot', { accounts }));
  };
};

export const importEtherspotAccountsAction = (privateKey: string) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      session: { data: session },
      user: { data: user },
    } = getState();

    if (!session.isOnline) return; // offline, nothing to dp

    if (!etherspot?.sdk) {
      reportErrorLog('importEtherspotAccountsAction failed: action dispatched when Etherspot SDK was not initialized');
      return;
    }

    if (!user) {
      reportErrorLog('importEtherspotAccountsAction failed: no user');
      return;
    }

    const etherspotAccounts = await etherspot.getAccounts();
    if (!etherspotAccounts) {
      // Note: there should be always at least one account, it syncs on Etherspot SDK init, otherwise it's failure
      reportErrorLog('importEtherspotAccountsAction failed: no accounts', { etherspotAccounts });
      return;
    }

    await dispatch(setEtherspotAccountsAction(etherspotAccounts));

    const { walletId } = user;

    if (!walletId) {
      reportErrorLog('importEtherspotAccountsAction failed: no walletId', { user });
      return;
    }

    const backendAccounts = await api.listAccounts(walletId);
    if (!backendAccounts) {
      reportErrorLog('importEtherspotAccountsAction failed: no backendAccounts', { walletId });
      return;
    }

    // sync accounts with Pillar backend
    await Promise.all(etherspotAccounts.map((account) => {
      const accountExists = backendAccounts.some(({ ethAddress }) => addressesEqual(ethAddress, account.address));
      if (!accountExists) {
        return api.registerSmartWallet({
          walletId,
          privateKey,
          ethAddress: account.address,
          fcmToken: session?.fcmToken,
        }).catch((error) => {
          reportErrorLog('importEtherspotAccountsAction api.registerSmartWallet failed', { error });
          return Promise.resolve();
        });
      }
      return Promise.resolve();
    }));

    // sync accounts with app
    await Promise.all(etherspotAccounts.map((etherspotAccount) => dispatch(addAccountAction(
      etherspotAccount.address,
      ACCOUNT_TYPES.ETHERSPOT_SMART_WALLET,
      etherspotAccount, // full object as extras
      backendAccounts,
    ))));

    // set active
    const accountId = normalizeWalletAddress(etherspotAccounts[0].address);
    dispatch(setActiveAccountAction(accountId));
    dispatch(checkUserENSNameAction());

    // set default assets for active Etherspot wallet
    const initialAssets = await api.fetchInitialAssets(walletId);
    await dispatch({
      type: SET_INITIAL_ASSETS,
      payload: { accountId, assets: initialAssets },
    });

    const assets = { [accountId]: initialAssets };
    dispatch(saveDbAction('assets', { assets }, true));
    dispatch(fetchAssetsBalancesAction());
    dispatch(fetchCollectiblesAction());
  };
};

export const reserveEtherspotENSNameAction = (username: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
      session: { data: { isOnline } },
    } = getState();

    if (!isOnline) return; // nothing to do

    const etherspotAccount = findFirstEtherspotAccount(accounts);
    if (!etherspotAccount) {
      reportErrorLog('reserveEtherspotENSNameAction failed: no Etherspot account found');
      return;
    }

    const reserved = await etherspot.reserveENSName(username);
    if (!reserved) {
      reportErrorLog('reserveEtherspotENSNameAction reserveENSName failed', { username });
    }
  };
};

export const fetchAccountDepositBalanceAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
      session: { data: { isOnline } },
      assets: { supportedAssets },
    } = getState();

    if (!isOnline) {
      // nothing to do offline
      return;
    }

    const accountAssets = accountAssetsSelector(getState());
    const ppnTokenAsset = getAssetData(getAssetsAsList(accountAssets), supportedAssets, PPN_TOKEN);
    if (!ppnTokenAsset) {
      // TODO: show toast?
      reportErrorLog('fetchAccountDepositBalanceAction failed: no ppnTokenAsset', { PPN_TOKEN });
      dispatch({ type: SET_ESTIMATING_TRANSACTION, payload: false });
      return;
    }

    // process staked amount
    const stakedAmount = await etherspot.getAccountTokenDepositBalance(ppnTokenAsset.address);
    const stakedAmountFormatted = Number(formatUnits(stakedAmount, ppnTokenAsset.decimals));

    dispatch(saveDbAction('paymentNetworkStaked', { paymentNetworkStaked: stakedAmountFormatted }, true));
    dispatch({ type: UPDATE_PAYMENT_NETWORK_STAKED, payload: stakedAmountFormatted });

    // process pending balances
    // const accountBalances = pendingBalances.reduce((memo, tokenBalance) => {
    //   const symbol = get(tokenBalance, 'token.symbol', ETH);
    //   const { decimals: assetDecimals = 18 } = accountAssets[symbol] || {};
    //   const balance = get(tokenBalance, 'incoming', new BigNumber(0));
    //
    //   return {
    //     ...memo,
    //     [symbol]: {
    //       balance: formatUnits(balance, assetDecimals),
    //       symbol,
    //     },
    //   };
    // }, {});

    // const { paymentNetwork: { balances } } = getState();
    // const accountId = getActiveAccountId(accounts);
    // const updatedBalances = {
    //   ...balances,
    //   [accountId]: accountBalances,
    // };
    //
    // dispatch(saveDbAction('paymentNetworkBalances', { paymentNetworkBalances: updatedBalances }, true));
    // dispatch({ type: UPDATE_PAYMENT_NETWORK_ACCOUNT_BALANCES, payload: { accountId, balances: accountBalances }});
  };
};

export const initPPNAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (getState().paymentNetwork.isTankInitialised) {
      // already initialized
      return;
    }

    const accountHistory = accountHistorySelector(getState());
    const hasPpnPayments = accountHistory.some(({ isPPNTransaction }) => isPPNTransaction);

    await dispatch(fetchAccountDepositBalanceAction());
    const { paymentNetwork: { availableStake } } = getState();

    if (availableStake || hasPpnPayments) {
      dispatch({ type: MARK_PLR_TANK_INITIALISED });
      dispatch(saveDbAction('isPLRTankInitialised', { isPLRTankInitialised: true }, true));
    }
  };
};

export const estimateAccountDepositTokenTransactionAction = (depositAmount: number) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
      assets: { supportedAssets },
    } = getState();
    const etherspotAccount = findFirstEtherspotAccount(accounts);
    if (!etherspotAccount) return;

    // put into loading state at this point already
    dispatch({ type: SET_ESTIMATING_TRANSACTION, payload: true });

    const accountAssets = accountAssetsSelector(getState());
    const ppnTokenAsset = getAssetData(getAssetsAsList(accountAssets), supportedAssets, PPN_TOKEN);
    if (!ppnTokenAsset) {
      // TODO: show toast?
      reportErrorLog('estimateAccountDepositTransactionAction failed: no ppnTokenAsset', { ppnTokenAsset });
      dispatch({ type: SET_ESTIMATING_TRANSACTION, payload: false });
      return;
    }

    const tokenDeposit = await etherspot.getAccountTokenDeposit(ppnTokenAsset.address);
    if (!tokenDeposit) {
      // TODO: show toast?
      reportErrorLog('estimateAccountDepositTransactionAction failed: no tokenDeposit', { ppnTokenAsset });
      dispatch({ type: SET_ESTIMATING_TRANSACTION, payload: false });
      return;
    }

    dispatch(estimateTransactionAction({
      to: tokenDeposit.address,
      value: depositAmount,
      assetData: mapAssetToAssetData(ppnTokenAsset),
    }));
  };
};
