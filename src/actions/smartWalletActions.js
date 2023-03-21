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
import { utils, type Wallet as EthersWallet } from 'ethers';
import { BigNumber } from 'bignumber.js';
import { getEnv } from 'configs/envConfig';
import t from 'translations/translate';
import { Migrator } from '@etherspot/archanova-migrator';

// components
import Toast from 'components/Toast';

// constants
import {
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
  ARCHANOVA_WALLET_DEPLOYMENT_ERRORS,
  ARCHANOVA_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER,
  ARCHANOVA_WALLET_UPGRADE_STATUSES,
  START_ARCHANOVA_WALLET_DEPLOYMENT,
  ARCHANOVA_WALLET_ENS_MIGRATION,
} from 'constants/archanovaConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { ETH } from 'constants/assetsConstants';
import { ADD_HISTORY_TRANSACTION, SET_HISTORY, TX_CONFIRMED_STATUS } from 'constants/historyConstants';
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
import { CHAIN } from 'constants/chainConstants';

// configs
import { getPlrAddressForChain, PPN_TOKEN } from 'configs/assetsConfig';

// services
import archanovaService, { formatEstimated, parseEstimatePayload } from 'services/archanova';
import { navigate } from 'services/navigation';
import etherspotService from 'services/etherspot';

// selectors
import { archanovaAccountEthereumAssetsSelector, ethereumSupportedAssetsSelector } from 'selectors/assets';
import { accountsSelector, activeAccountAddressSelector, activeAccountIdSelector } from 'selectors';
import { archanovaAccountEthereumHistorySelector } from 'selectors/history';
import { accountEthereumWalletAssetsBalancesSelector } from 'selectors/balances';

// types
import type {
  InitArchanovaProps,
  ArchanovaWalletAccount,
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
  buildArchanovaTxFeeInfo,
} from 'utils/archanova';
import { addressesEqual, findAssetByAddress, getAssetsAsList, getBalance } from 'utils/assets';
import {
  formatMoney,
  formatUnits,
  isCaseInsensitiveMatch,
  parseTokenAmount,
  printLog,
  reportErrorLog,
  logBreadcrumb,
} from 'utils/common';
import { formatToRawPrivateKey, getPrivateKeyFromPin, normalizeWalletAddress } from 'utils/wallet';
import { nativeAssetPerChain } from 'utils/chains';
import { fromEthersBigNumber } from 'utils/bigNumber';
import { getDeviceUniqueId } from 'utils/device';

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
import { fetchTransactionsHistoryAction, insertTransactionAction } from './historyActions';
import { extractEnsInfoFromTransactionsAction } from './ensRegistryActions';
import { checkKeyBasedAssetTransferTransactionsAction } from './keyBasedAssetTransferActions';
import { lockScreenAction } from './authActions';
import {
  setEstimatingTransactionAction,
  setTransactionsEstimateErrorAction,
  setTransactionsEstimateFeeAction,
} from './transactionEstimateActions';
import { setDeviceUniqueIdIfNeededAction } from './appSettingsActions';

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

    const {
      session: {
        data: { isOnline },
      },
      onboarding: { isNewUser },
    } = getState();

    if (!isOnline || isNewUser) return;

    let archanovaAccounts = await archanovaService.getAccounts();
    if (!archanovaAccounts?.length && privateKey) {
      const newArchanovaAccount = await archanovaService.createAccount();
      archanovaAccounts = [newArchanovaAccount];
    }

    if (!archanovaAccounts?.length) {
      logBreadcrumb('loadSmartWalletAccountsAction', 'failed: no archanovaAccounts');
      return;
    }

    dispatch({
      type: SET_ARCHANOVA_WALLET_ACCOUNTS,
      payload: archanovaAccounts,
    });

    await dispatch(saveDbAction('smartWallet', { accounts: archanovaAccounts }));

    archanovaAccounts.forEach((account) =>
      dispatch(addAccountAction(account.address, ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET, account)),
    );
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
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      onboarding: { isNewUser },
    } = getState();

    if (isNewUser) return;

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

    const {
      smartWallet: { connectedAccount },
      onboarding: { isNewUser },
    } = getState();

    if (isNewUser) return;

    let accountWithDevices = connectedAccount;

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
    if (
      currentUpgradeStatus !== ARCHANOVA_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE &&
      connectedAccountState === sdkConstants.AccountStates.Deployed
    ) {
      dispatch(setSmartWalletUpgradeStatusAction(ARCHANOVA_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE));
    }
  };
};

export const deploySmartWalletAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      smartWallet: {
        connectedAccount: { address: accountAddress, state: accountState },
        upgrade: { status: upgradeStatus, deploymentStarted, deploymentEstimate },
      },
      onboarding: { isNewUser },
    } = getState();

    if (!isNewUser && (upgradeStatus !== ARCHANOVA_WALLET_UPGRADE_STATUSES.DEPLOYING || !deploymentStarted)) {
      dispatch({ type: START_ARCHANOVA_WALLET_DEPLOYMENT });
    }

    await dispatch(resetSmartWalletDeploymentDataAction());
    await dispatch(setActiveAccountAction(accountAddress));

    if (accountState === sdkConstants.AccountStates.Deployed) {
      dispatch(setSmartWalletUpgradeStatusAction(ARCHANOVA_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE));
      printLog('deploySmartWalletAction account is already deployed!');
      return;
    }

    if (isNewUser) return;

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
      session: {
        data: { isOnline },
      },
      smartWallet: { connectedAccount },
      onboarding: { isNewUser },
    } = getState();

    if (!isConnectedToArchanovaSmartAccount(connectedAccount) || !isOnline || isNewUser) return;

    const plrAddress = getPlrAddressForChain(CHAIN.ETHEREUM);

    const supportedAssets = ethereumSupportedAssetsSelector(getState());

    const ppnAsset = findAssetByAddress(supportedAssets, plrAddress);
    if (!ppnAsset) {
      logBreadcrumb('fetchVirtualAccountBalanceAction', 'failed: no PPN asset found', {
        PPN_TOKEN,
        plrAddress,
      });
      return;
    }

    const accountId = getActiveAccountId(accounts);

    const { decimals, address } = ppnAsset;

    const [staked, pendingBalances] = await Promise.all([
      archanovaService.getAccountStakedAmount(address),
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
      const assetAddress = tokenBalance?.token?.address ?? nativeAssetPerChain.ethereum.address;
      const { decimals: assetDecimals = nativeAssetPerChain.ethereum.decimals } =
        findAssetByAddress(supportedAssets, assetAddress) ?? {};
      const balance = tokenBalance?.incoming ?? new BigNumber(0);

      return {
        ...memo,
        [assetAddress]: {
          balance: formatUnits(balance, assetDecimals),
          address: assetAddress,
        },
      };
    }, {});
    const {
      paymentNetwork: { balances },
    } = getState();
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
    const {
      paymentNetwork: { availableStake },
    } = getState();

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
      onboarding: { isNewUser },
    } = getState();

    if (isNewUser) return;

    const smartWalletAccount = findFirstArchanovaAccount(accounts);
    if (!smartWalletAccount) return;
    const accountId = getAccountId(smartWalletAccount);
    const payments = await archanovaService.getAccountPayments(lastSyncedPaymentId);
    const supportedAssets = ethereumSupportedAssetsSelector(getState());

    // filter out already stored payments
    const {
      history: { data: currentHistory },
    } = getState();

    // Archanova is Ethereum only
    const existingTransactions = currentHistory[accountId]?.[CHAIN.ETHEREUM] || [];

    // new or updated payment is one that doesn't exist in history contain or its payment state was updated
    const newOrUpdatedPayments = payments.filter(({ hash: paymentHash, state: prevStateInPPN }) =>
      existingTransactions.some(
        ({ hash, stateInPPN }) => isCaseInsensitiveMatch(hash, paymentHash) && stateInPPN === prevStateInPPN,
      ),
    );

    const transformedNewPayments = newOrUpdatedPayments.map((payment) => {
      const {
        symbol: assetSymbol = nativeAssetPerChain.ethereum.symbol,
        address: assetAddress = nativeAssetPerChain.ethereum.address,
      } = payment?.token ?? {};

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
          // if syntheticAssetAddress is null then it's ETH
          const finalSyntheticAssetAddress = syntheticAssetAddress || nativeAssetPerChain.ethereum.address;
          const syntheticAsset = findAssetByAddress(supportedAssets, finalSyntheticAssetAddress);

          // don't format synthetic value if asset not found at all because synthetic value will end up as 0
          if (syntheticAsset) {
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
            logBreadcrumb(
              'syncVirtualAccountTransactionsAction',
              'Unable to get wallet supported asset from synthetic asset address',
              {
                syntheticAssetAddress,
              },
            );
          }

          recipientAddress = syntheticRecipient;
        } else {
          // current account is synthetic receiver
          senderAddress = syntheticSender;
        }
      }

      // if transaction exists this will update only its status and stateInPPN
      const existingTransaction =
        existingTransactions.find(({ hash }) => isCaseInsensitiveMatch(hash, paymentHash)) || {};

      return buildHistoryTransaction({
        from: senderAddress,
        hash: payment.hash,
        to: recipientAddress,
        value: value.toString(),
        assetSymbol,
        assetAddress,
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
      logBreadcrumb('onSmartWalletSdkEventAction', 'Missing Smart Wallet SDK constant', { path });
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
      if (newAccountDeviceState === deployedDeviceState && newAccountDeviceNextState !== createdDeviceState) {
        // check if current wallet smart wallet account device is deployed
        if (
          currentAccountState !== deployedDeviceState &&
          accountUpgradeStatus !== ARCHANOVA_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE
        ) {
          dispatch(setSmartWalletUpgradeStatusAction(ARCHANOVA_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE));
          navigate(WALLET_ACTIVATED);
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
      } = getState();
      let {
        history: { data: currentHistory },
      } = getState();
      const archanovaAccount = findFirstArchanovaAccount(accounts);
      if (!archanovaAccount) return;

      const supportedAssets = ethereumSupportedAssetsSelector(getState());

      const archanovaAccountAddress = getAccountAddress(archanovaAccount);
      const txHash = get(event, 'payload.hash', '').toLowerCase();
      const txStatus = get(event, 'payload.state', '');
      const txGasInfo = get(event, 'payload.gas', {});
      const txSenderAddress = get(event, 'payload.from.account.address', '');
      const txReceiverAddress = get(event, 'payload.to.address', '');
      const txSenderEnsName = get(event, 'payload.from.account.ensName', '');
      const txType = get(event, 'payload.transactionType', '');
      const txToListenFound = txToListen.find((hash) => isCaseInsensitiveMatch(hash, txHash));
      const skipNotifications = [transactionTypes.TopUpErc20Approve];

      const allAccountHistory = getCrossChainAccountHistory(currentHistory[archanovaAccountAddress]);
      const txFromHistory = allAccountHistory.find((tx) => tx.hash === txHash);

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

        const { tokenValue, tokenAddress } = event?.payload ?? {};
        const assetData = findAssetByAddress(supportedAssets, tokenAddress);

        if (assetData && !skipNotifications.includes(txType)) {
          let notificationMessage;
          const toastEmoji = 'ok_hand'; // eslint-disable-line i18next/no-literal-string

          if ([transactionTypes.TopUp, transactionTypes.Withdrawal].includes(txType)) {
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
            const amount = formatUnits(tokenValue, assetData.decimals);
            const paymentInfo = `${amount} ${assetData.symbol}`;

            if (isReceived) {
              notificationMessage = t('toast.transactionReceived', { paymentInfo });
            } else {
              notificationMessage = t('toast.transactionSent', { paymentInfo });
            }
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
            const { txUpdated, updatedHistory } = updateHistoryRecord(currentHistory, txHash, (transaction) => ({
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
            dispatch(fetchTransactionsHistoryAction());
          }
          dispatch(fetchAssetsBalancesAction());
        }
      }

      if (txStatus === TRANSACTION_CREATED && txType === transactionTypes.UpdateAccountEnsName) {
        const { txUpdated, updatedHistory } = updateHistoryRecord(currentHistory, txHash, (transaction) => ({
          ...transaction,
          extra: { ensName: txSenderEnsName },
        }));

        if (txUpdated) {
          dispatch(saveDbAction('history', { history: updatedHistory }, true));
          dispatch({
            type: SET_HISTORY,
            payload: updatedHistory,
          });
        }
      }
    }

    if (event.name === ACCOUNT_VIRTUAL_BALANCE_UPDATED) {
      const tokenTransferred = get(event, 'payload.token.address', null);

      const plrAddress = getPlrAddressForChain(CHAIN.ETHEREUM);

      const supportedAssets = ethereumSupportedAssetsSelector(getState());

      const ppnAsset = findAssetByAddress(supportedAssets, plrAddress);
      if (ppnAsset && addressesEqual(tokenTransferred, ppnAsset.address)) {
        // update the balance
        const value = get(event, 'payload.value', '');
        const formattedValue = formatUnits(value, ppnAsset.decimals);
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

      const accountAssets = archanovaAccountEthereumAssetsSelector(getState());
      const { decimals = 18 } = accountAssets[PPN_TOKEN] || {};
      const txAmountFormatted = formatUnits(txAmount, decimals);

      // check if received transaction
      if (
        addressesEqual(archanovaAccountAddress, txReceiverAddress) &&
        !addressesEqual(txReceiverAddress, txSenderAddress) &&
        [ARCHANOVA_PPN_PAYMENT_COMPLETED, ARCHANOVA_PPN_PAYMENT_PROCESSED].includes(txStatus)
      ) {
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
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      onboarding: { isNewUser },
    } = getState();

    if (isNewUser) return;

    await archanovaService.init(walletPrivateKey, (event) => dispatch(onSmartWalletSdkEventAction(event)), forceInit);
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
      onboarding: { isNewUser },
    } = getState();

    const accountId = getActiveAccountId(accounts);

    if (isNewUser || !archanovaService || !archanovaService.sdkInitialized) {
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

    const {
      onboarding: { isNewUser },
    } = getState();

    if (isNewUser) return;

    dispatch({ type: RESET_ESTIMATED_TOPUP_FEE });

    const plrAddress = getPlrAddressForChain(CHAIN.ETHEREUM);

    const supportedAssets = ethereumSupportedAssetsSelector(getState());

    const ppnAsset = findAssetByAddress(supportedAssets, plrAddress);
    if (!ppnAsset) {
      logBreadcrumb('estimateTopUpVirtualAccountAction', 'failed: no PPN asset found', {
        PPN_TOKEN,
        plrAddress,
      });
      return;
    }

    const { decimals, address } = ppnAsset;

    const balances = accountEthereumWalletAssetsBalancesSelector(getState());

    const balance = getBalance(balances, address);
    if (balance < +amount) return;

    const value = utils.parseUnits(amount, decimals);

    const response = await archanovaService.estimateTopUpAccountVirtualBalance(value, address).catch((e) => {
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
      onboarding: { isNewUser },
    } = getState();

    if (isNewUser) return;

    const archanovaAccount = findFirstArchanovaAccount(accounts);
    if (!archanovaAccount) return;

    const plrAddress = getPlrAddressForChain(CHAIN.ETHEREUM);

    const supportedAssets = ethereumSupportedAssetsSelector(getState());

    const ppnAsset = findAssetByAddress(supportedAssets, plrAddress);
    if (!ppnAsset) {
      logBreadcrumb('topUpVirtualAccountAction', 'failed: no PPN asset found', {
        PPN_TOKEN,
        plrAddress,
      });
      return;
    }

    const accountId = getAccountId(archanovaAccount);
    const accountAddress = getAccountAddress(archanovaAccount);

    const { decimals, symbol: assetSymbol, address: assetAddress } = ppnAsset;

    const value = utils.parseUnits(amount.toString(), decimals);

    const estimated = await archanovaService.estimateTopUpAccountVirtualBalance(value, assetAddress).catch((e) => {
      Toast.show({
        message: t('toast.backendProblem'),
        emoji: 'hushed',
        autoClose: false,
      });
      reportErrorLog('Failed to estimate top up account virtual balance', { error: e });
      return {};
    });

    if (isEmpty(estimated)) return;

    const txHash = await archanovaService.topUpAccountVirtualBalance(estimated, payForGasWithToken).catch((e) => {
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
        assetSymbol,
        assetAddress,
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

      const {
        history: { data: currentHistory },
      } = getState();
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
  return async (dispatch: Function, getState: GetState) => {
    if (!archanovaService || !archanovaService.sdkInitialized) return;

    const {
      onboarding: { isNewUser },
    } = getState();

    if (isNewUser) return;

    dispatch({ type: RESET_ESTIMATED_WITHDRAWAL_FEE });

    const plrAddress = getPlrAddressForChain(CHAIN.ETHEREUM);

    const supportedAssets = ethereumSupportedAssetsSelector(getState());

    const ppnAsset = findAssetByAddress(supportedAssets, plrAddress);
    if (!ppnAsset) {
      logBreadcrumb('estimateWithdrawFromVirtualAccountAction', 'failed: no PPN asset found', {
        PPN_TOKEN,
        plrAddress,
      });
      return;
    }

    const { decimals, address } = ppnAsset;

    const value = utils.parseUnits(amount, decimals);

    const response = await archanovaService.estimateWithdrawFromVirtualAccount(value, address).catch((e) => {
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
      onboarding: { isNewUser },
    } = getState();

    if (isNewUser) return;

    const archanovaAccount = findFirstArchanovaAccount(accounts);
    if (!archanovaAccount) return;

    const plrAddress = getPlrAddressForChain(CHAIN.ETHEREUM);

    const supportedAssets = ethereumSupportedAssetsSelector(getState());

    const ppnAsset = findAssetByAddress(supportedAssets, plrAddress);
    if (!ppnAsset) {
      logBreadcrumb('withdrawFromVirtualAccountAction', 'failed: no PPN asset found', {
        PPN_TOKEN,
        plrAddress,
      });
      return;
    }

    const { decimals, address: assetAddress, symbol: assetSymbol } = ppnAsset;

    const value = utils.parseUnits(amount.toString(), decimals);

    const accountId = getAccountId(archanovaAccount);
    const accountAddress = getAccountAddress(archanovaAccount);

    const estimated = await archanovaService.estimateWithdrawFromVirtualAccount(value, assetAddress).catch((e) => {
      Toast.show({
        message: t('toast.backendProblem'),
        emoji: 'hushed',
        autoClose: false,
      });
      reportErrorLog('Failed to estimate withdraw from virtual account', { error: e });
      return {};
    });

    if (isEmpty(estimated)) return;

    const txHash = await archanovaService.withdrawFromVirtualAccount(estimated, payForGasWithToken).catch((e) => {
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
        assetSymbol,
        assetAddress,
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

      const {
        history: { data: currentHistory },
      } = getState();
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
    const accountAssets = archanovaAccountEthereumAssetsSelector(getState());
    const accountAssetsList = getAssetsAsList(accountAssets);

    dispatch({ type: START_FETCHING_AVAILABLE_TO_SETTLE_TX });
    const payments = await archanovaService.getAccountPaymentsToSettle(activeAccountAddress);

    const txToSettle = payments
      .filter(({ hash }) => !isHiddenUnsettledTransaction(hash, accountEthereumHistory))
      .map((item) => {
        const asset = accountAssetsList.find(({ address }) => addressesEqual(item?.token?.address, address));

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
          value: fromEthersBigNumber(item.value, asset?.decimals ?? 18),
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
    const response = await archanovaService.estimatePaymentSettlement(hashes).catch((e) => {
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
    const estimated = await archanovaService.estimatePaymentSettlement(hashes).catch((e) => {
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

    const txHash = await archanovaService.withdrawAccountPayment(estimated, payForGasWithToken).catch((e) => {
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
      const accounts = accountsSelector(getState());
      const archanovaAccount = findFirstArchanovaAccount(accounts);
      if (!archanovaAccount) return;

      const supportedAssets = ethereumSupportedAssetsSelector(getState());
      const accountId = getAccountId(archanovaAccount);
      const accountAddress = getAccountAddress(archanovaAccount);

      const settlementData = txToSettle.map(({ symbol, value, hash, address }) => {
        const asset = findAssetByAddress(supportedAssets, address);
        const { decimals = 18 } = asset ?? {};
        const parsedValue = parseTokenAmount(value, decimals);
        return { symbol, value: parsedValue, hash };
      });

      // Archanova is Ethereum only
      const { address: assetAddress, symbol: assetSymbol } = nativeAssetPerChain.ethereum;

      const transaction = buildHistoryTransaction({
        from: accountAddress,
        hash: txHash,
        to: accountAddress,
        value: '0',
        assetSymbol,
        assetAddress,
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
      const {
        history: { data: currentHistory },
      } = getState();
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
    const {
      session: { data: session },
      onboarding: { isNewUser },
    } = getState();

    if (!session.isOnline || isNewUser) return;

    // check if archanova accounts were ever created, otherwise there is no need to create new
    const archanovaAccounts = await archanovaService.getAccounts();
    if (isEmpty(archanovaAccounts)) return;

    // Archanova supports Ethereum only
    const ethereumSupportedAssets = ethereumSupportedAssetsSelector(getState());

    const archanovaAccountsBalances = await Promise.all(
      archanovaAccounts.map(({ address }) =>
        etherspotService.getBalances(CHAIN.ETHEREUM, address, ethereumSupportedAssets),
      ),
    );

    // no need to import empty balance accounts
    const archanovaAccountsHasBalances = archanovaAccountsBalances.some((accountBalances) => !isEmpty(accountBalances));
    if (!archanovaAccountsHasBalances) return;

    dispatch({ type: SET_ARCHANOVA_WALLET_ACCOUNTS, payload: archanovaAccounts });
    await dispatch(saveDbAction('smartWallet', { accounts: archanovaAccounts }));

    archanovaAccounts.forEach((account) =>
      dispatch(addAccountAction(account.address, ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET, account)),
    );

    const accountId = normalizeWalletAddress(archanovaAccounts[0].address);
    await dispatch(connectArchanovaAccountAction(accountId));

    dispatch(fetchAssetsBalancesAction());
    dispatch(fetchCollectiblesAction());
  };
};

export const initArchanovaSdkWithPrivateKeyOrPinAction = ({ privateKey: _privateKey, pin }: InitArchanovaProps) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    let privateKey = _privateKey;
    if (!_privateKey && pin) {
      const deviceUniqueId = getState().appSettings.data.deviceUniqueId ?? (await getDeviceUniqueId());
      dispatch(setDeviceUniqueIdIfNeededAction(deviceUniqueId));

      privateKey = await getPrivateKeyFromPin(pin, deviceUniqueId);
    }
    if (!privateKey) return;
    await dispatch(initArchanovaSdkAction(privateKey));
  };
};

export const switchToGasTokenRelayerAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (!archanovaService || !archanovaService.sdkInitialized) return;

    const {
      accounts: { data: accounts },
    } = getState();
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

    // Archanova is Ethereum only
    const { address: assetAddress, symbol: assetSymbol } = nativeAssetPerChain.ethereum;

    const historyTx = buildHistoryTransaction({
      from: accountAddress,
      hash,
      to: accountAddress,
      value: '0',
      assetSymbol,
      assetAddress,
      tag: ARCHANOVA_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER,
    });
    dispatch(insertTransactionAction(historyTx, accountId, CHAIN.ETHEREUM));
    dispatch(fetchConnectedArchanovaAccountAction());
  };
};

export const estimateSmartWalletDeploymentAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_GETTING_ARCHANOVA_WALLET_DEPLOYMENT_ESTIMATE, payload: true });

    const rawEstimate = await archanovaService.estimateAccountDeployment().catch((error) => {
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
        logBreadcrumb('checkArchanovaSessionIfNeededAction', 'Detected Archanova Smart Wallet expired session');
        smartWalletNeedsInit = true;
      }
    } else {
      // log to collect feedback for initial fix release, remove if causes too much noise
      logBreadcrumb(
        'checkArchanovaSessionIfNeededAction',
        'Archanova Smart Wallet SDK initialization lost or never initialized',
      );
      smartWalletNeedsInit = true;
    }

    dispatch({ type: SET_CHECKING_ARCHANOVA_SESSION, payload: false });

    if (!smartWalletNeedsInit) return;

    const onLoginSuccess = async (pin: ?string, wallet: EthersWallet) => {
      const rawPrivateKey = formatToRawPrivateKey(wallet.privateKey);
      await dispatch(initOnLoginArchanovaAccountAction(rawPrivateKey));
    };

    dispatch(lockScreenAction(onLoginSuccess, t('paragraph.sessionExpiredReEnterPin')));
  };
};

export const estimateEnsMigrationFromArchanovaToEtherspotAction = (rawTransactions: ?(string[])) => {
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
      logBreadcrumb('estimateEnsMigrationFromArchanovaToEtherspotAction', 'estimateAccountRawTransactions failed', {
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
  rawTransactions: ?(string[]),
  statusCallback: (status: TransactionStatus) => void,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const accounts = accountsSelector(getState());

    const activeAccount = getActiveAccount(accounts);
    const archanovaAccount = findFirstArchanovaAccount(accounts);
    const etherspotAccount = findFirstEtherspotAccount(accounts);
    const {
      transactionEstimate: { feeInfo },
    } = getState();

    if (!rawTransactions || !activeAccount || !archanovaAccount || !etherspotAccount || !feeInfo) {
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

    // Archanova is Ethereum only
    const { address: assetAddress, symbol: assetSymbol } = nativeAssetPerChain.ethereum;

    const transaction = buildHistoryTransaction({
      from: archanovaAccountAddress,
      to: migratorAddress,
      hash,
      assetSymbol,
      assetAddress,
      value: 0,
      tag: ARCHANOVA_WALLET_ENS_MIGRATION,
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
