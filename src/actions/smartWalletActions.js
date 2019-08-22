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
import { sdkModules, sdkConstants } from '@archanova/sdk';
import get from 'lodash.get';
import { NavigationActions } from 'react-navigation';
import { utils } from 'ethers';
import { Sentry } from 'react-native-sentry';
import { BigNumber } from 'bignumber.js';

// components
import Toast from 'components/Toast';

// constants
import {
  SET_SMART_WALLET_SDK_INIT,
  SET_SMART_WALLET_ACCOUNTS,
  SET_SMART_WALLET_CONNECTED_ACCOUNT,
  ADD_SMART_WALLET_UPGRADE_ASSETS,
  ADD_SMART_WALLET_UPGRADE_COLLECTIBLES,
  DISMISS_SMART_WALLET_UPGRADE,
  SET_SMART_WALLET_ASSETS_TRANSFER_TRANSACTIONS,
  SET_SMART_WALLET_UPGRADE_STATUS,
  SMART_WALLET_UPGRADE_STATUSES,
  ADD_SMART_WALLET_RECOVERY_AGENTS,
  SET_SMART_WALLET_DEPLOYMENT_DATA,
  SMART_WALLET_DEPLOYMENT_ERRORS,
  SET_SMART_WALLET_LAST_SYNCED_HASH,
  RESET_SMART_WALLET,
  START_SMART_WALLET_DEPLOYMENT,
  RESET_SMART_WALLET_DEPLOYMENT,
  SET_ASSET_TRANSFER_GAS_LIMIT,
  SET_COLLECTIBLE_TRANSFER_GAS_LIMIT,
} from 'constants/smartWalletConstants';
import { ACCOUNT_TYPES, UPDATE_ACCOUNTS } from 'constants/accountsConstants';
import { ETH, UPDATE_BALANCES } from 'constants/assetsConstants';

import {
  TX_PENDING_STATUS,
  TX_CONFIRMED_STATUS,
  SET_HISTORY, ADD_TRANSACTION,
} from 'constants/historyConstants';
import {
  UPDATE_PAYMENT_NETWORK_ACCOUNT_BALANCES,
  SET_ESTIMATED_TOPUP_FEE,
  PAYMENT_NETWORK_ACCOUNT_TOPUP,
  PAYMENT_NETWORK_SUBSCRIBE_TO_TX_STATUS,
  PAYMENT_NETWORK_UNSUBSCRIBE_TX_STATUS,
  UPDATE_PAYMENT_NETWORK_STAKED,
  SET_AVAILABLE_TO_SETTLE_TX,
  START_FETCHING_AVAILABLE_TO_SETTLE_TX,
  SET_ESTIMATED_SETTLE_TX_FEE,
  PAYMENT_NETWORK_TX_SETTLEMENT,
  MARK_PLR_TANK_INITIALISED,
} from 'constants/paymentNetworkConstants';
import { SMART_WALLET_UNLOCK, ASSETS, SEND_TOKEN_AMOUNT, PPN_SEND_TOKEN_AMOUNT } from 'constants/navigationConstants';

// configs
import { PPN_TOKEN } from 'configs/assetsConfig';

// services
import smartWalletService from 'services/smartWallet';
import Storage from 'services/storage';
import { navigate } from 'services/navigation';
import { calculateGasEstimate, waitForTransaction } from 'services/assets';

// selectors
import { accountBalancesSelector } from 'selectors/balances';

// actions
import {
  addNewAccountAction,
  setActiveAccountAction,
  switchAccountAction,
} from 'actions/accountsActions';
import { saveDbAction } from 'actions/dbActions';
import {
  signAssetTransactionAction,
  sendSignedAssetTransactionAction,
  resetLocalNonceToTransactionCountAction,
  fetchAssetsBalancesAction,
} from 'actions/assetsActions';
import { fetchCollectiblesAction } from 'actions/collectiblesActions';
import { fetchGasInfoAction } from 'actions/historyActions';

// types
import type { AssetTransfer } from 'models/Asset';
import type { CollectibleTransfer } from 'models/Collectible';
import type { RecoveryAgent } from 'models/RecoveryAgents';
import type { SmartWalletDeploymentError } from 'models/SmartWalletAccount';
import type { TxToSettle } from 'models/PaymentNetwork';

// utils
import { buildHistoryTransaction, updateAccountHistory, updateHistoryRecord } from 'utils/history';
import { getActiveAccountAddress, getActiveAccountId, getActiveAccountType } from 'utils/accounts';
import { isConnectedToSmartAccount } from 'utils/smartWallet';
import { addressesEqual, getBalance, getPPNTokenAddress } from 'utils/assets';
import { formatAmount, formatMoney, formatUnits, getGasPriceWei } from 'utils/common';


const storage = Storage.getInstance('db');

export const initSmartWalletSdkAction = (walletPrivateKey: string) => {
  return async (dispatch: Function) => {
    await smartWalletService.init(walletPrivateKey, dispatch);
    const initialized = smartWalletService.sdkInitialized;
    dispatch({
      type: SET_SMART_WALLET_SDK_INIT,
      payload: initialized,
    });
  };
};

export const loadSmartWalletAccountsAction = (privateKey?: string) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    if (!smartWalletService || !smartWalletService.sdkInitialized) return;

    const { user = {} } = await storage.get('user');
    const { session: { data: session } } = getState();

    const smartAccounts = await smartWalletService.getAccounts();
    if (!smartAccounts.length && privateKey) {
      const newSmartAccount = await smartWalletService.createAccount();
      await api.registerSmartWallet({
        walletId: user.walletId,
        privateKey,
        ethAddress: newSmartAccount.address,
        fcmToken: session.fcmToken,
      });
      if (newSmartAccount) smartAccounts.push(newSmartAccount);
    }
    dispatch({
      type: SET_SMART_WALLET_ACCOUNTS,
      payload: smartAccounts,
    });
    await dispatch(saveDbAction('smartWallet', { accounts: smartAccounts }));

    const backendAccounts = await api.listAccounts(user.walletId);
    const newAccountsPromises = smartAccounts.map(async account => {
      return dispatch(addNewAccountAction(account.address, ACCOUNT_TYPES.SMART_WALLET, account, backendAccounts));
    });
    await Promise.all(newAccountsPromises);
  };
};

export const setSmartWalletUpgradeStatusAction = (upgradeStatus: string) => {
  return async (dispatch: Function) => {
    dispatch(saveDbAction('smartWallet', { upgradeStatus }));
    if (upgradeStatus === SMART_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE) {
      dispatch({ type: RESET_SMART_WALLET_DEPLOYMENT });
    }
    dispatch({
      type: SET_SMART_WALLET_UPGRADE_STATUS,
      payload: upgradeStatus,
    });
  };
};

export const setSmartWalletDeploymentDataAction = (hash: ?string = null, error: ?SmartWalletDeploymentError = null) => {
  return async (dispatch: Function) => {
    const deploymentData = { hash, error };
    dispatch(saveDbAction('smartWallet', { deploymentData }));
    dispatch({
      type: SET_SMART_WALLET_DEPLOYMENT_DATA,
      payload: deploymentData,
    });
  };
};

export const resetSmartWalletDeploymentDataAction = () => {
  return async (dispatch: Function) => {
    await dispatch(setSmartWalletDeploymentDataAction(null, null));
  };
};

export const connectSmartWalletAccountAction = (accountId: string) => {
  return async (dispatch: Function) => {
    if (!smartWalletService || !smartWalletService.sdkInitialized) return;
    const connectedAccount = await smartWalletService.connectAccount(accountId).catch(() => null);
    if (!connectedAccount) {
      Toast.show({
        message: 'Failed to connect to Smart Wallet account',
        type: 'warning',
        title: 'Unable to upgrade',
        autoClose: false,
      });
      return;
    }
    dispatch({
      type: SET_SMART_WALLET_CONNECTED_ACCOUNT,
      payload: connectedAccount,
    });
    await dispatch(setActiveAccountAction(accountId));
  };
};

export const deploySmartWalletAction = () => {
  return async (dispatch: Function, getState: Function) => {
    const {
      smartWallet: {
        connectedAccount: {
          address: accountAddress,
          state: accountState,
        },
        upgrade: {
          status: upgradeStatus,
        },
      },
    } = getState();

    if (upgradeStatus !== SMART_WALLET_UPGRADE_STATUSES.DEPLOYING) {
      dispatch({ type: START_SMART_WALLET_DEPLOYMENT });
    }

    await dispatch(resetSmartWalletDeploymentDataAction());
    await dispatch(setActiveAccountAction(accountAddress));

    if (accountState === sdkConstants.AccountStates.Deployed) {
      dispatch(setSmartWalletUpgradeStatusAction(
        SMART_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE,
      ));
      console.log('deploySmartWalletAction account is already deployed!');
      return;
    }

    await dispatch(fetchGasInfoAction());
    const gasInfo = get(getState(), 'history.gasInfo', {});
    const gasPriceWei = getGasPriceWei(gasInfo);
    const deployEstimate = smartWalletService.getDeployEstimate(gasPriceWei);
    const feeSmartContractDeployEth = parseFloat(formatAmount(utils.formatEther(deployEstimate)));
    const balances = accountBalancesSelector(getState());
    const etherBalance = getBalance(balances, ETH);

    if (etherBalance < feeSmartContractDeployEth) {
      Toast.show({
        message: 'Not enough ETH to make deployment',
        type: 'warning',
        title: 'Unable to upgrade',
        autoClose: false,
      });
      await dispatch(setSmartWalletDeploymentDataAction(
        null,
        SMART_WALLET_DEPLOYMENT_ERRORS.INSUFFICIENT_FUNDS,
      ));

      dispatch({ type: RESET_SMART_WALLET_DEPLOYMENT });

      return;
    }

    const deployTxHash = await smartWalletService.deploy();
    if (!deployTxHash) {
      await dispatch(setSmartWalletDeploymentDataAction(null, SMART_WALLET_DEPLOYMENT_ERRORS.SDK_ERROR));
      return;
    }
    await dispatch(setSmartWalletDeploymentDataAction(deployTxHash));

    // depends from where called status might be `deploying` already
    if (upgradeStatus !== SMART_WALLET_UPGRADE_STATUSES.DEPLOYING) {
      await dispatch(setSmartWalletUpgradeStatusAction(
        SMART_WALLET_UPGRADE_STATUSES.DEPLOYING,
      ));
    }

    // update accounts info
    await dispatch(loadSmartWalletAccountsAction());
    const account = await smartWalletService.fetchConnectedAccount();
    dispatch({
      type: SET_SMART_WALLET_CONNECTED_ACCOUNT,
      account,
    });
  };
};

export const addAssetsToSmartWalletUpgradeAction = (assets: AssetTransfer[]) => ({
  type: ADD_SMART_WALLET_UPGRADE_ASSETS,
  payload: assets,
});

export const addCollectiblesToSmartWalletUpgradeAction = (collectibles: CollectibleTransfer[]) => ({
  type: ADD_SMART_WALLET_UPGRADE_COLLECTIBLES,
  payload: collectibles,
});

export const addRecoveryAgentsToSmartWalletUpgradeAction = (recoveryAgents: RecoveryAgent[]) => ({
  type: ADD_SMART_WALLET_RECOVERY_AGENTS,
  payload: recoveryAgents,
});

export const dismissSmartWalletUpgradeAction = () => {
  return async (dispatch: Function) => {
    dispatch(saveDbAction('app_settings', { appSettings: { smartWalletUpgradeDismissed: true } }));
    dispatch({ type: DISMISS_SMART_WALLET_UPGRADE });
  };
};

export const setAssetsTransferTransactionsAction = (transactions: Object[]) => {
  return async (dispatch: Function) => {
    await dispatch(saveDbAction('smartWallet', { upgradeTransferTransactions: transactions }));
    dispatch({
      type: SET_SMART_WALLET_ASSETS_TRANSFER_TRANSACTIONS,
      payload: transactions,
    });
  };
};

export const createAssetsTransferTransactionsAction = (wallet: Object, transactions: Object[]) => {
  return async (dispatch: Function) => {
    // reset local nonce to transaction count
    await dispatch(resetLocalNonceToTransactionCountAction(wallet));
    dispatch(setSmartWalletUpgradeStatusAction(SMART_WALLET_UPGRADE_STATUSES.TRANSFERRING_ASSETS));
    const signedTransactions = [];
    // we need this to wait for each to complete because of local nonce increment
    for (const transaction of transactions) { // eslint-disable-line
      const signedTransaction = await dispatch(signAssetTransactionAction(transaction, wallet)); // eslint-disable-line
      signedTransactions.push({
        transaction,
        signedTransaction,
      });
    }
    // filter out if any of the signed transactions got empty object or error
    const signedTransactionsFixed = signedTransactions.filter(tx =>
      !!tx && !!tx.signedTransaction && Object.keys(tx.signedTransaction),
    );
    dispatch(setAssetsTransferTransactionsAction(signedTransactionsFixed));
  };
};

export const checkAssetTransferTransactionsAction = () => {
  return async (dispatch: Function, getState: Function) => {
    const {
      assets: { data: assets },
      history: {
        data: transactionsHistory,
      },
      collectibles: { transactionHistory: collectiblesHistory = {} },
      smartWallet: {
        upgrade: {
          status: upgradeStatus,
          transfer: {
            transactions: transferTransactions = [],
          },
        },
      },
    } = getState();
    if (upgradeStatus !== SMART_WALLET_UPGRADE_STATUSES.TRANSFERRING_ASSETS) return;
    if (!transferTransactions.length) {
      // TODO: no transactions at all?
      return;
    }

    // update with statuses from history
    // TODO: visit current workaround to get history from all wallets
    const accountIds = Object.keys(transactionsHistory);
    const allHistory = accountIds.reduce(
      // $FlowFixMe
      (existing = [], accountId) => {
        const walletCollectiblesHistory = collectiblesHistory[accountId] || [];
        const walletAssetsHistory = transactionsHistory[accountId] || [];
        return [...existing, ...walletAssetsHistory, ...walletCollectiblesHistory];
      },
      [],
    );

    let updatedTransactions = transferTransactions.map(transaction => {
      const { transactionHash } = transaction;
      if (!transactionHash || transaction.status === TX_CONFIRMED_STATUS) {
        return transaction;
      }

      const minedTx = allHistory.find(_transaction => _transaction.hash === transactionHash);
      if (!minedTx) return transaction;

      return { ...transaction, status: minedTx.status };
    });

    // if any is still pending then don't do anything
    const pendingTransactions = updatedTransactions.filter(transaction => transaction.status === TX_PENDING_STATUS);
    if (pendingTransactions.length) return;

    const _unsentTransactions = updatedTransactions.filter(transaction => transaction.status !== TX_CONFIRMED_STATUS);
    if (!_unsentTransactions.length) {
      const accounts = get(getState(), 'smartWallet.accounts');
      // account should be already created by this step
      await dispatch(setSmartWalletUpgradeStatusAction(
        SMART_WALLET_UPGRADE_STATUSES.DEPLOYING,
      ));
      const { address } = accounts[0];
      navigate(NavigationActions.navigate({ routeName: ASSETS }));
      await dispatch(connectSmartWalletAccountAction(address));
      await dispatch(fetchAssetsBalancesAction(assets));
      dispatch(fetchCollectiblesAction());
      await dispatch(deploySmartWalletAction());
    } else {
      const unsentTransactions = _unsentTransactions.sort(
        (_a, _b) => _a.signedTransaction.nonce - _b.signedTransaction.nonce,
      );
      // grab first in queue
      const unsentTransaction = unsentTransactions[0];
      const transactionHash = await dispatch(sendSignedAssetTransactionAction(unsentTransaction));
      if (!transactionHash) {
        Toast.show({
          message: 'Failed to send signed asset',
          type: 'warning',
          title: 'Unable to upgrade',
          autoClose: false,
        });
        return;
      }
      console.log('sent new asset transfer transaction: ', transactionHash);
      const { signedTransaction: { signedHash } } = unsentTransaction;
      const assetTransferTransaction = {
        ...unsentTransaction,
        transactionHash,
      };
      updatedTransactions = updatedTransactions
        .filter(
          transaction => transaction.signedTransaction.signedHash !== signedHash,
        )
        .concat({
          ...assetTransferTransaction,
          status: TX_PENDING_STATUS,
        });
      waitForTransaction(transactionHash)
        .then(async () => {
          const _updatedTransactions = updatedTransactions
            .filter(
              _transaction => _transaction.transactionHash !== transactionHash,
            ).concat({
              ...assetTransferTransaction,
              status: TX_CONFIRMED_STATUS,
            });
          await dispatch(setAssetsTransferTransactionsAction(_updatedTransactions));
          dispatch(checkAssetTransferTransactionsAction());
        })
        .catch(() => null);
    }
    dispatch(setAssetsTransferTransactionsAction(updatedTransactions));
  };
};

export const upgradeToSmartWalletAction = (wallet: Object, transferTransactions: Object[]) => {
  return async (dispatch: Function, getState: Function) => {
    const { smartWallet: { sdkInitialized } } = getState();
    if (!sdkInitialized) {
      Toast.show({
        message: 'Failed to load Smart Wallet SDK',
        type: 'warning',
        title: 'Unable to upgrade',
        autoClose: false,
      });
      return Promise.reject();
    }
    await dispatch(loadSmartWalletAccountsAction(wallet.privateKey));

    const { smartWallet: { accounts } } = getState();
    if (!accounts.length) {
      Toast.show({
        message: 'Failed to load Smart Wallet account',
        type: 'warning',
        title: 'Unable to upgrade',
        autoClose: false,
      });
      return Promise.reject();
    }

    const { address } = accounts[0];
    const addressedTransferTransactions = transferTransactions.map(transaction => {
      return { ...transaction, to: address };
    });
    await dispatch(createAssetsTransferTransactionsAction(
      wallet,
      addressedTransferTransactions,
    ));
    dispatch(checkAssetTransferTransactionsAction());
    return Promise.resolve(true);
  };
};

export const fetchVirtualAccountBalanceAction = () => {
  return async (dispatch: Function, getState: Function) => {
    const {
      assets: { data: assets },
      accounts: { data: accounts },
      session: { data: { isOnline } },
      smartWallet: { connectedAccount, sdkInitialized },
    } = getState();

    if ((!smartWalletService.sdkInitialized || !sdkInitialized) && isOnline) {
      navigate(NavigationActions.navigate({
        routeName: SMART_WALLET_UNLOCK,
        params: {
          successNavigateScreen: ASSETS,
        },
      }));
      return;
    }

    if (!isConnectedToSmartAccount(connectedAccount) || !isOnline) return;

    const accountId = getActiveAccountId(accounts);
    const ppnTokenAddress = getPPNTokenAddress(PPN_TOKEN, assets);
    const { decimals = 18 } = assets[PPN_TOKEN] || {};

    const [staked, pendingBalances] = await Promise.all([
      smartWalletService.getAccountStakedAmount(ppnTokenAddress),
      smartWalletService.getAccountPendingBalances(),
    ]);

    // process staked amount
    const stakedAmountFormatted = formatUnits(staked, decimals);

    dispatch(saveDbAction('paymentNetworkStaked', { paymentNetworkStaked: stakedAmountFormatted }, true));
    dispatch({
      type: UPDATE_PAYMENT_NETWORK_STAKED,
      payload: stakedAmountFormatted,
    });

    // process pending balances
    const accountBalances = pendingBalances.reduce((memo, tokenBalance) => {
      const symbol = get(tokenBalance, 'token.symbol', ETH);
      const { decimals: assetDecimals = 18 } = assets[symbol] || {};
      const balance = get(tokenBalance, 'incoming', new BigNumber(0));

      return {
        ...memo,
        [symbol]: {
          balance: formatUnits(balance, assetDecimals),
          symbol,
        },
      };
    }, {});
    const { paymentNetwork: { balances } } = getState();
    const updatedBalances = {
      ...balances,
      [accountId]: accountBalances,
    };
    dispatch(saveDbAction('paymentNetworkBalances', { paymentNetworkBalances: updatedBalances }, true));

    dispatch({
      type: UPDATE_PAYMENT_NETWORK_ACCOUNT_BALANCES,
      payload: {
        accountId,
        balances: accountBalances,
      },
    });
  };
};

export const managePPNInitFlag = (payments: Object[]) => {
  return async (dispatch: Function, getState: Function) => {
    if (!payments.length) return;

    await dispatch(fetchVirtualAccountBalanceAction());
    const {
      paymentNetwork: { availableStake },
    } = getState();

    if (availableStake || payments.length) {
      dispatch({ type: MARK_PLR_TANK_INITIALISED });
      dispatch(saveDbAction('isPLRTankInitialised', { isPLRTankInitialised: true }, true));
    }
  };
};

export const syncVirtualAccountTransactionsAction = (manageTankInitFlag?: boolean) => {
  return async (dispatch: Function, getState: Function) => {
    const {
      accounts: { data: accounts },
      smartWallet: { lastSyncedHash },
    } = getState();

    const accountId = getActiveAccountId(accounts);
    const payments = await smartWalletService.getAccountPayments(lastSyncedHash);

    // filter out already stored payments
    const { history: { data: currentHistory } } = getState();
    const accountHistory = currentHistory[accountId] || [];
    const newPayments = payments.filter(payment => {
      const paymentExists = accountHistory.find(({ hash }) => hash === payment.hash);
      return !paymentExists;
    });

    const transformedNewPayments = newPayments.map(payment => {
      const tokenSymbol = get(payment, 'token.symbol', ETH);
      const value = get(payment, 'value', new BigNumber(0));
      const senderAddress = get(payment, 'sender.account.address');
      const recipientAddress = get(payment, 'recipient.account.address');

      return buildHistoryTransaction({
        from: senderAddress,
        hash: payment.hash,
        to: recipientAddress,
        value: value.toString(),
        asset: tokenSymbol,
        isPPNTransaction: true,
        createdAt: +new Date(payment.updatedAt) / 1000,
        status: TX_CONFIRMED_STATUS,
      });
    });

    if (transformedNewPayments.length) {
      const newLastSyncedHash = transformedNewPayments[0].hash;
      dispatch({
        type: SET_SMART_WALLET_LAST_SYNCED_HASH,
        payload: newLastSyncedHash,
      });
      await dispatch(saveDbAction('smartWallet', { lastSyncedHash: newLastSyncedHash }));
    }

    // combine with account history & save
    const updatedAccountHistory = [...transformedNewPayments, ...accountHistory];
    const updatedHistory = updateAccountHistory(currentHistory, accountId, updatedAccountHistory);
    dispatch({ type: SET_HISTORY, payload: updatedHistory });
    dispatch(saveDbAction('history', { history: updatedHistory }, true));
    if (manageTankInitFlag) {
      dispatch(managePPNInitFlag(payments));
    }
  };
};

export const onSmartWalletSdkEventAction = (event: Object) => {
  return async (dispatch: Function, getState: Function) => {
    if (!event) return;

    const ACCOUNT_DEVICE_UPDATED = get(sdkModules, 'Api.EventNames.AccountDeviceUpdated', '');
    const ACCOUNT_TRANSACTION_UPDATED = get(sdkModules, 'Api.EventNames.AccountTransactionUpdated', '');
    const ACCOUNT_PAYMENT_UPDATED = get(sdkModules, 'Api.EventNames.AccountPaymentUpdated', '');
    const ACCOUNT_VIRTUAL_BALANCE_UPDATED = get(sdkModules, 'Api.EventNames.AccountVirtualBalanceUpdated', '');
    const TRANSACTION_COMPLETED = get(sdkConstants, 'AccountTransactionStates.Completed', '');
    const PAYMENT_COMPLETED = get(sdkConstants, 'AccountPaymentStates.Completed', '');

    if (!ACCOUNT_DEVICE_UPDATED || !ACCOUNT_TRANSACTION_UPDATED || !TRANSACTION_COMPLETED) {
      let path = 'sdkModules.Api.EventNames.AccountDeviceUpdated';
      if (!ACCOUNT_TRANSACTION_UPDATED) path = 'sdkModules.Api.EventNames.AccountTransactionUpdated';
      if (!TRANSACTION_COMPLETED) path = 'sdkConstants.AccountTransactionStates.Completed';
      Sentry.captureMessage('Missing Smart Wallet SDK constant', { extra: { path } });
    }

    // on wallet deployed
    const accountState = get(getState(), 'smartWallet.upgrade.status', '');
    if (event.name === ACCOUNT_DEVICE_UPDATED) {
      const newAccountState = get(event, 'payload.state', '');
      const deployedAccountState = sdkConstants.AccountStates.Deployed;
      if (newAccountState === deployedAccountState && accountState !== deployedAccountState) {
        dispatch(setSmartWalletUpgradeStatusAction(SMART_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE));
        Toast.show({
          message: 'Your Smart wallet has been deployed',
          type: 'success',
          title: 'Success',
          autoClose: true,
        });
      }
    }

    // manual transactions tracker
    if (event.name === ACCOUNT_TRANSACTION_UPDATED) {
      const {
        history: { data: currentHistory },
        accounts: { data: accounts },
        assets: { data: assets },
        paymentNetwork: { txToListen },
      } = getState();
      const activeAccountAddress = getActiveAccountAddress(accounts);
      const txHash = get(event, 'payload.hash', '').toLowerCase();
      const txStatus = get(event, 'payload.state', '');
      const txGasInfo = get(event, 'payload.gas', {});
      const txSenderAddress = get(event, 'payload.from.account.address', '');
      const txFound = txToListen.find(hash => hash.toLowerCase() === txHash);

      if (txStatus === TRANSACTION_COMPLETED) {
        if (txFound) {
          const { txUpdated, updatedHistory } = updateHistoryRecord(
            currentHistory,
            txHash,
            (transaction) => ({
              ...transaction,
              gasPrice: txGasInfo.price ? txGasInfo.price.toNumber() : transaction.gasPrice,
              gasUsed: txGasInfo.used ? txGasInfo.used.toNumber() : transaction.gasUsed,
              status: TX_CONFIRMED_STATUS,
            }));

          if (txUpdated) {
            if (txUpdated.note === PAYMENT_NETWORK_ACCOUNT_TOPUP) {
              Toast.show({
                message: 'Your Pillar Tank was successfully funded!',
                type: 'success',
                title: 'Success',
                autoClose: true,
              });
            } else if (txUpdated.note === PAYMENT_NETWORK_TX_SETTLEMENT) {
              Toast.show({
                message: 'Settlement process completed!',
                type: 'success',
                title: 'Success',
                autoClose: true,
              });
            } else if (addressesEqual(activeAccountAddress, txSenderAddress)) {
              Toast.show({
                message: 'Transaction was successfully sent!',
                type: 'success',
                title: 'Success',
                autoClose: true,
              });
            }

            dispatch(saveDbAction('history', { history: updatedHistory }, true));
            dispatch({
              type: SET_HISTORY,
              payload: updatedHistory,
            });
            dispatch({
              type: PAYMENT_NETWORK_UNSUBSCRIBE_TX_STATUS,
              payload: txHash,
            });
          }
        }
        dispatch(fetchAssetsBalancesAction(assets));
      }
    }

    // check status for assets transfer during migration
    if (event.name === ACCOUNT_TRANSACTION_UPDATED) {
      const transferTransactions = get(getState(), 'smartWallet.upgrade.transfer.transactions', []);
      const txHash = get(event, 'payload.hash', '').toLowerCase();
      const txStatus = get(event, 'payload.state', '');
      const txFound = transferTransactions.find(({ transactionHash }) => transactionHash === txHash);

      if (txStatus === TRANSACTION_COMPLETED) {
        if (txFound) {
          const updatedTransactions = transferTransactions.filter(
            _tx => _tx.transactionHash !== txFound.transactionHash,
          );
          updatedTransactions.push({
            ...txFound,
            status: TX_CONFIRMED_STATUS,
          });
          await dispatch(setAssetsTransferTransactionsAction(updatedTransactions));
        }
        dispatch(checkAssetTransferTransactionsAction());
      }
    }

    if (event.name === ACCOUNT_VIRTUAL_BALANCE_UPDATED) {
      const { assets: { data: assets } } = getState();
      const tokenTransferred = get(event, 'payload.token.address', null);
      const ppnTokenAddress = getPPNTokenAddress(PPN_TOKEN, assets);
      const { decimals = 18 } = assets[PPN_TOKEN] || {};

      if (addressesEqual(tokenTransferred, ppnTokenAddress)) {
        // update the balance
        const value = get(event, 'payload.value', '');
        const formattedValue = formatUnits(value, decimals);
        dispatch({
          type: UPDATE_PAYMENT_NETWORK_STAKED,
          payload: formattedValue,
        });
      }
    }

    // for virtual payments
    if (event.name === ACCOUNT_PAYMENT_UPDATED) {
      const {
        assets: { data: assets },
        accounts: { data: accounts },
      } = getState();
      const txAmount = get(event, 'payload.value', new BigNumber(0));
      const txToken = get(event, 'payload.token.symbol', ETH);
      const txStatus = get(event, 'payload.state', '');
      const activeAccountAddress = getActiveAccountAddress(accounts);
      const txReceiverAddress = get(event, 'payload.recipient.account.address', '');

      const { decimals = 18 } = assets[PPN_TOKEN] || {};
      const txAmountFormatted = formatUnits(txAmount, decimals);

      if (txStatus === PAYMENT_COMPLETED && activeAccountAddress === txReceiverAddress) {
        Toast.show({
          message: `You received ${formatMoney(txAmountFormatted.toString(), 4)} ${txToken}`,
          type: 'success',
          title: 'Success',
          autoClose: true,
        });
        dispatch(fetchAssetsBalancesAction(assets));
        dispatch(syncVirtualAccountTransactionsAction());
      }
    }
    console.log(event);
  };
};

export const ensureSmartAccountConnectedAction = (privateKey: string) => {
  return async (dispatch: Function, getState: Function) => {
    const {
      accounts: { data: accounts },
      smartWallet: { connectedAccount },
    } = getState();

    const accountId = getActiveAccountId(accounts);

    if (!smartWalletService || !smartWalletService.sdkInitialized) {
      await dispatch(initSmartWalletSdkAction(privateKey));
    }

    if (!isConnectedToSmartAccount(connectedAccount)) {
      await dispatch(connectSmartWalletAccountAction(accountId));
    }
  };
};

export const estimateTopUpVirtualAccountAction = (amount?: string = '1') => {
  return async (dispatch: Function, getState: Function) => {
    if (!smartWalletService || !smartWalletService.sdkInitialized) return;

    const { assets: { data: assets } } = getState();
    const { decimals = 18 } = assets[PPN_TOKEN] || {};
    const value = utils.parseUnits(amount, decimals);
    const tokenAddress = getPPNTokenAddress(PPN_TOKEN, assets);

    const response = await smartWalletService
      .estimateTopUpAccountVirtualBalance(value, tokenAddress)
      .catch((e) => {
        Toast.show({
          message: e.toString(),
          type: 'warning',
          autoClose: false,
        });
        return {};
      });

    if (!response || !Object.keys(response).length) return;

    const {
      fixedGas,
      totalGas,
      totalCost,
      gasPrice,
    } = response;

    dispatch({
      type: SET_ESTIMATED_TOPUP_FEE,
      payload: {
        fixedGas,
        totalGas,
        totalCost,
        gasPrice,
      },
    });
  };
};

export const topUpVirtualAccountAction = (amount: string) => {
  return async (dispatch: Function, getState: Function) => {
    if (!smartWalletService || !smartWalletService.sdkInitialized) return;

    const {
      accounts: { data: accounts },
      assets: { data: assets },
    } = getState();
    const accountId = getActiveAccountId(accounts);
    const accountAddress = getActiveAccountAddress(accounts);
    const { decimals = 18 } = assets[PPN_TOKEN] || {};
    const value = utils.parseUnits(amount.toString(), decimals);
    const tokenAddress = getPPNTokenAddress(PPN_TOKEN, assets);

    const estimated = await smartWalletService
      .estimateTopUpAccountVirtualBalance(value, tokenAddress)
      .catch((e) => {
        Toast.show({
          message: e.toString(),
          type: 'warning',
          autoClose: false,
        });
        return {};
      });

    if (!estimated || !Object.keys(estimated).length) return;

    const txHash = await smartWalletService.topUpAccountVirtualBalance(estimated)
      .catch((e) => {
        Toast.show({
          message: e.toString() || 'Failed to top up the account',
          type: 'warning',
          autoClose: false,
        });
        return null;
      });

    if (txHash) {
      const historyTx = buildHistoryTransaction({
        from: accountAddress,
        hash: txHash,
        to: accountAddress,
        value: value.toString(),
        asset: PPN_TOKEN,
        note: PAYMENT_NETWORK_ACCOUNT_TOPUP,
      });

      dispatch({
        type: ADD_TRANSACTION,
        payload: {
          accountId,
          historyTx,
        },
      });

      dispatch({
        type: PAYMENT_NETWORK_SUBSCRIBE_TO_TX_STATUS,
        payload: txHash,
      });

      const { history: { data: currentHistory } } = getState();
      dispatch(saveDbAction('history', { history: currentHistory }, true));

      Toast.show({
        message: 'Your Pillar Tank will be funded soon',
        type: 'success',
        title: 'Success',
        autoClose: true,
      });
    }
  };
};

export const setPLRTankAsInitAction = () => {
  return async (dispatch: Function) => {
    dispatch({
      type: MARK_PLR_TANK_INITIALISED,
    });
    dispatch(saveDbAction('isPLRTankInitialised', { isPLRTankInitialised: true }, true));
  };
};

export const fetchAvailableTxToSettleAction = () => {
  return async (dispatch: Function, getState: Function) => {
    if (!smartWalletService || !smartWalletService.sdkInitialized) {
      Toast.show({
        message: 'Smart Account is not initialized',
        type: 'warning',
        autoClose: false,
      });
      dispatch({
        type: SET_AVAILABLE_TO_SETTLE_TX,
        payload: [],
      });
      return;
    }

    const {
      accounts: { data: accounts },
      assets: { data: assets },
    } = getState();
    const activeAccountAddress = getActiveAccountAddress(accounts);

    dispatch({ type: START_FETCHING_AVAILABLE_TO_SETTLE_TX });
    const payments = await smartWalletService.getAccountPaymentsToSettle(activeAccountAddress);

    const txToSettle = payments.map(item => {
      const { decimals = 18 } = assets[item.token] || {};
      return {
        token: item.token,
        hash: item.hash,
        value: new BigNumber(formatUnits(item.value, decimals)),
        createdAt: item.updatedAt,
      };
    });
    dispatch({
      type: SET_AVAILABLE_TO_SETTLE_TX,
      payload: txToSettle,
    });
  };
};

export const estimateSettleBalanceAction = (txToSettle: Object) => {
  return async (dispatch: Function) => {
    if (!smartWalletService || !smartWalletService.sdkInitialized) {
      Toast.show({
        message: 'Smart Account is not initialized',
        type: 'warning',
        autoClose: false,
      });
      return;
    }

    const hashes = txToSettle.map(({ hash }) => hash);
    const response = await smartWalletService
      .estimateWithdrawAccountPayment(hashes)
      .catch((e) => {
        Toast.show({
          message: e.toString() || 'You need to deposit ETH to cover the withdrawal',
          type: 'warning',
          autoClose: false,
        });
        return {};
      });

    if (!response || !Object.keys(response).length) return;

    const {
      fixedGas,
      totalGas,
      totalCost,
      gasPrice,
    } = response;

    dispatch({
      type: SET_ESTIMATED_SETTLE_TX_FEE,
      payload: {
        fixedGas,
        totalGas,
        totalCost,
        gasPrice,
      },
    });
  };
};

export const settleTransactionsAction = (txToSettle: TxToSettle[]) => {
  return async (dispatch: Function, getState: Function) => {
    if (!smartWalletService || !smartWalletService.sdkInitialized) {
      Toast.show({
        message: 'Smart Account is not initialized',
        type: 'warning',
        autoClose: false,
      });
      return;
    }

    const hashes = txToSettle.map(({ hash }) => hash);
    const estimated = await smartWalletService
      .estimateWithdrawAccountPayment(hashes)
      .catch((e) => {
        Toast.show({
          message: e.toString() || 'You need to deposit ETH to cover the withdrawal',
          type: 'warning',
          autoClose: false,
        });
        return {};
      });

    if (!estimated || !Object.keys(estimated).length) return;

    const txHash = await smartWalletService.withdrawAccountPayment(estimated)
      .catch((e) => {
        Toast.show({
          message: e.toString() || 'Failed to settle the transactions',
          type: 'warning',
          autoClose: false,
        });
        return null;
      });

    if (txHash) {
      const { accounts: { data: accounts } } = getState();
      const accountId = getActiveAccountId(accounts);
      const accountAddress = getActiveAccountAddress(accounts);
      const settlementData = txToSettle.map(({ symbol, value, hash }) => ({
        symbol,
        value: value.toString(),
        hash,
      }));

      const historyTx = buildHistoryTransaction({
        from: accountAddress,
        hash: txHash,
        to: accountAddress,
        value: '0',
        asset: PAYMENT_NETWORK_TX_SETTLEMENT,
        note: PAYMENT_NETWORK_TX_SETTLEMENT,
        extra: settlementData,
      });

      dispatch({
        type: ADD_TRANSACTION,
        payload: {
          accountId,
          historyTx,
        },
      });

      dispatch({
        type: PAYMENT_NETWORK_SUBSCRIBE_TO_TX_STATUS,
        payload: txHash,
      });

      const { history: { data: currentHistory } } = getState();
      dispatch(saveDbAction('history', { history: currentHistory }, true));

      Toast.show({
        message: 'Settlement was successful. Please wait for the transaction to be mined',
        type: 'success',
        title: 'Success',
        autoClose: true,
      });
    }
  };
};

export const cleanSmartWalletAccountsAction = () => {
  return async (dispatch: Function, getState: Function) => {
    const {
      accounts: { data: accounts },
      balances: { data: balances },
      history: { data: history },
    } = getState();

    const activeAccount = accounts.find(({ isActive }) => isActive);
    const keyBasedAccount = accounts.find(({ type }) => type === ACCOUNT_TYPES.KEY_BASED);
    const smartAccounts = accounts.filter(({ type }) => type === ACCOUNT_TYPES.SMART_WALLET);

    if (!smartAccounts.length) {
      Toast.show({
        message: 'Smart Accounts not found',
        type: 'warning',
        autoClose: false,
      });
      return;
    }

    dispatch({
      type: UPDATE_ACCOUNTS,
      payload: [keyBasedAccount],
    });
    dispatch(saveDbAction('accounts', { accounts: [keyBasedAccount] }, true));

    const updatedBalances = { [keyBasedAccount.id]: balances[keyBasedAccount.id] };
    dispatch(saveDbAction('balances', { balances: updatedBalances }, true));
    dispatch({
      type: UPDATE_BALANCES,
      payload: updatedBalances,
    });

    const updatedHistory = { [keyBasedAccount.id]: history[keyBasedAccount.id] };
    dispatch(saveDbAction('history', { history: updatedHistory }, true));
    dispatch({
      type: SET_HISTORY,
      payload: updatedHistory,
    });

    dispatch({
      type: RESET_SMART_WALLET,
    });

    if (activeAccount.type === ACCOUNT_TYPES.SMART_WALLET) {
      dispatch(switchAccountAction(keyBasedAccount.id));
    }

    Toast.show({
      message: 'Smart Accounts cleaned',
      type: 'success',
      autoClose: false,
    });
  };
};

export const navigateToSendTokenAmountAction = (navOptions: Object) => {
  return async (dispatch: Function, getState: Function) => {
    const {
      accounts: { data: accounts },
      featureFlags: { data: { SMART_WALLET_ENABLED: smartWalletFeatureEnabled } },
    } = getState();
    const activeAccountType = getActiveAccountType(accounts);

    const standardSendFlow = NavigationActions.navigate({
      routeName: SEND_TOKEN_AMOUNT,
      params: navOptions,
    });

    const ppnSendFlow = NavigationActions.navigate({
      routeName: PPN_SEND_TOKEN_AMOUNT,
      params: navOptions,
    });

    if (!smartWalletFeatureEnabled
      || activeAccountType !== ACCOUNT_TYPES.SMART_WALLET
      || navOptions.assetData.token !== PPN_TOKEN
    ) {
      navigate(standardSendFlow);
      return;
    }

    if (!smartWalletService || !smartWalletService.sdkInitialized) {
      Toast.show({
        message: 'Smart Account is not initialized',
        type: 'warning',
        autoClose: false,
      });
      return;
    }

    const userInfo = await smartWalletService.searchAccount(navOptions.receiver).catch(null);
    if (!userInfo) {
      navigate(standardSendFlow);
      return;
    }

    navigate(ppnSendFlow);
  };
};

export const importSmartWalletAccountsAction = (privateKey: string, createNewAccount: boolean) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    if (!smartWalletService || !smartWalletService.sdkInitialized) return;

    const { user = {} } = await storage.get('user');
    const {
      session: { data: session },
      assets: { data: assets },
    } = getState();

    const smartAccounts = await smartWalletService.getAccounts();
    if (!smartAccounts.length && createNewAccount) {
      const newSmartAccount = await smartWalletService.createAccount();
      await api.registerSmartWallet({
        walletId: user.walletId,
        privateKey,
        ethAddress: newSmartAccount.address,
        fcmToken: session.fcmToken,
      });
      if (newSmartAccount) smartAccounts.push(newSmartAccount);
    }
    dispatch({
      type: SET_SMART_WALLET_ACCOUNTS,
      payload: smartAccounts,
    });
    await dispatch(saveDbAction('smartWallet', { accounts: smartAccounts }));

    // register on backend missed accounts
    let backendAccounts = await api.listAccounts(user.walletId);
    const registerOnBackendPromises = smartAccounts.map(async account => {
      const accountAddress = account.address.toLowerCase();
      const backendAccount = backendAccounts.find(({ ethAddress }) => ethAddress.toLowerCase() === accountAddress);
      if (!backendAccount) {
        return api.registerSmartWallet({
          walletId: user.walletId,
          privateKey,
          ethAddress: account.address,
          fcmToken: session.fcmToken,
        });
      }
      return Promise.resolve();
    });
    await Promise.all(registerOnBackendPromises);
    backendAccounts = await api.listAccounts(user.walletId);

    const newAccountsPromises = smartAccounts.map(async account => {
      return dispatch(addNewAccountAction(account.address, ACCOUNT_TYPES.SMART_WALLET, account, backendAccounts));
    });
    await Promise.all(newAccountsPromises);

    if (smartAccounts.length) {
      await dispatch(connectSmartWalletAccountAction(smartAccounts[0].address));
      await dispatch(setActiveAccountAction(smartAccounts[0].address));
      dispatch(fetchAssetsBalancesAction(assets));
      dispatch(fetchCollectiblesAction());
      dispatch(syncVirtualAccountTransactionsAction(true));
    }
  };
};

export const getAssetTransferGasLimitsAction = () => {
  return async (dispatch: Function, getState: Function) => {
    const {
      accounts: { data: accounts },
      assets: { supportedAssets },
      collectibles: { data: collectiblesByAccount },
      smartWallet: {
        upgrade: {
          transfer: {
            assets: transferAssets,
            collectibles: transferCollectibles,
          },
        },
      },
    } = getState();
    const from = getActiveAccountAddress(accounts);
    const accountId = getActiveAccountId(accounts);
    const collectibles = collectiblesByAccount[accountId];
    let to;
    /**
     * if sdk was initialized then it was initialized with wallet PK
     * and if not, let's make temporary init and re-init will happen later
     */
    if (!smartWalletService.sdkInitialized) {
      await smartWalletService.sdk.initialize().catch(() => null);
    }
    const smartAccounts = await smartWalletService.getAccounts().catch(() => null);
    if (!smartAccounts || !smartAccounts.length) {
      /**
       * let's create account, it will be later fetched or new will be created if re-init happens
       * we need smart wallet account address for precise gas limit calculation
       */
      const tempAccount = await smartWalletService.sdk.createAccount().catch(() => null);
      if (!tempAccount) {
        Toast.show({
          message: 'Failed to create Smart Wallet account',
          type: 'warning',
          title: 'Unable to calculate fees',
          autoClose: false,
        });
        return;
      }
      ({ address: to } = tempAccount);
    } else {
      // init already contains smart accounts, let's grab address from first one
      ([{ address: to }] = smartAccounts); // first account address
    }
    let estimateTransaction = {
      from,
      to,
    };
    [...transferAssets, ...transferCollectibles].map(({ name, key, amount }) => {
      let dispatchType;
      if (key) {
        const {
          id: tokenId,
          contractAddress,
        } = collectibles.find(({ assetContract, name: contractName }) =>
          `${assetContract}${contractName}` === key,
        ) || {};
        // collectible
        estimateTransaction = { ...estimateTransaction, tokenId, contractAddress };
        dispatchType = SET_COLLECTIBLE_TRANSFER_GAS_LIMIT;
      } else {
        const asset = supportedAssets.find(a => a.name === name);
        estimateTransaction = {
          ...estimateTransaction,
          symbol: name,
          contractAddress: asset ? asset.address : '',
          decimals: asset ? asset.decimals : 18,
          amount,
        };
        dispatchType = SET_ASSET_TRANSFER_GAS_LIMIT;
      }
      return calculateGasEstimate(estimateTransaction)
        .then(gasLimit =>
          dispatch({
            type: dispatchType,
            payload: {
              gasLimit,
              key: name || key,
            },
          }),
        );
    });
  };
};
