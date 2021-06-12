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

import { sdkConstants, sdkModules } from '@smartwallet/sdk';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import { utils } from 'ethers';
import { BigNumber } from 'bignumber.js';
import { getEnv } from 'configs/envConfig';
import t from 'translations/translate';
import { Migrator } from '@etherspot/archanova-migrator';

// components
import Toast from 'components/Toast';

// constants
import {
  ADD_ARCHANOVA_WALLET_CONNECTED_ACCOUNT_DEVICE,
  ARCHANOVA_PPN_PAYMENT_COMPLETED,
  ARCHANOVA_PPN_PAYMENT_PROCESSED,
  RESET_ARCHANOVA_WALLET_DEPLOYMENT,
  SET_CHECKING_ARCHANOVA_SESSION,
  SET_GETTING_ARCHANOVA_WALLET_DEPLOYMENT_ESTIMATE,
  SET_ARCHANOVA_WALLET_ACCOUNTS,
  SET_ARCHANOVA_WALLET_CONNECTED_ACCOUNT,
  SET_ARCHANOVA_WALLET_DEPLOYMENT_DATA,
  SET_ARCHANOVA_WALLET_DEPLOYMENT_ESTIMATE,
  SET_ARCHANOVA_WALLET_LAST_SYNCED_PAYMENT_ID,
  SET_ARCHANOVA_SDK_INIT,
  SET_ARCHANOVA_WALLET_UPGRADE_STATUS,
  ARCHANOVA_WALLET_ACCOUNT_DEVICE_ADDED,
  ARCHANOVA_WALLET_ACCOUNT_DEVICE_REMOVED,
  ARCHANOVA_WALLET_DEPLOYMENT_ERRORS,
  ARCHANOVA_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER,
  ARCHANOVA_WALLET_UPGRADE_STATUSES,
  START_ARCHANOVA_WALLET_DEPLOYMENT,
} from 'constants/archanovaConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { ETH, SET_INITIAL_ASSETS } from 'constants/assetsConstants';
import {
  ADD_HISTORY_TRANSACTION,
  SET_HISTORY,
  TX_CONFIRMED_STATUS,
} from 'constants/historyConstants';
import {
  MARK_PLR_TANK_INITIALISED,
  PAYMENT_NETWORK_ACCOUNT_TOPUP,
  PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
  PAYMENT_NETWORK_SUBSCRIBE_TO_TX_STATUS,
  PAYMENT_NETWORK_TX_SETTLEMENT,
  PAYMENT_NETWORK_UNSUBSCRIBE_TX_STATUS,
  RESET_ESTIMATED_SETTLE_TX_FEE,
  RESET_ESTIMATED_TOPUP_FEE,
  RESET_ESTIMATED_WITHDRAWAL_FEE,
  SET_AVAILABLE_TO_SETTLE_TX,
  SET_ESTIMATED_SETTLE_TX_FEE,
  SET_ESTIMATED_TOPUP_FEE,
  SET_ESTIMATED_WITHDRAWAL_FEE,
  START_FETCHING_AVAILABLE_TO_SETTLE_TX,
  UPDATE_PAYMENT_NETWORK_ACCOUNT_BALANCES,
  UPDATE_PAYMENT_NETWORK_STAKED,
} from 'constants/paymentNetworkConstants';
import { PIN_CODE, WALLET_ACTIVATED } from 'constants/navigationConstants';
import { SABLIER_CANCEL_STREAM, SABLIER_WITHDRAW } from 'constants/sablierConstants';
import { initialAssets } from 'fixtures/assets';
import { CHAIN } from 'constants/chainConstants';

// configs
import { PPN_TOKEN } from 'configs/assetsConfig';

// services
import archanovaService, { formatEstimated, parseEstimatePayload } from 'services/archanova';
import { navigate } from 'services/navigation';
import aaveService from 'services/aave';
import etherspotService from 'services/etherspot';

// selectors
import { accountAssetsSelector, archanovaAccountAssetsSelector } from 'selectors/assets';
import {
  accountsSelector,
  activeAccountAddressSelector,
  activeAccountIdSelector,
  supportedAssetsSelector,
} from 'selectors';
import { archanovaAccountEthereumHistorySelector } from 'selectors/history';
import { accountEthereumWalletAssetsBalancesSelector } from 'selectors/balances';

// types
import type {
  InitArchanovaProps,
  ArchanovaWalletAccount,
  ArchanovaWalletAccountDevice,
  ArchanovaWalletDeploymentError,
} from 'models/ArchanovaWalletAccount';
import type { TxToSettle } from 'models/PaymentNetwork';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { TransactionStatus } from 'models/Transaction';

// utils
import {
  buildHistoryTransaction,
  getCrossChainAccountHistory,
  updateAccountHistoryForChain,
  updateHistoryRecord,
} from 'utils/history';
import {
  findFirstArchanovaAccount,
  findFirstEtherspotAccount,
  getAccountAddress,
  getAccountId,
  getActiveAccount,
  getActiveAccountId,
  isArchanovaAccount,
} from 'utils/accounts';
import {
  buildArchanovaTransactionEstimate,
  isConnectedToArchanovaSmartAccount,
  isHiddenUnsettledTransaction,
  isArchanovaDeviceDeployed,
  buildArchanovaTxFeeInfo,
} from 'utils/archanova';
import {
  addressesEqual,
  getAssetData,
  getAssetDataByAddress,
  getAssetsAsList,
  getBalance,
  getPPNTokenAddress,
  transformAssetsToObject,
} from 'utils/assets';
import {
  formatMoney,
  formatUnits,
  isCaseInsensitiveMatch,
  parseTokenAmount,
  printLog,
  reportErrorLog,
  reportLog,
} from 'utils/common';
import {
  getPrivateKeyFromPin,
  normalizeWalletAddress,
} from 'utils/wallet';

// actions
import {
  addAccountAction,
  initOnLoginArchanovaAccountAction,
  setActiveAccountAction,
  switchAccountAction,
  updateAccountExtraIfNeededAction,
} from './accountsActions';
import { saveDbAction } from './dbActions';
import { fetchAssetsBalancesAction } from './assetsActions';
import { fetchCollectiblesAction } from './collectiblesActions';
import {
  afterHistoryUpdatedAction,
  fetchTransactionsHistoryAction,
  insertTransactionAction,
} from './historyActions';
import { extractEnsInfoFromTransactionsAction } from './ensRegistryActions';
import { fetchDepositedAssetsAction } from './lendingActions';
import { checkKeyBasedAssetTransferTransactionsAction } from './keyBasedAssetTransferActions';
import { fetchUserStreamsAction } from './sablierActions';
import { lockScreenAction } from './authActions';
import {
  setEstimatingTransactionAction,
  setTransactionsEstimateErrorAction,
  setTransactionsEstimateFeeAction,
} from './transactionEstimateActions';


const isValidSyntheticExchangePayment = (type: string, extra: any) => {
  const syntheticsExchangeType = get(sdkConstants, 'AccountPaymentTypes.SyntheticsExchange');
  return !isEmpty(type) && !isEmpty(extra) && type === syntheticsExchangeType;
};

const notifySmartWalletNotInitialized = () => {
  Toast.show({
    message: t('toast.somethingWentWrong'),
    emoji: 'hushed',
    supportLink: true,
    autoClose: false,
  });
};

export const loadSmartWalletAccountsAction = (privateKey?: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (!archanovaService || !archanovaService.sdkInitialized) return;

    const { session: { data: { isOnline } } } = getState();

    if (!isOnline) return;

    let archanovaAccounts = await archanovaService.getAccounts();
    if (!archanovaAccounts?.length && privateKey) {
      const newArchanovaAccount = await archanovaService.createAccount();
      archanovaAccounts = [newArchanovaAccount];
    }

    if (!archanovaAccounts?.length) {
      reportErrorLog('loadSmartWalletAccountsAction failed: no archanovaAccounts');
      return;
    }

    dispatch({
      type: SET_ARCHANOVA_WALLET_ACCOUNTS,
      payload: archanovaAccounts,
    });

    await dispatch(saveDbAction('smartWallet', { accounts: archanovaAccounts }));

    archanovaAccounts.forEach((account) => dispatch(addAccountAction(
      account.address,
      ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET,
      account,
    )));
  };
};

export const setSmartWalletUpgradeStatusAction = (upgradeStatus: string) => {
  return (dispatch: Dispatch) => {
    dispatch(saveDbAction('smartWallet', { upgradeStatus }));
    if (upgradeStatus === ARCHANOVA_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE) {
      dispatch({ type: RESET_ARCHANOVA_WALLET_DEPLOYMENT });
    }
    dispatch({
      type: SET_ARCHANOVA_WALLET_UPGRADE_STATUS,
      payload: upgradeStatus,
    });
  };
};

export const setSmartWalletDeploymentDataAction = (
  hash: ?string = null,
  error: ?ArchanovaWalletDeploymentError = null,
) => {
  return async (dispatch: Dispatch) => {
    const deploymentData = { hash, error };
    dispatch(saveDbAction('smartWallet', { deploymentData }));
    dispatch({
      type: SET_ARCHANOVA_WALLET_DEPLOYMENT_DATA,
      payload: deploymentData,
    });
  };
};

export const resetSmartWalletDeploymentDataAction = () => {
  return async (dispatch: Dispatch) => {
    await dispatch(setSmartWalletDeploymentDataAction(null, null));
  };
};

export const setSmartWalletConnectedAccount = (connectedAccount: ArchanovaWalletAccount) => ({
  type: SET_ARCHANOVA_WALLET_CONNECTED_ACCOUNT,
  payload: connectedAccount,
});

export const fetchConnectedArchanovaAccountAction = () => {
  return async (dispatch: Dispatch) => {
    const connectedAccount = await archanovaService.fetchConnectedAccount();
    if (isEmpty(connectedAccount)) return;
    await dispatch(setSmartWalletConnectedAccount(connectedAccount));
  };
};

export const connectArchanovaAccountAction = (accountId: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (!archanovaService || !archanovaService.sdkInitialized) return;
    let { smartWallet: { connectedAccount: accountWithDevices } } = getState();

    if (isEmpty(accountWithDevices)) {
      accountWithDevices = await archanovaService.connectAccount(accountId);

      if (isEmpty(accountWithDevices)) {
        Toast.show({
          message: t('toast.failedToLogIn'),
          emoji: 'hushed',
          supportLink: true,
          autoClose: false,
        });
        return;
      }

      dispatch(setSmartWalletConnectedAccount(accountWithDevices));

      // raw API account as extra
      const apiAccount = archanovaService.getConnectedAccountFromSdkState();
      dispatch(updateAccountExtraIfNeededAction(accountId, apiAccount));
    }

    // sync deployed account state
    const connectedAccountState = accountWithDevices?.state;
    const currentUpgradeStatus = getState().smartWallet.upgrade?.status;
    if (currentUpgradeStatus !== ARCHANOVA_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE
      && connectedAccountState === sdkConstants.AccountStates.Deployed) {
      dispatch(setSmartWalletUpgradeStatusAction(ARCHANOVA_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE));
    }
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
          deploymentEstimate,
        },
      },
    } = getState();

    if (upgradeStatus !== ARCHANOVA_WALLET_UPGRADE_STATUSES.DEPLOYING || !deploymentStarted) {
      dispatch({ type: START_ARCHANOVA_WALLET_DEPLOYMENT });
    }

    await dispatch(resetSmartWalletDeploymentDataAction());
    await dispatch(setActiveAccountAction(accountAddress));

    if (accountState === sdkConstants.AccountStates.Deployed) {
      dispatch(setSmartWalletUpgradeStatusAction(ARCHANOVA_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE));
      printLog('deploySmartWalletAction account is already deployed!');
      return;
    }

    const { deployTxHash, error } = await archanovaService.deployAccount(deploymentEstimate?.raw);

    if (!deployTxHash) {
      await dispatch(setSmartWalletDeploymentDataAction(null, ARCHANOVA_WALLET_DEPLOYMENT_ERRORS.SDK_ERROR));
      if (isCaseInsensitiveMatch(error, ARCHANOVA_WALLET_DEPLOYMENT_ERRORS.REVERTED)) {
        Toast.show({
          message: t('toast.smartWalletActivationUnavailable'),
          emoji: 'hushed',
        });
        return;
      }
      return;
    }

    await dispatch(setSmartWalletDeploymentDataAction(deployTxHash));

    // depends from where it's called status might already be `deploying`
    if (upgradeStatus !== ARCHANOVA_WALLET_UPGRADE_STATUSES.DEPLOYING) {
      await dispatch(setSmartWalletUpgradeStatusAction(ARCHANOVA_WALLET_UPGRADE_STATUSES.DEPLOYING));
    }

    // update account info
    await dispatch(loadSmartWalletAccountsAction());
    dispatch(fetchConnectedArchanovaAccountAction());
  };
};

export const fetchVirtualAccountBalanceAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
      session: { data: { isOnline } },
      smartWallet: { connectedAccount },
    } = getState();

    if (!isConnectedToArchanovaSmartAccount(connectedAccount) || !isOnline) return;

    const accountId = getActiveAccountId(accounts);
    const accountAssets = accountAssetsSelector(getState());
    const ppnTokenAddress = getPPNTokenAddress(PPN_TOKEN, accountAssets);
    const { decimals = 18 } = accountAssets[PPN_TOKEN] || {};

    const [staked, pendingBalances] = await Promise.all([
      archanovaService.getAccountStakedAmount(ppnTokenAddress),
      archanovaService.getAccountPendingBalances(),
    ]);

    // process staked amount
    const stakedAmountFormatted = formatUnits(staked, decimals);

    dispatch(saveDbAction('paymentNetworkStaked', { paymentNetworkStaked: stakedAmountFormatted }, true));
    dispatch({
      type: UPDATE_PAYMENT_NETWORK_STAKED,
      payload: stakedAmountFormatted,
    });

    // process pending balances
    const accountPaymentNetworkBalances = pendingBalances.reduce((memo, tokenBalance) => {
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
      [accountId]: accountPaymentNetworkBalances,
    };
    dispatch(saveDbAction('paymentNetworkBalances', { paymentNetworkBalances: updatedBalances }, true));

    dispatch({
      type: UPDATE_PAYMENT_NETWORK_ACCOUNT_BALANCES,
      payload: {
        accountId,
        balances: accountPaymentNetworkBalances,
      },
    });
  };
};

export const managePPNInitFlagAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const accountEthereumHistory = archanovaAccountEthereumHistorySelector(getState());
    const hasPpnPayments = accountEthereumHistory.some(({ isPPNTransaction }) => isPPNTransaction);
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

    const smartWalletAccount = findFirstArchanovaAccount(accounts);
    if (!smartWalletAccount) return;
    const accountId = getAccountId(smartWalletAccount);
    const payments = await archanovaService.getAccountPayments(lastSyncedPaymentId);
    const accountAssets = archanovaAccountAssetsSelector(getState());
    const assetsList = getAssetsAsList(accountAssets);

    // filter out already stored payments
    const { history: { data: currentHistory } } = getState();

    // Archanova is Ethereum only
    const existingTransactions = currentHistory[accountId]?.[CHAIN.ETHEREUM] || [];

    // new or updated payment is one that doesn't exist in history contain or its payment state was updated
    const newOrUpdatedPayments = payments.filter(
      ({ hash: paymentHash, state: prevStateInPPN }) => existingTransactions.some(
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
      let transactionExtra;

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
            transactionExtra = {
              syntheticTransaction: {
                toAmount: Number(syntheticToAmount),
                toAssetCode: syntheticSymbol,
                toAddress: syntheticRecipient,
              },
            };
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
      const existingTransaction = existingTransactions.find(({
        hash,
      }) => isCaseInsensitiveMatch(hash, paymentHash)) || {};

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
        extra: transactionExtra,
      });
    });

    if (transformedNewPayments.length) {
      const newLastSyncedId = newOrUpdatedPayments[0].id;
      dispatch({
        type: SET_ARCHANOVA_WALLET_LAST_SYNCED_PAYMENT_ID,
        payload: newLastSyncedId,
      });
      await dispatch(saveDbAction('smartWallet', { lastSyncedPaymentId: newLastSyncedId }));
    }

    // combine with account history & save
    const updatedAccountHistory = [...transformedNewPayments, ...existingTransactions];
    const updatedHistory = updateAccountHistoryForChain(
      currentHistory,
      accountId,
      CHAIN.ETHEREUM,
      updatedAccountHistory,
    );
    dispatch({ type: SET_HISTORY, payload: updatedHistory });
    dispatch(saveDbAction('history', { history: updatedHistory }, true));

    dispatch(extractEnsInfoFromTransactionsAction(payments));
  };
};

export const removeSmartWalletAccountDeviceAction = (deviceAddress: string) => {
  return async (dispatch: Dispatch) => {
    const deviceRemoved = await archanovaService.removeAccountDevice(deviceAddress);
    if (!deviceRemoved) {
      Toast.show({
        message: t('toast.somethingWentWrong'),
        emoji: 'hushed',
        supportLink: true,
        autoClose: false,
      });
      return;
    }
    await dispatch(fetchConnectedArchanovaAccountAction());
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
      /* eslint-disable i18next/no-literal-string */
      let path = 'sdkModules.Api.EventNames.AccountDeviceUpdated';
      if (!ACCOUNT_TRANSACTION_UPDATED) path = 'sdkModules.Api.EventNames.AccountTransactionUpdated';
      if (!TRANSACTION_COMPLETED) path = 'sdkConstants.AccountTransactionStates.Completed';
      /* eslint-enable i18next/no-literal-string */
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

      // just a constant for comparing deployed state
      const deployedDeviceState = get(sdkConstants, 'AccountDeviceStates.Deployed', '');
      const createdDeviceState = get(sdkConstants, 'AccountDeviceStates.Created', '');

      // check if new account device state state is "deployed" and next state is not "created" (means undeployment)
      if (newAccountDeviceState === deployedDeviceState
        && newAccountDeviceNextState !== createdDeviceState) {
        // check if current wallet smart wallet account device is deployed
        if (currentAccountState !== deployedDeviceState
          && accountUpgradeStatus !== ARCHANOVA_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE) {
          dispatch(setSmartWalletUpgradeStatusAction(ARCHANOVA_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE));
          navigate(WALLET_ACTIVATED);
        } else {
          // otherwise it's actual smart wallet device deployment
          Toast.show({
            message: t('toast.smartWalletDeviceAdded'),
            emoji: 'tada',
            autoClose: true,
          });
        }

        // gas relayer switch check
        if (get(event, 'payload.features.gasTokenSupported')) {
          // update connected devices
          await dispatch(fetchConnectedArchanovaAccountAction());
        }
      }
    }

    // manual transactions tracker
    if (event.name === ACCOUNT_TRANSACTION_UPDATED) {
      const {
        accounts: { data: accounts },
        paymentNetwork: { txToListen },
        wallet: { data: walletData },
        assets: { supportedAssets },
      } = getState();
      let { history: { data: currentHistory } } = getState();
      const archanovaAccount = findFirstArchanovaAccount(accounts);
      if (!archanovaAccount) return;

      const archanovaAccountAddress = getAccountAddress(archanovaAccount);
      const txHash = get(event, 'payload.hash', '').toLowerCase();
      const txStatus = get(event, 'payload.state', '');
      const txGasInfo = get(event, 'payload.gas', {});
      const txSenderAddress = get(event, 'payload.from.account.address', '');
      const txReceiverAddress = get(event, 'payload.to.address', '');
      const txSenderEnsName = get(event, 'payload.from.account.ensName', '');
      const txType = get(event, 'payload.transactionType', '');
      const txToListenFound = txToListen.find(hash => isCaseInsensitiveMatch(hash, txHash));
      const skipNotifications = [transactionTypes.TopUpErc20Approve];

      const allAccountHistory = getCrossChainAccountHistory(currentHistory[archanovaAccountAddress]);
      const txFromHistory = allAccountHistory.find(tx => tx.hash === txHash);

      const getPaymentFromHistory = () => {
        const symbol = get(txFromHistory, 'extra.symbol', '');
        const amount = get(txFromHistory, 'extra.amount');
        const decimals = get(txFromHistory, 'extra.decimals');
        const formattedAmount = formatUnits(amount, decimals);
        return `${formattedAmount} ${symbol}`;
      };

      if (txStatus === TRANSACTION_COMPLETED) {
        if (addressesEqual(txSenderAddress, walletData?.address)) {
          dispatch(checkKeyBasedAssetTransferTransactionsAction());
        }

        if (!skipNotifications.includes(txType)) {
          const aaveLendingPoolAddress = await aaveService.getLendingPoolAddress();
          const aaveTokenAddresses = await aaveService.getAaveTokenAddresses();

          let notificationMessage;
          let toastEmoji = 'ok_hand'; // eslint-disable-line i18next/no-literal-string

          if ([transactionTypes.TopUp, transactionTypes.Withdrawal].includes(txType)) {
            const tokenValue = get(event, 'payload.tokenValue');
            const tokenAddress = get(event, 'payload.tokenAddress');
            const assetData = getAssetDataByAddress([], supportedAssets, tokenAddress);
            const amount = formatUnits(tokenValue, assetData.decimals);
            const paymentInfo = `${amount} ${assetData.symbol}`;
            if (txType === transactionTypes.TopUp) {
              notificationMessage = t('toast.PPNTopUpSuccess', { paymentInfo });
            } else {
              notificationMessage = t('toast.PPNWithdrawSuccess', { paymentInfo });
            }
          } else if (txType === transactionTypes.Settlement) {
            notificationMessage = t('toast.PPNSettleSuccess');
          } else if (txType === transactionTypes.Erc20Transfer) {
            const isReceived = addressesEqual(txReceiverAddress, archanovaAccountAddress);
            const tokenValue = get(event, 'payload.tokenValue');
            const tokenAddress = get(event, 'payload.tokenAddress');
            const assetData = getAssetDataByAddress([], supportedAssets, tokenAddress);
            const amount = formatUnits(tokenValue, assetData.decimals);
            const paymentInfo = `${amount} ${assetData.symbol}`;

            if (isReceived) {
              notificationMessage = t('toast.transactionReceived', { paymentInfo });
            } else {
              notificationMessage = t('toast.transactionSent', { paymentInfo });
            }
          } else if (addressesEqual(txReceiverAddress, aaveLendingPoolAddress)) {
            notificationMessage = t('toast.lendingDepositSuccess', { paymentInfo: getPaymentFromHistory() });
            dispatch(fetchDepositedAssetsAction());
          } else if (aaveTokenAddresses.some((tokenAddress) => addressesEqual(txReceiverAddress, tokenAddress))) {
            notificationMessage = t('toast.lendingWithdrawSuccess', { paymentInfo: getPaymentFromHistory() });
            dispatch(fetchDepositedAssetsAction());
          } else if (addressesEqual(getEnv().SABLIER_CONTRACT_ADDRESS, txReceiverAddress)) {
            if (txFromHistory?.tag === SABLIER_WITHDRAW) {
              const symbol = get(txFromHistory, 'extra.symbol', '');
              const currentAccountAssets = accountAssetsSelector(getState());
              const assetData = getAssetData(getAssetsAsList(currentAccountAssets), supportedAssets, symbol);
              notificationMessage = t('toast.sablierWithdraw', { assetName: assetData.name, assetSymbol: symbol });
            } else if (txFromHistory?.tag === SABLIER_CANCEL_STREAM) {
              notificationMessage = t('toast.sablierCancelStream');
              toastEmoji = 'x'; // eslint-disable-line i18next/no-literal-string
            }
            dispatch(fetchUserStreamsAction());
          } else if (addressesEqual(archanovaAccountAddress, txSenderAddress)) {
            notificationMessage = t('toast.transactionSent', { paymentInfo: getPaymentFromHistory() });
          }

          if (notificationMessage) {
            Toast.show({
              message: notificationMessage,
              emoji: toastEmoji,
              autoClose: false,
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
              dispatch(afterHistoryUpdatedAction());
              dispatch({
                type: PAYMENT_NETWORK_UNSUBSCRIBE_TX_STATUS,
                payload: txHash,
              });
              currentHistory = getState().history.data;
            }
          } else {
            dispatch(fetchTransactionsHistoryAction());
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
          dispatch(afterHistoryUpdatedAction());
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

      const archanovaAccount = findFirstArchanovaAccount(accounts);
      if (!archanovaAccount) return;

      const archanovaAccountAddress = getAccountAddress(archanovaAccount);
      const txReceiverAddress = get(event, 'payload.recipient.account.address', '');
      const txSenderAddress = get(event, 'payload.sender.account.address', '');

      const accountAssets = accountAssetsSelector(getState());
      const { decimals = 18 } = accountAssets[PPN_TOKEN] || {};
      const txAmountFormatted = formatUnits(txAmount, decimals);

      // check if received transaction
      if (addressesEqual(archanovaAccountAddress, txReceiverAddress)
        && !addressesEqual(txReceiverAddress, txSenderAddress)
        && [ARCHANOVA_PPN_PAYMENT_COMPLETED, ARCHANOVA_PPN_PAYMENT_PROCESSED].includes(txStatus)) {
        const paymentInfo = `${formatMoney(txAmountFormatted.toString(), 4)} ${txToken}`;
        if (txStatus === ARCHANOVA_PPN_PAYMENT_COMPLETED) {
          Toast.show({
            message: t('toast.transactionReceived', { paymentInfo }),
            emoji: 'ok_hand',
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
      dispatch(fetchConnectedArchanovaAccountAction());
    }

    printLog(event);
  };
};

export const initArchanovaSdkAction = (walletPrivateKey: string, forceInit: boolean = false) => {
  return async (dispatch: Dispatch) => {
    await archanovaService.init(
      walletPrivateKey,
      (event) => dispatch(onSmartWalletSdkEventAction(event)),
      forceInit,
    );
    const initialized: boolean = archanovaService.sdkInitialized;
    dispatch({
      type: SET_ARCHANOVA_SDK_INIT,
      payload: initialized,
    });
  };
};

export const ensureArchanovaAccountConnectedAction = (privateKey?: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
      smartWallet: { connectedAccount },
    } = getState();

    const accountId = getActiveAccountId(accounts);

    if (!archanovaService || !archanovaService.sdkInitialized) {
      if (privateKey) {
        await dispatch(initArchanovaSdkAction(privateKey));
      } else {
        navigate(PIN_CODE, { initSmartWalletSdk: true });
      }
    }

    if (!isConnectedToArchanovaSmartAccount(connectedAccount)) {
      await dispatch(connectArchanovaAccountAction(accountId));
    }
  };
};

export const estimateTopUpVirtualAccountAction = (amount: string = '1') => {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (!archanovaService || !archanovaService.sdkInitialized) return;

    dispatch({ type: RESET_ESTIMATED_TOPUP_FEE });

    const accountAssets = accountAssetsSelector(getState());
    const balances = accountEthereumWalletAssetsBalancesSelector(getState());
    const { decimals = 18 } = accountAssets[PPN_TOKEN] || {};
    const value = utils.parseUnits(amount, decimals);
    const tokenAddress = getPPNTokenAddress(PPN_TOKEN, accountAssets);
    if (!tokenAddress) return;

    const balance = getBalance(balances, PPN_TOKEN);
    if (balance < +amount) return;

    const response = await archanovaService
      .estimateTopUpAccountVirtualBalance(value, tokenAddress)
      .catch((e) => {
        Toast.show({
          message: t('toast.backendProblem'),
          emoji: 'hushed',
          autoClose: false,
        });
        reportErrorLog('Failed to estimate top up account virtual balance', { error: e });
        return {};
      });
    if (isEmpty(response)) return;

    const estimate = buildArchanovaTransactionEstimate(response);

    dispatch({
      type: SET_ESTIMATED_TOPUP_FEE,
      payload: estimate,
    });
  };
};

export const topUpVirtualAccountAction = (amount: string, payForGasWithToken: boolean = false) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (!archanovaService || !archanovaService.sdkInitialized) return;

    const {
      accounts: { data: accounts },
    } = getState();
    const archanovaAccount = findFirstArchanovaAccount(accounts);
    if (!archanovaAccount) return;

    const accountId = getAccountId(archanovaAccount);
    const accountAddress = getAccountAddress(archanovaAccount);
    const accountAssets = accountAssetsSelector(getState());

    const { decimals = 18 } = accountAssets[PPN_TOKEN] || {};
    const value = utils.parseUnits(amount.toString(), decimals);
    const tokenAddress = getPPNTokenAddress(PPN_TOKEN, accountAssets);

    const estimated = await archanovaService
      .estimateTopUpAccountVirtualBalance(value, tokenAddress)
      .catch((e) => {
        Toast.show({
          message: t('toast.backendProblem'),
          emoji: 'hushed',
          autoClose: false,
        });
        reportErrorLog('Failed to estimate top up account virtual balance', { error: e });
        return {};
      });

    if (isEmpty(estimated)) return;

    const txHash = await archanovaService.topUpAccountVirtualBalance(estimated, payForGasWithToken)
      .catch((e) => {
        Toast.show({
          message: t('toast.backendProblem'),
          emoji: 'hushed',
          autoClose: false,
        });
        reportErrorLog('Failed to top up account virtual balance', { error: e });
        return null;
      });

    if (txHash) {
      const transaction = buildHistoryTransaction({
        from: accountAddress,
        hash: txHash,
        to: accountAddress,
        value: value.toString(),
        asset: PPN_TOKEN,
        tag: PAYMENT_NETWORK_ACCOUNT_TOPUP,
      });

      dispatch({
        type: ADD_HISTORY_TRANSACTION,
        payload: {
          accountId,
          transaction,
          chain: CHAIN.ETHEREUM,
        },
      });

      dispatch({
        type: PAYMENT_NETWORK_SUBSCRIBE_TO_TX_STATUS,
        payload: txHash,
      });

      const { history: { data: currentHistory } } = getState();
      dispatch(saveDbAction('history', { history: currentHistory }, true));
      const paymentInfo = `${formatMoney(amount.toString(), 4)} ${PPN_TOKEN}`;

      Toast.show({
        message: t('toast.PPNTopUp', { paymentInfo }),
        emoji: 'ok_hand',
        autoClose: true,
      });
    }
  };
};

export const estimateWithdrawFromVirtualAccountAction = (amount: string) => {
  return async (dispatch: Function, getState: Function) => {
    if (!archanovaService || !archanovaService.sdkInitialized) return;

    dispatch({ type: RESET_ESTIMATED_WITHDRAWAL_FEE });

    const accountAssets = accountAssetsSelector(getState());
    const { decimals = 18 } = accountAssets[PPN_TOKEN] || {};
    const value = utils.parseUnits(amount, decimals);
    const tokenAddress = getPPNTokenAddress(PPN_TOKEN, accountAssets);

    const response = await archanovaService
      .estimateWithdrawFromVirtualAccount(value, tokenAddress)
      .catch((e) => {
        Toast.show({
          message: t('toast.backendProblem'),
          emoji: 'hushed',
          autoClose: false,
        });
        reportErrorLog('Failed to estimate withdraw from virtual account', { error: e });
        return {};
      });
    if (isEmpty(response)) return;

    const estimate = buildArchanovaTransactionEstimate(response);

    dispatch({
      type: SET_ESTIMATED_WITHDRAWAL_FEE,
      payload: estimate,
    });
  };
};

export const withdrawFromVirtualAccountAction = (amount: string, payForGasWithToken: boolean = false) => {
  return async (dispatch: Function, getState: Function) => {
    if (!archanovaService || !archanovaService.sdkInitialized) return;

    const {
      accounts: { data: accounts },
    } = getState();
    const archanovaAccount = findFirstArchanovaAccount(accounts);
    if (!archanovaAccount) return;

    const accountId = getAccountId(archanovaAccount);
    const accountAddress = getAccountAddress(archanovaAccount);
    const accountAssets = accountAssetsSelector(getState());

    const { decimals = 18 } = accountAssets[PPN_TOKEN] || {};
    const value = utils.parseUnits(amount.toString(), decimals);
    const tokenAddress = getPPNTokenAddress(PPN_TOKEN, accountAssets);

    const estimated = await archanovaService
      .estimateWithdrawFromVirtualAccount(value, tokenAddress)
      .catch((e) => {
        Toast.show({
          message: t('toast.backendProblem'),
          emoji: 'hushed',
          autoClose: false,
        });
        reportErrorLog('Failed to estimate withdraw from virtual account', { error: e });
        return {};
      });

    if (isEmpty(estimated)) return;

    const txHash = await archanovaService.withdrawFromVirtualAccount(estimated, payForGasWithToken)
      .catch((e) => {
        Toast.show({
          message: t('toast.backendProblem'),
          emoji: 'hushed',
          autoClose: false,
        });
        reportErrorLog('Failed to withdraw from virtual account', { error: e });
        return null;
      });

    if (txHash) {
      const transaction = buildHistoryTransaction({
        from: accountAddress,
        hash: txHash,
        to: accountAddress,
        value: value.toString(),
        asset: PPN_TOKEN,
        tag: PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
      });

      dispatch({
        type: ADD_HISTORY_TRANSACTION,
        payload: {
          accountId,
          transaction,
          chain: CHAIN.ETHEREUM,
        },
      });

      dispatch({
        type: PAYMENT_NETWORK_SUBSCRIBE_TO_TX_STATUS,
        payload: txHash,
      });

      const { history: { data: currentHistory } } = getState();
      dispatch(saveDbAction('history', { history: currentHistory }, true));

      const paymentInfo = `${formatMoney(amount.toString(), 4)} ${PPN_TOKEN}`;

      Toast.show({
        message: t('toast.PPNWithdraw', { paymentInfo }),
        emoji: 'hourglass',
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
    if (!archanovaService || !archanovaService.sdkInitialized) {
      notifySmartWalletNotInitialized();
      // $FlowFixMe: flow update to 0.122
      dispatch({
        type: SET_AVAILABLE_TO_SETTLE_TX,
        payload: [],
      });
      return;
    }

    const activeAccountAddress = activeAccountAddressSelector(getState());
    const accountEthereumHistory = archanovaAccountEthereumHistorySelector(getState());
    const accountAssets = accountAssetsSelector(getState());

    dispatch({ type: START_FETCHING_AVAILABLE_TO_SETTLE_TX });
    const payments = await archanovaService.getAccountPaymentsToSettle(activeAccountAddress);

    const txToSettle = payments
      .filter(({ hash }) => !isHiddenUnsettledTransaction(hash, accountEthereumHistory))
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
    if (!archanovaService || !archanovaService.sdkInitialized) {
      notifySmartWalletNotInitialized();
      return;
    }

    dispatch({ type: RESET_ESTIMATED_SETTLE_TX_FEE });

    const hashes = txToSettle.map(({ hash }) => hash);
    const response = await archanovaService
      .estimatePaymentSettlement(hashes)
      .catch((e) => {
        Toast.show({
          message: t('toast.backendProblem'),
          emoji: 'hushed',
          supportLink: true,
          autoClose: false,
        });
        reportErrorLog('Failed to estimate payment settlement', { error: e, hashes });
        return {};
      });
    if (isEmpty(response)) return;

    const estimate = buildArchanovaTransactionEstimate(response);

    dispatch({
      type: SET_ESTIMATED_SETTLE_TX_FEE,
      payload: estimate,
    });
  };
};

export const settleTransactionsAction = (txToSettle: TxToSettle[], payForGasWithToken: boolean = false) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (!archanovaService || !archanovaService.sdkInitialized) {
      notifySmartWalletNotInitialized();
      return;
    }

    const hashes = txToSettle.map(({ hash }) => hash);
    const estimated = await archanovaService
      .estimatePaymentSettlement(hashes)
      .catch((e) => {
        Toast.show({
          message: t('toast.backendProblem'),
          emoji: 'hushed',
          supportLink: true,
          autoClose: false,
        });
        reportErrorLog('Failed to estimate payment settlement', { error: e, hashes });
        return {};
      });

    if (isEmpty(estimated)) return;

    const txHash = await archanovaService.withdrawAccountPayment(estimated, payForGasWithToken)
      .catch((e) => {
        Toast.show({
          message: t('toast.backendProblem'),
          emoji: 'hushed',
          supportLink: true,
          autoClose: false,
        });
        reportErrorLog('Failed to settle transactions', { error: e, hashes });
        return null;
      });

    if (txHash) {
      const {
        accounts: { data: accounts },
        assets: { supportedAssets },
      } = getState();
      const archanovaAccount = findFirstArchanovaAccount(accounts);
      if (!archanovaAccount) return;

      const accountAssets = accountAssetsSelector(getState());
      const accountAssetsData = getAssetsAsList(accountAssets);
      const accountId = getAccountId(archanovaAccount);
      const accountAddress = getAccountAddress(archanovaAccount);

      const settlementData = txToSettle.map(({ symbol, value, hash }) => {
        const { decimals = 18 } = getAssetData(accountAssetsData, supportedAssets, symbol);
        const parsedValue = parseTokenAmount(value, decimals);
        return { symbol, value: parsedValue, hash };
      });

      const transaction = buildHistoryTransaction({
        from: accountAddress,
        hash: txHash,
        to: accountAddress,
        value: '0',
        asset: PAYMENT_NETWORK_TX_SETTLEMENT,
        tag: PAYMENT_NETWORK_TX_SETTLEMENT,
        extra: settlementData,
      });

      dispatch({
        type: ADD_HISTORY_TRANSACTION,
        payload: {
          accountId,
          transaction,
          chain: CHAIN.ETHEREUM,
        },
      });

      dispatch({
        type: PAYMENT_NETWORK_SUBSCRIBE_TO_TX_STATUS,
        payload: txHash,
      });

      // history state is updated with ADD_HISTORY_TRANSACTION, update in storage
      const { history: { data: currentHistory } } = getState();
      dispatch(saveDbAction('history', { history: currentHistory }, true));

      Toast.show({
        message: t('toast.PPNSettle'),
        emoji: 'hourglass',
        autoClose: true,
      });
    }
  };
};

export const importArchanovaAccountsIfNeededAction = (privateKey: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    await dispatch(initArchanovaSdkAction(privateKey));

    if (!archanovaService || !archanovaService.sdkInitialized) return;

    // nothing to do offline
    const { session: { data: session } } = getState();
    if (!session.isOnline) return;

    // check if archanova accounts were ever created, otherwise there is no need to create new
    const archanovaAccounts = await archanovaService.getAccounts();
    if (isEmpty(archanovaAccounts)) return;

    // check balances of existing archanova accounts
    const supportedAssets = supportedAssetsSelector(getState());
    const archanovaAccountsBalances = await Promise.all(archanovaAccounts.map(({
      address,
    }) => etherspotService.getBalances(CHAIN.ETHEREUM, address, supportedAssets)));

    // no need to import empty balance accounts
    const archanovaAccountsHasBalances = archanovaAccountsBalances.some((accountBalances) => !isEmpty(accountBalances));
    if (!archanovaAccountsHasBalances) return;

    dispatch({ type: SET_ARCHANOVA_WALLET_ACCOUNTS, payload: archanovaAccounts });
    await dispatch(saveDbAction('smartWallet', { accounts: archanovaAccounts }));

    archanovaAccounts.forEach((account) => dispatch(addAccountAction(
      account.address,
      ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET,
      account,
    )));

    const accountId = normalizeWalletAddress(archanovaAccounts[0].address);
    await dispatch(connectArchanovaAccountAction(accountId));

    // set default assets for smart wallet
    const defaultInitialAssets = transformAssetsToObject(initialAssets);
    await dispatch({
      type: SET_INITIAL_ASSETS,
      payload: {
        accountId,
        assets: defaultInitialAssets,
      },
    });
    const assets = { [accountId]: defaultInitialAssets };
    dispatch(saveDbAction('assets', { assets }, true));

    dispatch(fetchAssetsBalancesAction());
    dispatch(fetchCollectiblesAction());
  };
};

export const addSmartWalletAccountDeviceAction = (deviceAddress: string, payWithGasToken: boolean) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    await dispatch(fetchConnectedArchanovaAccountAction());

    // checking new device
    const accountDevices = get(getState(), 'smartWallet.connectedAccount.devices');
    const existingDevice = accountDevices.find(({ device }) => addressesEqual(device.address, deviceAddress));
    let accountDevice: ArchanovaWalletAccountDevice;

    if (existingDevice) {
      // check if device is already deployed or being deployed
      if (isArchanovaDeviceDeployed(existingDevice)) return;
      accountDevice = existingDevice;
    }

    if (!accountDevice) {
      accountDevice = await archanovaService.addAccountDevice(deviceAddress);
      if (!accountDevice) {
        Toast.show({
          message: t('toast.failedToAddDevice'),
          emoji: 'hushed',
          supportLink: true,
          autoClose: false,
        });
        return;
      }
      dispatch({ type: ADD_ARCHANOVA_WALLET_CONNECTED_ACCOUNT_DEVICE, payload: accountDevice });
    }

    const accountDeviceDeploymentHash = await archanovaService.deployAccountDevice(deviceAddress, payWithGasToken);
    if (!accountDeviceDeploymentHash) {
      // no transaction hash, unknown error occurred
      Toast.show({
        message: t('toast.failedToAddDevice'),
        emoji: 'hushed',
        supportLink: true,
        autoClose: false,
      });
      return;
    }

    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = findFirstArchanovaAccount(accounts);
    if (!smartWalletAccount) return;
    const accountId = getAccountId(smartWalletAccount);
    const accountAddress = getAccountAddress(smartWalletAccount);
    const historyTx = buildHistoryTransaction({
      from: accountAddress,
      hash: accountDeviceDeploymentHash,
      to: accountAddress,
      value: '0',
      asset: ETH,
      tag: ARCHANOVA_WALLET_ACCOUNT_DEVICE_ADDED,
    });
    dispatch(insertTransactionAction(historyTx, accountId, CHAIN.ETHEREUM));

    dispatch(fetchConnectedArchanovaAccountAction());
  };
};

export const removeDeployedSmartWalletAccountDeviceAction = (deviceAddress: string, payWithGasToken: boolean) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const accountDeviceUnDeploymentHash = await archanovaService.unDeployAccountDevice(
      deviceAddress,
      payWithGasToken,
    );
    if (!accountDeviceUnDeploymentHash) {
      // no transaction hash, unknown error occurred
      Toast.show({
        message: t('toast.failedToRemoveDevice'),
        emoji: 'hushed',
        supportLink: true,
        autoClose: false,
      });
      return;
    }

    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = findFirstArchanovaAccount(accounts);
    if (!smartWalletAccount) return;
    const accountId = getAccountId(smartWalletAccount);
    const accountAddress = getAccountAddress(smartWalletAccount);
    const historyTx = buildHistoryTransaction({
      from: accountAddress,
      hash: accountDeviceUnDeploymentHash,
      to: accountAddress,
      value: '0',
      asset: ETH,
      tag: ARCHANOVA_WALLET_ACCOUNT_DEVICE_REMOVED,
    });
    dispatch(insertTransactionAction(historyTx, accountId, CHAIN.ETHEREUM));

    await dispatch(fetchConnectedArchanovaAccountAction());
  };
};

export const initArchanovaSdkWithPrivateKeyOrPinAction = ({ privateKey: _privateKey, pin }: InitArchanovaProps) => {
  return async (dispatch: Dispatch) => {
    let privateKey = _privateKey;
    if (!_privateKey && pin) {
      privateKey = await getPrivateKeyFromPin(pin, dispatch);
    }
    if (!privateKey) return;
    await dispatch(initArchanovaSdkAction(privateKey));
  };
};

export const switchToGasTokenRelayerAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (!archanovaService || !archanovaService.sdkInitialized) return;

    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = findFirstArchanovaAccount(accounts);
    if (!smartWalletAccount) return;
    const accountId = getAccountId(smartWalletAccount);
    const accountAddress = getAccountAddress(smartWalletAccount);

    const hash = await archanovaService.switchToGasTokenRelayer();
    if (!hash) {
      Toast.show({
        message: t('toast.switchRelayerTokenFailed'),
        emoji: 'hushed',
        supportLink: true,
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
      tag: ARCHANOVA_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER,
    });
    dispatch(insertTransactionAction(historyTx, accountId, CHAIN.ETHEREUM));
    dispatch(fetchConnectedArchanovaAccountAction());
  };
};

export const estimateSmartWalletDeploymentAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_GETTING_ARCHANOVA_WALLET_DEPLOYMENT_ESTIMATE, payload: true });

    const rawEstimate = await archanovaService
      .estimateAccountDeployment()
      .catch((error) => {
        reportErrorLog('estimateAccountDeployment failed', { error });
        return null;
      });

    const estimated = {
      raw: rawEstimate,
      formatted: formatEstimated(parseEstimatePayload(rawEstimate)),
    };

    dispatch({ type: SET_ARCHANOVA_WALLET_DEPLOYMENT_ESTIMATE, payload: estimated });
  };
};


/**
 * should recover from 2 reported scenarios:
 * 1) account/device disconnected
 * 2) session expired
 *
 * and 1 edge case:
 * 3) sdk initialization lost(?)
 */
export const checkArchanovaSessionIfNeededAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    // skip check if no archanova account
    const archanovaAccountExists = !!findFirstArchanovaAccount(accountsSelector(getState()));
    if (!archanovaAccountExists) return;

    const { isCheckingSmartWalletSession } = getState().smartWallet;

    if (isCheckingSmartWalletSession) return;

    dispatch({ type: SET_CHECKING_ARCHANOVA_SESSION, payload: true });

    let smartWalletNeedsInit;

    if (archanovaService?.sdkInitialized) {
      const validSession = await archanovaService.isValidSession();

      if (validSession) {
        const accountId = activeAccountIdSelector(getState());

        // connected account method checks sdk state first and connects if account not found
        const connectedAccount = await archanovaService.connectAccount(accountId);

        // reinit in case no connected account or no devices
        smartWalletNeedsInit = isEmpty(connectedAccount) || isEmpty(connectedAccount?.devices);
      } else {
        // log to collect feedback for initial fix release, remove if causes too much noise
        reportLog('Detected Archanova Smart Wallet expired session');
        smartWalletNeedsInit = true;
      }
    } else {
      // log to collect feedback for initial fix release, remove if causes too much noise
      reportLog('Archanova Smart Wallet SDK initialization lost or never initialized');
      smartWalletNeedsInit = true;
    }

    dispatch({ type: SET_CHECKING_ARCHANOVA_SESSION, payload: false });

    if (!smartWalletNeedsInit) return;

    dispatch(lockScreenAction(
      (privateKey: string) => dispatch(initOnLoginArchanovaAccountAction(privateKey)),
      t('paragraph.sessionExpiredReEnterPin'),
    ));
  };
};

export const estimateEnsMigrationFromArchanovaToEtherspotAction = (rawTransactions: ?string[]) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const accounts = accountsSelector(getState());
    const activeAccount = getActiveAccount(accounts);
    const archanovaAccount = findFirstArchanovaAccount(accounts);

    if (!rawTransactions || !activeAccount || !archanovaAccount) {
      Toast.show({
        message: t('toast.ensMigrationCannotProceed'),
        emoji: 'hushed',
        supportLink: true,
        autoClose: false,
      });
      return;
    }

    if (!isArchanovaAccount(activeAccount)) {
      await dispatch(switchAccountAction(getAccountId(archanovaAccount)));
    }

    dispatch(setEstimatingTransactionAction(true));

    let errorMessage;
    let estimated;
    try {
      estimated = await archanovaService.estimateAccountRawTransactions(rawTransactions);
    } catch (error) {
      errorMessage = error?.message;
    }

    const feeInfo = buildArchanovaTxFeeInfo(estimated, false);
    if (!feeInfo || errorMessage) {
      reportErrorLog('estimateEnsMigrationFromArchanovaToEtherspotAction -> estimateAccountRawTransactions failed', {
        errorMessage,
        archanovaAccount,
      });
      dispatch(setTransactionsEstimateErrorAction(errorMessage || t('toast.transactionFeeEstimationFailed')));
      return;
    }

    dispatch(setTransactionsEstimateFeeAction(feeInfo));
  };
};

export const migrateEnsFromArchanovaToEtherspotAction = (
  rawTransactions: ?string[],
  statusCallback: (status: TransactionStatus) => void,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const accounts = accountsSelector(getState());

    const activeAccount = getActiveAccount(accounts);
    const archanovaAccount = findFirstArchanovaAccount(accounts);
    const etherspotAccount = findFirstEtherspotAccount(accounts);
    const { transactionEstimate: { feeInfo } } = getState();

    if (!rawTransactions
      || !activeAccount
      || !archanovaAccount
      || !etherspotAccount
      || !feeInfo) {
      Toast.show({
        message: t('toast.ensMigrationCannotProceed'),
        emoji: 'hushed',
        supportLink: true,
        autoClose: false,
      });
      return;
    }

    if (!isArchanovaAccount(activeAccount)) {
      await dispatch(switchAccountAction(getAccountId(archanovaAccount)));
    }

    let hash;
    try {
      hash = await archanovaService.sendRawTransactions(rawTransactions);
    } catch (error) {
      reportErrorLog('migrateEnsFromArchanovaToEtherspotAction failed', {
        error,
        archanovaAccount,
        activeAccount,
        rawTransactions,
      });
    }

    if (!hash) {
      statusCallback({
        isSuccess: false,
        noRetry: true,
        error: t('toast.ensMigrationFailed'),
      });
      return;
    }

    // active is archanova at this point
    const etherspotAccountAddress = getAccountAddress(etherspotAccount);
    const archanovaAccountAddress = getAccountAddress(activeAccount);

    const { migratorAddress } = new Migrator({
      chainId: getEnv().NETWORK_PROVIDER === 'kovan' ? 42 : 1,
      archanovaAccount: archanovaAccountAddress,
      etherspotAccount: etherspotAccountAddress,
    });

    const transaction = buildHistoryTransaction({
      from: archanovaAccountAddress,
      to: migratorAddress,
      hash,
      asset: ETH,
      value: 0,
      extra: { isEnsMigrationToEtherspot: true },
    });

    dispatch({
      type: ADD_HISTORY_TRANSACTION,
      payload: {
        accountId: getAccountId(activeAccount),
        transaction,
        chain: CHAIN.ETHEREUM,
      },
    });

    statusCallback({ isSuccess: true, hash, error: null });
  };
};
