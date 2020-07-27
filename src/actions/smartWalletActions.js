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

import { sdkModules, sdkConstants } from '@smartwallet/sdk';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import { utils } from 'ethers';
import { BigNumber } from 'bignumber.js';

// components
import Toast from 'components/Toast';

// constants
import {
  SET_SMART_WALLET_SDK_INIT,
  SET_SMART_WALLET_ACCOUNTS,
  SET_SMART_WALLET_CONNECTED_ACCOUNT,
  SET_SMART_WALLET_ACCOUNT_ENS,
  SET_SMART_WALLET_UPGRADE_STATUS,
  SMART_WALLET_UPGRADE_STATUSES,
  SET_SMART_WALLET_DEPLOYMENT_DATA,
  SMART_WALLET_DEPLOYMENT_ERRORS,
  SET_SMART_WALLET_LAST_SYNCED_PAYMENT_ID,
  RESET_SMART_WALLET,
  START_SMART_WALLET_DEPLOYMENT,
  RESET_SMART_WALLET_DEPLOYMENT,
  PAYMENT_COMPLETED,
  PAYMENT_PROCESSED,
  SMART_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER,
  ADD_SMART_WALLET_CONNECTED_ACCOUNT_DEVICE,
  SMART_WALLET_ACCOUNT_DEVICE_REMOVED,
  SMART_WALLET_ACCOUNT_DEVICE_ADDED,
} from 'constants/smartWalletConstants';
import { ACCOUNT_TYPES, UPDATE_ACCOUNTS } from 'constants/accountsConstants';
import { ETH, SET_INITIAL_ASSETS, UPDATE_BALANCES } from 'constants/assetsConstants';
import {
  TX_CONFIRMED_STATUS,
  SET_HISTORY,
  ADD_TRANSACTION,
} from 'constants/historyConstants';
import {
  UPDATE_PAYMENT_NETWORK_ACCOUNT_BALANCES,
  SET_ESTIMATED_TOPUP_FEE,
  SET_ESTIMATED_WITHDRAWAL_FEE,
  PAYMENT_NETWORK_ACCOUNT_TOPUP,
  PAYMENT_NETWORK_SUBSCRIBE_TO_TX_STATUS,
  PAYMENT_NETWORK_UNSUBSCRIBE_TX_STATUS,
  UPDATE_PAYMENT_NETWORK_STAKED,
  SET_AVAILABLE_TO_SETTLE_TX,
  START_FETCHING_AVAILABLE_TO_SETTLE_TX,
  SET_ESTIMATED_SETTLE_TX_FEE,
  PAYMENT_NETWORK_TX_SETTLEMENT,
  MARK_PLR_TANK_INITIALISED,
  PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
  RESET_ESTIMATED_SETTLE_TX_FEE,
  RESET_ESTIMATED_WITHDRAWAL_FEE,
  RESET_ESTIMATED_TOPUP_FEE,
} from 'constants/paymentNetworkConstants';
import { PIN_CODE, WALLET_ACTIVATED } from 'constants/navigationConstants';
import { DEVICE_CATEGORIES } from 'constants/connectedDevicesConstants';
import { ADD_NOTIFICATION } from 'constants/notificationConstants';

// configs
import { PPN_TOKEN } from 'configs/assetsConfig';

// services
import smartWalletService from 'services/smartWallet';
import Storage from 'services/storage';
import { navigate } from 'services/navigation';
import aaveService from 'services/aave';

// selectors
import { accountAssetsSelector, smartAccountAssetsSelector } from 'selectors/assets';
import { activeAccountAddressSelector } from 'selectors';
import { accountHistorySelector } from 'selectors/history';
import { accountBalancesSelector } from 'selectors/balances';

// types
import type { BalancesStore } from 'models/Asset';
import type {
  SmartWalletAccount,
  SmartWalletAccountDevice,
  SmartWalletDeploymentError,
  InitSmartWalletProps,
} from 'models/SmartWalletAccount';
import type { TxToSettle } from 'models/PaymentNetwork';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { SyntheticTransactionExtra, TransactionsStore } from 'models/Transaction';
import type { ConnectedDevice } from 'models/ConnectedDevice';
import type SDKWrapper from 'services/api';

// utils
import { buildHistoryTransaction, updateAccountHistory, updateHistoryRecord } from 'utils/history';
import {
  findAccountById,
  findFirstSmartAccount,
  getActiveAccountAddress,
  getActiveAccountId,
  normalizeForEns,
  getAccountId,
  getAccountAddress,
} from 'utils/accounts';
import {
  isSmartWalletDeviceDeployed,
  buildSmartWalletTransactionEstimate,
  isConnectedToSmartAccount,
  isHiddenUnsettledTransaction,
} from 'utils/smartWallet';
import {
  addressesEqual,
  getAssetData,
  getAssetDataByAddress,
  getAssetsAsList,
  getBalance,
  getPPNTokenAddress,
} from 'utils/assets';
import {
  formatMoney,
  formatUnits,
  isCaseInsensitiveMatch,
  parseTokenAmount,
  printLog,
  reportLog,
} from 'utils/common';
import { getPrivateKeyFromPin, normalizeWalletAddress } from 'utils/wallet';

// actions
import { addAccountAction, setActiveAccountAction, switchAccountAction } from './accountsActions';
import { saveDbAction } from './dbActions';
import { fetchAssetsBalancesAction, fetchInitialAssetsAction } from './assetsActions';
import { fetchCollectiblesAction } from './collectiblesActions';
import { fetchSmartWalletTransactionsAction, insertTransactionAction } from './historyActions';
import { completeConnectedDeviceRemoveAction, setConnectedDevicesAction } from './connectedDevicesActions';
import { extractEnsInfoFromTransactionsAction } from './ensRegistryActions';
import { fetchDepositedAssetsAction } from './lendingActions';
import { checkKeyBasedAssetTransferTransactionsAction } from './keyBasedAssetTransferActions';


const storage = Storage.getInstance('db');

const isValidSyntheticExchangePayment = (type: string, extra: any) => {
  const syntheticsExchangeType = get(sdkConstants, 'AccountPaymentTypes.SyntheticsExchange');
  return !isEmpty(type) && !isEmpty(extra) && type === syntheticsExchangeType;
};

const notifySmartWalletNotInitialized = () => {
  Toast.show({
    message: 'Smart Account is not initialized',
    type: 'warning',
    autoClose: false,
  });
};

const mapToConnectedDevices = (
  smartWalletDevices: SmartWalletAccountDevice[],
): ConnectedDevice[] => smartWalletDevices
  // extensions are SDK internal device types which should not be managed manually
  .filter(({ type }) => type !== sdkConstants.AccountDeviceTypes.Extension)
  .map(({
    device: { address },
    updatedAt,
  }: SmartWalletAccountDevice) => ({
    category: DEVICE_CATEGORIES.SMART_WALLET_DEVICE,
    address,
    updatedAt,
  }));

export const loadSmartWalletAccountsAction = (privateKey?: string) => {
  return async (dispatch: Dispatch, getState: GetState, api: Object) => {
    if (!smartWalletService || !smartWalletService.sdkInitialized) return;

    const { user = {} } = await storage.get('user');
    const { session: { data: session } } = getState();

    const smartAccounts = await smartWalletService.getAccounts();
    if (!smartAccounts.length && privateKey) {
      const newSmartAccount = await smartWalletService.createAccount(user.username);
      if (newSmartAccount) smartAccounts.push(newSmartAccount);
    }
    dispatch({
      type: SET_SMART_WALLET_ACCOUNTS,
      payload: smartAccounts,
    });
    await dispatch(saveDbAction('smartWallet', { accounts: smartAccounts }));

    // register missed accounts on the backend
    if (privateKey) {
      await smartWalletService.syncSmartAccountsWithBackend(
        api,
        smartAccounts,
        user.walletId,
        privateKey,
        session.fcmToken,
      );
    }
    const backendAccounts = await api.listAccounts(user.walletId);

    const accountsPromises = smartAccounts.map(async account => {
      return dispatch(addAccountAction(account.address, ACCOUNT_TYPES.SMART_WALLET, account, backendAccounts));
    });
    await Promise.all(accountsPromises);
  };
};

export const setSmartWalletUpgradeStatusAction = (upgradeStatus: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    dispatch(saveDbAction('smartWallet', { upgradeStatus }));
    if (upgradeStatus === SMART_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE) {
      dispatch({ type: RESET_SMART_WALLET_DEPLOYMENT });

      const accountAssets = accountAssetsSelector(getState());
      if (isEmpty(accountAssets)) dispatch(fetchInitialAssetsAction(false));
    }
    dispatch({
      type: SET_SMART_WALLET_UPGRADE_STATUS,
      payload: upgradeStatus,
    });
  };
};

export const setSmartWalletDeploymentDataAction = (hash: ?string = null, error: ?SmartWalletDeploymentError = null) => {
  return async (dispatch: Dispatch) => {
    const deploymentData = { hash, error };
    dispatch(saveDbAction('smartWallet', { deploymentData }));
    dispatch({
      type: SET_SMART_WALLET_DEPLOYMENT_DATA,
      payload: deploymentData,
    });
  };
};

export const resetSmartWalletDeploymentDataAction = () => {
  return async (dispatch: Dispatch) => {
    await dispatch(setSmartWalletDeploymentDataAction(null, null));
  };
};

export const setSmartWalletConnectedAccount = (connectedAccount: SmartWalletAccount) => {
  return (dispatch: Dispatch) => {
    const smartWalletAccountDevices = get(connectedAccount, 'devices', []);
    const mapped = mapToConnectedDevices(smartWalletAccountDevices);
    dispatch(setConnectedDevicesAction(mapped));
    dispatch({ type: SET_SMART_WALLET_CONNECTED_ACCOUNT, payload: connectedAccount });
  };
};

export const fetchConnectedAccountAction = () => {
  return async (dispatch: Dispatch) => {
    const connectedAccount = await smartWalletService.fetchConnectedAccount();
    if (isEmpty(connectedAccount)) return;
    await dispatch(setSmartWalletConnectedAccount(connectedAccount));
  };
};

export const connectSmartWalletAccountAction = (
  accountId: string,
  setAccountActive: boolean = true,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (!smartWalletService || !smartWalletService.sdkInitialized) return;
    let { smartWallet: { connectedAccount } } = getState();

    if (isEmpty(connectedAccount)) {
      connectedAccount = await smartWalletService.connectAccount(accountId);
      if (isEmpty(connectedAccount)) {
        Toast.show({
          message: 'Failed to connect to Smart Wallet account',
          type: 'warning',
          title: 'Unable to connect',
          autoClose: false,
        });
        return;
      }
      dispatch(setSmartWalletConnectedAccount(connectedAccount));
    }

    if (setAccountActive) dispatch(setActiveAccountAction(accountId));
  };
};

export const deploySmartWalletAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      smartWallet: {
        connectedAccount: {
          address: accountAddress,
          state: accountState,
        },
        upgrade: {
          status: upgradeStatus,
          deploymentStarted,
        },
      },
    } = getState();

    if (upgradeStatus !== SMART_WALLET_UPGRADE_STATUSES.DEPLOYING || !deploymentStarted) {
      dispatch({ type: START_SMART_WALLET_DEPLOYMENT });
    }

    await dispatch(resetSmartWalletDeploymentDataAction());
    await dispatch(setActiveAccountAction(accountAddress));

    if (accountState === sdkConstants.AccountStates.Deployed) {
      dispatch(setSmartWalletUpgradeStatusAction(SMART_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE));
      printLog('deploySmartWalletAction account is already deployed!');
      return;
    }

    const { deployTxHash, error } = await smartWalletService.deployAccount();

    if (!deployTxHash) {
      await dispatch(setSmartWalletDeploymentDataAction(null, SMART_WALLET_DEPLOYMENT_ERRORS.SDK_ERROR));
      if (error && error === 'reverted') {
        dispatch({
          type: ADD_NOTIFICATION,
          payload: {
            message: 'Activation is temporarily unavailable. Please try again latter',
            title: 'Could not activate Smart Wallet',
            messageType: 'warning',
          },
        });
        return;
      }
      return;
    }

    await dispatch(setSmartWalletDeploymentDataAction(deployTxHash));

    // depends from where it's called status might already be `deploying`
    if (upgradeStatus !== SMART_WALLET_UPGRADE_STATUSES.DEPLOYING) {
      await dispatch(setSmartWalletUpgradeStatusAction(SMART_WALLET_UPGRADE_STATUSES.DEPLOYING));
    }

    // update account info
    await dispatch(loadSmartWalletAccountsAction());
    dispatch(fetchConnectedAccountAction());
  };
};

export const fetchVirtualAccountBalanceAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
      session: { data: { isOnline } },
      smartWallet: { connectedAccount },
    } = getState();

    if (!isConnectedToSmartAccount(connectedAccount) || !isOnline) return;

    const accountId = getActiveAccountId(accounts);
    const accountAssets = accountAssetsSelector(getState());
    const ppnTokenAddress = getPPNTokenAddress(PPN_TOKEN, accountAssets);
    const { decimals = 18 } = accountAssets[PPN_TOKEN] || {};

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
      const { decimals: assetDecimals = 18 } = accountAssets[symbol] || {};
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

export const managePPNInitFlagAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const accountHistory = accountHistorySelector(getState());
    const hasPpnPayments = accountHistory.some(({ isPPNTransaction }) => isPPNTransaction);
    if (!hasPpnPayments) return;

    await dispatch(fetchVirtualAccountBalanceAction());
    const { paymentNetwork: { availableStake } } = getState();

    if (availableStake || hasPpnPayments) {
      dispatch({ type: MARK_PLR_TANK_INITIALISED });
      dispatch(saveDbAction('isPLRTankInitialised', { isPLRTankInitialised: true }, true));
    }
  };
};

export const syncVirtualAccountTransactionsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
      smartWallet: { lastSyncedPaymentId },
      assets: { supportedAssets },
    } = getState();

    const smartWalletAccount = findFirstSmartAccount(accounts);
    if (!smartWalletAccount) return;
    const accountId = getAccountId(smartWalletAccount);
    const payments = await smartWalletService.getAccountPayments(lastSyncedPaymentId);
    const accountAssets = smartAccountAssetsSelector(getState());
    const assetsList = getAssetsAsList(accountAssets);

    // filter out already stored payments
    const { history: { data: currentHistory } } = getState();
    const accountHistory = currentHistory[accountId] || [];

    // new or updated payment is one that doesn't exist in history contain or its payment state was updated
    const newOrUpdatedPayments = payments.filter(
      ({ hash: paymentHash, state: prevStateInPPN }) => !accountHistory.some(
        ({ hash, stateInPPN }) => isCaseInsensitiveMatch(hash, paymentHash) && stateInPPN === prevStateInPPN,
      ),
    );

    const transformedNewPayments = newOrUpdatedPayments.map(payment => {
      const tokenSymbol = get(payment, 'token.symbol', ETH);
      const value = get(payment, 'value', new BigNumber(0));
      let senderAddress = get(payment, 'sender.account.address');
      let recipientAddress = get(payment, 'recipient.account.address');
      const stateInPPN = get(payment, 'state');
      const paymentHash = get(payment, 'hash');
      const paymentType = get(payment, 'paymentType');
      const paymentExtra = get(payment, 'extra');
      let additionalTransactionData = {};

      if (isValidSyntheticExchangePayment(paymentType, paymentExtra)) {
        const {
          value: syntheticValue,
          tokenAddress: syntheticAssetAddress,
          recipient: syntheticRecipient,
          sender: syntheticSender,
        } = paymentExtra;

        // check if recipient address is present in extra, else this is incoming payment
        if (!isEmpty(syntheticRecipient)) {
          const syntheticAsset = syntheticAssetAddress !== null
            ? getAssetDataByAddress(assetsList, supportedAssets, syntheticAssetAddress)
            : getAssetData(assetsList, supportedAssets, ETH); // if null then it's ETH

          // don't format synthetic value if asset not found at all because synthetic value will end up as 0
          if (!isEmpty(syntheticAsset)) {
            const { decimals, symbol: syntheticSymbol } = syntheticAsset;
            const syntheticToAmount = formatUnits(syntheticValue, decimals);
            const syntheticTransactionExtra: SyntheticTransactionExtra = {
              syntheticTransaction: {
                toAmount: Number(syntheticToAmount),
                toAssetCode: syntheticSymbol,
                toAddress: syntheticRecipient,
              },
            };
            additionalTransactionData = { extra: syntheticTransactionExtra };
          } else {
            // there shouldn't be any case where synthetic asset address is not supported by wallet
            reportLog('Unable to get wallet supported asset from synthetic asset address', { syntheticAssetAddress });
          }

          recipientAddress = syntheticRecipient;
        } else {
          // current account is synthetic receiver
          senderAddress = syntheticSender;
        }
      }

      // if transaction exists this will update only its status and stateInPPN
      const existingTransaction = accountHistory.find(({ hash }) => isCaseInsensitiveMatch(hash, paymentHash)) || {};

      return buildHistoryTransaction({
        from: senderAddress,
        hash: payment.hash,
        to: recipientAddress,
        value: value.toString(),
        asset: tokenSymbol,
        isPPNTransaction: true,
        createdAt: +new Date(payment.updatedAt) / 1000,
        ...existingTransaction,
        status: TX_CONFIRMED_STATUS,
        stateInPPN,
        ...additionalTransactionData,
      });
    });

    if (transformedNewPayments.length) {
      const newLastSyncedId = newOrUpdatedPayments[0].id;
      dispatch({
        type: SET_SMART_WALLET_LAST_SYNCED_PAYMENT_ID,
        payload: newLastSyncedId,
      });
      await dispatch(saveDbAction('smartWallet', { lastSyncedPaymentId: newLastSyncedId }));
    }

    // combine with account history & save
    const updatedAccountHistory = [...transformedNewPayments, ...accountHistory];
    const updatedHistory = updateAccountHistory(currentHistory, accountId, updatedAccountHistory);
    dispatch({ type: SET_HISTORY, payload: updatedHistory });
    dispatch(saveDbAction('history', { history: updatedHistory }, true));

    dispatch(extractEnsInfoFromTransactionsAction(payments));
  };
};

export const removeSmartWalletAccountDeviceAction = (deviceAddress: string) => {
  return async (dispatch: Dispatch) => {
    const deviceRemoved = await smartWalletService.removeAccountDevice(deviceAddress);
    if (!deviceRemoved) {
      Toast.show({
        message: 'Device remove failed',
        type: 'warning',
        title: 'Unable to remove device',
        autoClose: false,
      });
      return;
    }
    await dispatch(fetchConnectedAccountAction());
  };
};

export const onSmartWalletSdkEventAction = (event: Object) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (!event) return;

    const ACCOUNT_UPDATED = get(sdkModules, 'Api.EventNames.AccountUpdated', '');
    const ACCOUNT_DEVICE_UPDATED = get(sdkModules, 'Api.EventNames.AccountDeviceUpdated', '');
    const ACCOUNT_TRANSACTION_UPDATED = get(sdkModules, 'Api.EventNames.AccountTransactionUpdated', '');
    const ACCOUNT_PAYMENT_UPDATED = get(sdkModules, 'Api.EventNames.AccountPaymentUpdated', '');
    const ACCOUNT_VIRTUAL_BALANCE_UPDATED = get(sdkModules, 'Api.EventNames.AccountVirtualBalanceUpdated', '');
    const TRANSACTION_CREATED = get(sdkConstants, 'AccountTransactionStates.Created', '');
    const TRANSACTION_COMPLETED = get(sdkConstants, 'AccountTransactionStates.Completed', '');
    const transactionTypes = get(sdkConstants, 'AccountTransactionTypes', {});

    if (!ACCOUNT_DEVICE_UPDATED || !ACCOUNT_TRANSACTION_UPDATED || !TRANSACTION_COMPLETED) {
      let path = 'sdkModules.Api.EventNames.AccountDeviceUpdated';
      if (!ACCOUNT_TRANSACTION_UPDATED) path = 'sdkModules.Api.EventNames.AccountTransactionUpdated';
      if (!TRANSACTION_COMPLETED) path = 'sdkConstants.AccountTransactionStates.Completed';
      reportLog('Missing Smart Wallet SDK constant', { path });
    }

    /**
     * This event can happen not just on single device deployment, but
     * on initial account deployment as well, this is because initial account
     * deployment deploys both.
     *
     * Before showing notification we must should properly find out if
     * it's single device deployment or initial account deployment.
     */
    if (event.name === ACCOUNT_DEVICE_UPDATED) {
      // current upgrade (initial account deployment) status and state
      const accountUpgradeStatus = get(getState(), 'smartWallet.upgrade.status', '');
      const currentAccountState = get(getState(), 'smartWallet.connectedAccount.state', '');

      // incoming deployment state from event
      const newAccountDeviceState = get(event, 'payload.state', '');
      const newAccountDeviceNextState = get(event, 'payload.nextState', '');
      const eventAccountDeviceAddress = get(event, 'payload.device.address', '');

      // just a constant for comparing deployed state
      const deployedDeviceState = get(sdkConstants, 'AccountDeviceStates.Deployed', '');
      const createdDeviceState = get(sdkConstants, 'AccountDeviceStates.Created', '');

      // check if new account device state state is "deployed" and next state is not "created" (means undeployment)
      if (newAccountDeviceState === deployedDeviceState
        && newAccountDeviceNextState !== createdDeviceState) {
        // check if current wallet smart wallet account device is deployed
        if (currentAccountState !== deployedDeviceState
          && accountUpgradeStatus !== SMART_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE) {
          dispatch(setSmartWalletUpgradeStatusAction(SMART_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE));
          navigate(WALLET_ACTIVATED);
        } else {
          // otherwise it's actual smart wallet device deployment
          Toast.show({
            message: 'New Smart Wallet device has been added', // do not confuse users about device "deployment"
            type: 'success',
            title: 'Success',
            autoClose: true,
          });
        }

        // gas relayer switch check
        if (get(event, 'payload.features.gasTokenSupported')) {
          // update connected devices
          await dispatch(fetchConnectedAccountAction());
        }
      }

      const removingConnectedDeviceAddress = get(getState(), 'connectedDevices.removingDeviceAddress');
      if (removingConnectedDeviceAddress
        && newAccountDeviceState === createdDeviceState
        && addressesEqual(eventAccountDeviceAddress, removingConnectedDeviceAddress)) {
        await dispatch(removeSmartWalletAccountDeviceAction(eventAccountDeviceAddress));
        dispatch(completeConnectedDeviceRemoveAction());
      } else {
        dispatch(fetchConnectedAccountAction());
      }
    }

    // manual transactions tracker
    if (event.name === ACCOUNT_TRANSACTION_UPDATED) {
      const {
        accounts: { data: accounts },
        paymentNetwork: { txToListen },
        wallet: { data: { address: keyBasedWalletAddress } },
      } = getState();
      let { history: { data: currentHistory } } = getState();
      const activeAccountAddress = getActiveAccountAddress(accounts);
      const txHash = get(event, 'payload.hash', '').toLowerCase();
      const txStatus = get(event, 'payload.state', '');
      const txGasInfo = get(event, 'payload.gas', {});
      const txSenderAddress = get(event, 'payload.from.account.address', '');
      const txReceiverAddress = get(event, 'payload.to.address', '');
      const txSenderEnsName = get(event, 'payload.from.account.ensName', '');
      const txType = get(event, 'payload.transactionType', '');
      const txToListenFound = txToListen.find(hash => isCaseInsensitiveMatch(hash, txHash));
      const skipNotifications = [transactionTypes.TopUpErc20Approve];

      if (txStatus === TRANSACTION_COMPLETED) {
        if (addressesEqual(txSenderAddress, keyBasedWalletAddress)) {
          dispatch(checkKeyBasedAssetTransferTransactionsAction());
        }

        if (!skipNotifications.includes(txType)) {
          const aaveLendingPoolAddress = await aaveService.getLendingPoolAddress();
          const aaveTokenAddresses = await aaveService.getAaveTokenAddresses();

          let notificationMessage;
          if (txType === transactionTypes.TopUp) {
            notificationMessage = 'Your Pillar Tank was successfully funded!';
          } else if (txType === transactionTypes.Withdrawal) {
            notificationMessage = 'Withdrawal process completed!';
          } else if (txType === transactionTypes.Settlement) {
            notificationMessage = 'Settlement process completed!';
          } else if (txType === transactionTypes.Erc20Transfer) {
            notificationMessage = 'New transaction received!';
          } else if (addressesEqual(txReceiverAddress, aaveLendingPoolAddress)) {
            notificationMessage = 'Your funds have been deposited!';
            dispatch(fetchDepositedAssetsAction());
          } else if (aaveTokenAddresses.some((tokenAddress) => addressesEqual(txReceiverAddress, tokenAddress))) {
            notificationMessage = 'Your funds have been withdrawn!';
            dispatch(fetchDepositedAssetsAction());
          } else if (addressesEqual(activeAccountAddress, txSenderAddress)) {
            notificationMessage = 'Transaction was successfully sent!';
          }

          if (notificationMessage) {
            Toast.show({
              message: notificationMessage,
              type: 'success',
              title: 'Success',
              autoClose: true,
            });
          }

          if (txToListenFound) {
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
              dispatch(saveDbAction('history', { history: updatedHistory }, true));
              dispatch({
                type: SET_HISTORY,
                payload: updatedHistory,
              });
              dispatch({
                type: PAYMENT_NETWORK_UNSUBSCRIBE_TX_STATUS,
                payload: txHash,
              });
              currentHistory = getState().history.data;
            }
          } else {
            dispatch(fetchSmartWalletTransactionsAction());
          }
          dispatch(fetchAssetsBalancesAction());
        }
      }

      if (txStatus === TRANSACTION_CREATED && txType === transactionTypes.UpdateAccountEnsName) {
        const { txUpdated, updatedHistory } = updateHistoryRecord(
          currentHistory,
          txHash,
          (transaction) => ({
            ...transaction,
            extra: { ensName: txSenderEnsName },
          }));

        if (txUpdated) {
          dispatch(saveDbAction('history', { history: updatedHistory }, true));
          dispatch({
            type: SET_HISTORY,
            payload: updatedHistory,
          });
          currentHistory = getState().history.data;
        }
      }
    }

    if (event.name === ACCOUNT_VIRTUAL_BALANCE_UPDATED) {
      const tokenTransferred = get(event, 'payload.token.address', null);
      const accountAssets = accountAssetsSelector(getState());
      const ppnTokenAddress = getPPNTokenAddress(PPN_TOKEN, accountAssets);
      const { decimals = 18 } = accountAssets[PPN_TOKEN] || {};

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
        accounts: { data: accounts },
      } = getState();
      const txAmount = get(event, 'payload.value', new BigNumber(0));
      const txToken = get(event, 'payload.token.symbol', ETH);
      const txStatus = get(event, 'payload.state', '');
      const activeAccountAddress = getActiveAccountAddress(accounts);
      const txReceiverAddress = get(event, 'payload.recipient.account.address', '');
      const txSenderAddress = get(event, 'payload.sender.account.address', '');

      const accountAssets = accountAssetsSelector(getState());
      const { decimals = 18 } = accountAssets[PPN_TOKEN] || {};
      const txAmountFormatted = formatUnits(txAmount, decimals);

      // check if received transaction
      if (addressesEqual(activeAccountAddress, txReceiverAddress)
        && !addressesEqual(txReceiverAddress, txSenderAddress)
        && [PAYMENT_COMPLETED, PAYMENT_PROCESSED].includes(txStatus)) {
        const paymentInfo = `${formatMoney(txAmountFormatted.toString(), 4)} ${txToken}`;
        if (txStatus === PAYMENT_COMPLETED) {
          Toast.show({
            message: `You received ${paymentInfo}`,
            type: 'success',
            title: 'Success',
            autoClose: true,
          });
        }
        dispatch(fetchAssetsBalancesAction());
        dispatch(syncVirtualAccountTransactionsAction());
      }
    }

    if (event.name === ACCOUNT_UPDATED && !event.payload.nextState) {
      // update account info
      await dispatch(loadSmartWalletAccountsAction());
      dispatch(fetchConnectedAccountAction());
    }

    printLog(event);
  };
};

export const initSmartWalletSdkAction = (walletPrivateKey: string) => {
  return async (dispatch: Dispatch) => {
    await smartWalletService.init(walletPrivateKey, (event) => dispatch(onSmartWalletSdkEventAction(event)));
    const initialized: boolean = smartWalletService.sdkInitialized;
    dispatch({
      type: SET_SMART_WALLET_SDK_INIT,
      payload: initialized,
    });
  };
};

export const ensureSmartAccountConnectedAction = (privateKey?: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
      smartWallet: { connectedAccount },
    } = getState();

    const accountId = getActiveAccountId(accounts);

    if (!smartWalletService || !smartWalletService.sdkInitialized) {
      if (privateKey) {
        await dispatch(initSmartWalletSdkAction(privateKey));
      } else {
        navigate(PIN_CODE, { initSmartWalletSdk: true });
      }
    }

    if (!isConnectedToSmartAccount(connectedAccount)) {
      await dispatch(connectSmartWalletAccountAction(accountId));
    }
  };
};

export const estimateTopUpVirtualAccountAction = (amount: string = '1') => {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (!smartWalletService || !smartWalletService.sdkInitialized) return;

    dispatch({ type: RESET_ESTIMATED_TOPUP_FEE });

    const accountAssets = accountAssetsSelector(getState());
    const balances = accountBalancesSelector(getState());
    const { decimals = 18 } = accountAssets[PPN_TOKEN] || {};
    const value = utils.parseUnits(amount, decimals);
    const tokenAddress = getPPNTokenAddress(PPN_TOKEN, accountAssets);
    if (!tokenAddress) return;

    const balance = getBalance(balances, PPN_TOKEN);
    if (balance < +amount) return;

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
    if (isEmpty(response)) return;

    const estimate = buildSmartWalletTransactionEstimate(response);

    dispatch({
      type: SET_ESTIMATED_TOPUP_FEE,
      payload: estimate,
    });
  };
};

export const topUpVirtualAccountAction = (amount: string, payForGasWithToken: boolean = false) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (!smartWalletService || !smartWalletService.sdkInitialized) return;

    const {
      accounts: { data: accounts },
    } = getState();
    const accountId = getActiveAccountId(accounts);
    const accountAddress = getActiveAccountAddress(accounts);
    const accountAssets = accountAssetsSelector(getState());
    const { decimals = 18 } = accountAssets[PPN_TOKEN] || {};
    const value = utils.parseUnits(amount.toString(), decimals);
    const tokenAddress = getPPNTokenAddress(PPN_TOKEN, accountAssets);

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

    if (isEmpty(estimated)) return;

    const txHash = await smartWalletService.topUpAccountVirtualBalance(estimated, payForGasWithToken)
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
        tag: PAYMENT_NETWORK_ACCOUNT_TOPUP,
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

export const estimateWithdrawFromVirtualAccountAction = (amount: string) => {
  return async (dispatch: Function, getState: Function) => {
    if (!smartWalletService || !smartWalletService.sdkInitialized) return;

    dispatch({ type: RESET_ESTIMATED_WITHDRAWAL_FEE });

    const accountAssets = accountAssetsSelector(getState());
    const { decimals = 18 } = accountAssets[PPN_TOKEN] || {};
    const value = utils.parseUnits(amount, decimals);
    const tokenAddress = getPPNTokenAddress(PPN_TOKEN, accountAssets);

    const response = await smartWalletService
      .estimateWithdrawFromVirtualAccount(value, tokenAddress)
      .catch((e) => {
        Toast.show({
          message: e.toString(),
          type: 'warning',
          autoClose: false,
        });
        return {};
      });
    if (isEmpty(response)) return;

    const estimate = buildSmartWalletTransactionEstimate(response);

    dispatch({
      type: SET_ESTIMATED_WITHDRAWAL_FEE,
      payload: estimate,
    });
  };
};

export const withdrawFromVirtualAccountAction = (amount: string, payForGasWithToken: boolean = false) => {
  return async (dispatch: Function, getState: Function) => {
    if (!smartWalletService || !smartWalletService.sdkInitialized) return;

    const {
      accounts: { data: accounts },
    } = getState();
    const accountId = getActiveAccountId(accounts);
    const accountAddress = getActiveAccountAddress(accounts);
    const accountAssets = accountAssetsSelector(getState());
    const { decimals = 18 } = accountAssets[PPN_TOKEN] || {};
    const value = utils.parseUnits(amount.toString(), decimals);
    const tokenAddress = getPPNTokenAddress(PPN_TOKEN, accountAssets);

    const estimated = await smartWalletService
      .estimateWithdrawFromVirtualAccount(value, tokenAddress)
      .catch((e) => {
        Toast.show({
          message: e.toString(),
          type: 'warning',
          autoClose: false,
        });
        return {};
      });

    if (isEmpty(estimated)) return;

    const txHash = await smartWalletService.withdrawFromVirtualAccount(estimated, payForGasWithToken)
      .catch((e) => {
        Toast.show({
          message: e.toString() || 'Failed to withdraw from the account',
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
        tag: PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
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
        message: 'Your withdrawal will be processed soon',
        type: 'success',
        title: 'Success',
        autoClose: true,
      });
    }
  };
};

export const setPLRTankAsInitAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch({
      type: MARK_PLR_TANK_INITIALISED,
    });
    dispatch(saveDbAction('isPLRTankInitialised', { isPLRTankInitialised: true }, true));
  };
};

export const fetchAvailableTxToSettleAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (!smartWalletService || !smartWalletService.sdkInitialized) {
      notifySmartWalletNotInitialized();
      dispatch({
        type: SET_AVAILABLE_TO_SETTLE_TX,
        payload: [],
      });
      return;
    }

    const activeAccountAddress = activeAccountAddressSelector(getState());
    const accountHistory = accountHistorySelector(getState());
    const accountAssets = accountAssetsSelector(getState());

    dispatch({ type: START_FETCHING_AVAILABLE_TO_SETTLE_TX });
    const payments = await smartWalletService.getAccountPaymentsToSettle(activeAccountAddress);

    const txToSettle = payments
      .filter(({ hash }) => !isHiddenUnsettledTransaction(hash, accountHistory))
      .map((item) => {
        const { decimals = 18 } = accountAssets[item.token] || {};
        let senderAddress = get(item, 'sender.account.address', '');

        const paymentExtra = get(item, 'extra');
        const paymentType = get(item, 'paymentType');
        if (isValidSyntheticExchangePayment(paymentType, paymentExtra)) {
          // check if sender address is present in extra
          const { sender: syntheticSender } = paymentExtra;
          if (!isEmpty(syntheticSender)) senderAddress = syntheticSender;
        }

        return {
          token: item.token,
          hash: item.hash,
          value: new BigNumber(formatUnits(item.value, decimals)),
          createdAt: item.updatedAt,
          senderAddress,
        };
      });
    dispatch({
      type: SET_AVAILABLE_TO_SETTLE_TX,
      payload: txToSettle,
    });
  };
};

export const estimateSettleBalanceAction = (txToSettle: Object) => {
  return async (dispatch: Dispatch) => {
    if (!smartWalletService || !smartWalletService.sdkInitialized) {
      notifySmartWalletNotInitialized();
      return;
    }

    dispatch({ type: RESET_ESTIMATED_SETTLE_TX_FEE });

    const hashes = txToSettle.map(({ hash }) => hash);
    const response = await smartWalletService
      .estimatePaymentSettlement(hashes)
      .catch((e) => {
        Toast.show({
          message: e.toString() || 'You need to deposit ETH to cover the withdrawal',
          type: 'warning',
          autoClose: false,
        });
        return {};
      });
    if (isEmpty(response)) return;

    const estimate = buildSmartWalletTransactionEstimate(response);

    dispatch({
      type: SET_ESTIMATED_SETTLE_TX_FEE,
      payload: estimate,
    });
  };
};

export const settleTransactionsAction = (txToSettle: TxToSettle[], payForGasWithToken: boolean = false) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (!smartWalletService || !smartWalletService.sdkInitialized) {
      notifySmartWalletNotInitialized();
      return;
    }

    const hashes = txToSettle.map(({ hash }) => hash);
    const estimated = await smartWalletService
      .estimatePaymentSettlement(hashes)
      .catch((e) => {
        Toast.show({
          message: e.toString() || 'You need to deposit ETH to cover the withdrawal',
          type: 'warning',
          autoClose: false,
        });
        return {};
      });

    if (isEmpty(estimated)) return;

    const txHash = await smartWalletService.withdrawAccountPayment(estimated, payForGasWithToken)
      .catch((e) => {
        Toast.show({
          message: e.toString() || 'Failed to settle the transactions',
          type: 'warning',
          autoClose: false,
        });
        return null;
      });

    if (txHash) {
      const {
        accounts: { data: accounts },
        assets: { supportedAssets },
      } = getState();
      const accountAssets = accountAssetsSelector(getState());
      const accountAssetsData = getAssetsAsList(accountAssets);
      const accountId = getActiveAccountId(accounts);
      const accountAddress = getActiveAccountAddress(accounts);
      const settlementData = txToSettle.map(({ symbol, value, hash }) => {
        const { decimals = 18 } = getAssetData(accountAssetsData, supportedAssets, symbol);
        const parsedValue = parseTokenAmount(value, decimals);
        return { symbol, value: parsedValue, hash };
      });

      const historyTx = buildHistoryTransaction({
        from: accountAddress,
        hash: txHash,
        to: accountAddress,
        value: '0',
        asset: PAYMENT_NETWORK_TX_SETTLEMENT,
        tag: PAYMENT_NETWORK_TX_SETTLEMENT,
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

      // history state is updated with ADD_TRANSACTION, update in storage
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
  return async (dispatch: Dispatch, getState: GetState) => {
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

    if (keyBasedAccount) {
      dispatch({
        type: UPDATE_ACCOUNTS,
        payload: [keyBasedAccount],
      });
      dispatch(saveDbAction('accounts', { accounts: [keyBasedAccount] }, true));

      const updatedBalances: BalancesStore = { [keyBasedAccount.id]: balances[keyBasedAccount.id] };
      dispatch(saveDbAction('balances', { balances: updatedBalances }, true));
      dispatch({
        type: UPDATE_BALANCES,
        payload: updatedBalances,
      });

      const updatedHistory: TransactionsStore = { [keyBasedAccount.id]: history[keyBasedAccount.id] };
      dispatch(saveDbAction('history', { history: updatedHistory }, true));
      dispatch({
        type: SET_HISTORY,
        payload: updatedHistory,
      });

      dispatch({
        type: RESET_SMART_WALLET,
      });

      if (activeAccount && activeAccount.type === ACCOUNT_TYPES.SMART_WALLET) {
        dispatch(switchAccountAction(keyBasedAccount.id));
      }
    }

    Toast.show({
      message: 'Smart Accounts cleaned',
      type: 'success',
      autoClose: false,
    });
  };
};

export const importSmartWalletAccountsAction = (privateKey: string) => {
  return async (dispatch: Dispatch, getState: GetState, api: Object) => {
    await dispatch(initSmartWalletSdkAction(privateKey));

    if (!smartWalletService || !smartWalletService.sdkInitialized) return;

    const { user = {} } = await storage.get('user');
    const { session: { data: session } } = getState();

    const smartAccounts = await smartWalletService.getAccounts();
    if (isEmpty(smartAccounts)) {
      const newSmartAccount = await smartWalletService.createAccount(user.username);
      if (newSmartAccount) smartAccounts.push(newSmartAccount);
    }
    dispatch({
      type: SET_SMART_WALLET_ACCOUNTS,
      payload: smartAccounts,
    });
    await dispatch(saveDbAction('smartWallet', { accounts: smartAccounts }));

    // register missed accounts on the backend
    await smartWalletService.syncSmartAccountsWithBackend(
      api,
      smartAccounts,
      user.walletId,
      privateKey,
      session.fcmToken,
    );
    const backendAccounts = await api.listAccounts(user.walletId);

    const newAccountsPromises = smartAccounts.map(async account => {
      return dispatch(addAccountAction(account.address, ACCOUNT_TYPES.SMART_WALLET, account, backendAccounts));
    });
    await Promise.all(newAccountsPromises);

    if (!isEmpty(smartAccounts)) {
      const accountId = normalizeWalletAddress(smartAccounts[0].address);
      await dispatch(connectSmartWalletAccountAction(accountId));
      // set default assets for smart wallet
      const initialAssets = await api.fetchInitialAssets(user.walletId);
      await dispatch({
        type: SET_INITIAL_ASSETS,
        payload: {
          accountId,
          assets: initialAssets,
        },
      });
      const assets = { [accountId]: initialAssets };
      dispatch(saveDbAction('assets', { assets }, true));
      dispatch(fetchAssetsBalancesAction());
      dispatch(fetchCollectiblesAction());
    }
  };
};

export const addSmartWalletAccountDeviceAction = (deviceAddress: string, payWithGasToken: boolean) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    await dispatch(fetchConnectedAccountAction());

    // checking new device
    const accountDevices = get(getState(), 'smartWallet.connectedAccount.devices');
    const existingDevice = accountDevices.find(({ device }) => addressesEqual(device.address, deviceAddress));
    let accountDevice: SmartWalletAccountDevice;

    if (existingDevice) {
      // check if device is already deployed or being deployed
      if (isSmartWalletDeviceDeployed(existingDevice)) return;
      accountDevice = existingDevice;
    }

    if (!accountDevice) {
      accountDevice = await smartWalletService.addAccountDevice(deviceAddress);
      if (!accountDevice) {
        Toast.show({
          message: 'Failed to add device to Smart Wallet account',
          type: 'warning',
          title: 'Cannot add device',
          autoClose: false,
        });
        return;
      }
      dispatch({ type: ADD_SMART_WALLET_CONNECTED_ACCOUNT_DEVICE, payload: accountDevice });
    }

    const accountDeviceDeploymentHash = await smartWalletService.deployAccountDevice(deviceAddress, payWithGasToken);
    if (!accountDeviceDeploymentHash) {
      // no transaction hash, unknown error occurred
      Toast.show({
        message: 'Failed to deploy Smart Wallet account device ',
        type: 'warning',
        title: 'Unable to deploy device',
        autoClose: false,
      });
      return;
    }

    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = findFirstSmartAccount(accounts);
    if (!smartWalletAccount) return;
    const accountId = getAccountId(smartWalletAccount);
    const accountAddress = getAccountAddress(smartWalletAccount);
    const historyTx = buildHistoryTransaction({
      from: accountAddress,
      hash: accountDeviceDeploymentHash,
      to: accountAddress,
      value: '0',
      asset: ETH,
      tag: SMART_WALLET_ACCOUNT_DEVICE_ADDED,
    });
    dispatch(insertTransactionAction(historyTx, accountId));

    dispatch(fetchConnectedAccountAction());
  };
};

export const removeDeployedSmartWalletAccountDeviceAction = (deviceAddress: string, payWithGasToken: boolean) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const accountDeviceUnDeploymentHash = await smartWalletService.unDeployAccountDevice(
      deviceAddress,
      payWithGasToken,
    );
    if (!accountDeviceUnDeploymentHash) {
      // no transaction hash, unknown error occurred
      Toast.show({
        message: 'Failed to remove device to Smart Wallet account',
        type: 'warning',
        title: 'Unable to add device',
        autoClose: false,
      });
      return;
    }

    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = findFirstSmartAccount(accounts);
    if (!smartWalletAccount) return;
    const accountId = getAccountId(smartWalletAccount);
    const accountAddress = getAccountAddress(smartWalletAccount);
    const historyTx = buildHistoryTransaction({
      from: accountAddress,
      hash: accountDeviceUnDeploymentHash,
      to: accountAddress,
      value: '0',
      asset: ETH,
      tag: SMART_WALLET_ACCOUNT_DEVICE_REMOVED,
    });
    dispatch(insertTransactionAction(historyTx, accountId));

    await dispatch(fetchConnectedAccountAction());
  };
};

export const setSmartWalletEnsNameAction = (username: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (!smartWalletService || !smartWalletService.sdkInitialized) return;
    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = findFirstSmartAccount(accounts);
    if (!smartWalletAccount) return;
    const accountId = getAccountId(smartWalletAccount);
    const accountAddress = getAccountAddress(smartWalletAccount);
    const normalizedUsername = normalizeForEns(username);

    const hash = await smartWalletService.setAccountEnsName(username);
    if (!hash) return;

    const historyTx = buildHistoryTransaction({
      from: accountAddress,
      hash,
      to: accountAddress,
      value: '0',
      asset: ETH,
      tag: SET_SMART_WALLET_ACCOUNT_ENS,
      extra: {
        ensName: normalizedUsername,
      },
    });
    dispatch(insertTransactionAction(historyTx, accountId));
  };
};

export const initSmartWalletSdkWithPrivateKeyOrPinAction = ({ privateKey: _privateKey, pin }: InitSmartWalletProps) => {
  return async (dispatch: Dispatch) => {
    let privateKey = _privateKey;
    if (!_privateKey && pin) {
      privateKey = await getPrivateKeyFromPin(pin, dispatch);
    }
    if (!privateKey) return;
    await dispatch(initSmartWalletSdkAction(privateKey));
  };
};

export const switchToGasTokenRelayerAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (!smartWalletService || !smartWalletService.sdkInitialized) return;

    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = findFirstSmartAccount(accounts);
    if (!smartWalletAccount) return;
    const accountId = getAccountId(smartWalletAccount);
    const accountAddress = getAccountAddress(smartWalletAccount);

    const hash = await smartWalletService.switchToGasTokenRelayer();
    if (!hash) {
      Toast.show({
        message: 'Unable to update your account. Please try again later',
        type: 'warning',
        autoClose: false,
      });
      return;
    }

    const historyTx = buildHistoryTransaction({
      from: accountAddress,
      hash,
      to: accountAddress,
      value: '0',
      asset: ETH,
      tag: SMART_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER,
    });
    dispatch(insertTransactionAction(historyTx, accountId));
    dispatch(fetchConnectedAccountAction());
  };
};

export const checkIfSmartWalletWasRegisteredAction = (privateKey: string, smartWalletAccountId: string) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      accounts: { data: accounts },
      user: { data: { walletId } },
      session: { data: session },
    } = getState();

    const account = findAccountById(smartWalletAccountId, accounts);
    if (!account || account.walletId) return;

    // No walletId set means we fail to register that account on the backend
    const accountAddress = getAccountAddress(account);
    const result = await api.registerSmartWallet({
      walletId,
      privateKey,
      ethAddress: accountAddress,
      fcmToken: session.fcmToken || '',
    });

    if (result?.error) {
      reportLog('Unable to register smart wallet', { reason: result.reason });
      return;
    }

    // validate the account was registered correctly
    const backendAccounts = await api.listAccounts(walletId);
    const registeredAccount = backendAccounts.find(({ ethAddress }) => addressesEqual(ethAddress, accountAddress));

    if (!registeredAccount || !registeredAccount.walletId) {
      reportLog('Unable to register smart wallet', { smartWalletAccountId });
      return;
    }

    const { accounts: { data: currentAccounts } } = getState();
    const updatedAccounts = currentAccounts.map(acc => ({
      ...acc,
      walletId: acc.id === smartWalletAccountId ? registeredAccount.walletId : acc.walletId,
    }));

    dispatch({
      type: UPDATE_ACCOUNTS,
      payload: updatedAccounts,
    });
    dispatch(saveDbAction('accounts', { accounts: updatedAccounts }, true));
  };
};
