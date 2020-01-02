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
import get from 'lodash.get';
import { PillarSdk } from '@pillarwallet/pillarwallet-nodejs-sdk';
import BCX from 'blockchain-explorer-sdk';
import { Sentry } from 'react-native-sentry';
import {
  SDK_PROVIDER,
  BCX_URL,
  NETWORK_PROVIDER,
  NOTIFICATIONS_URL,
  INVESTMENTS_URL,
  OPEN_SEA_API,
  OPEN_SEA_API_KEY,
  ETHPLORER_API_KEY,
  SENDWYRE_API_URL,
  MOONPAY_API_URL,
  MOONPAY_KEY,
} from 'react-native-dotenv';

// constants
import { USERNAME_EXISTS, REGISTRATION_FAILED } from 'constants/walletConstants';
import { MIN_MOONPAY_FIAT_VALUE } from 'constants/exchangeConstants';

// utils
import { transformAssetsToObject } from 'utils/assets';
import { isTransactionEvent } from 'utils/history';

// services
import {
  fetchAssetBalances,
  fetchLastBlockNumber,
  fetchTransactionInfo,
  fetchTransactionReceipt,
} from 'services/assets';
import EthplorerSdk from 'services/EthplorerSdk';

// models, types
import type { Asset } from 'models/Asset';
import type { Transaction } from 'models/Transaction';
import type { UserBadgesResponse, SelfAwardBadgeResponse, Badges } from 'models/Badge';
import type { RemoteNotification } from 'models/Notification';
import type {
  ConnectionIdentityKeyMap,
  ConnectionUpdateIdentityKeys,
  ConnectionPatchIdentityKeys,
} from 'models/Connections';
import type { OAuthTokens } from 'utils/oAuth';
import type { ClaimTokenAction } from 'actions/referralsActions';

import { getLimitedData } from 'utils/opensea';
import { uniqBy } from 'utils/common';

// other
import { icoFundingInstructions as icoFundingInstructionsFixtures } from 'fixtures/icos'; // temporary here


const USERNAME_EXISTS_ERROR_CODE = 409;

type HistoryPayload = {
  address1: string,
  address2?: string,
  asset?: string,
  nbTx?: number,
  fromIndex: number,
};

type BalancePayload = {
  address: string,
  assets: Asset[],
};

type UserInfoByIdPayload = {
  walletId: string,
  userAccessKey: string,
  targetUserAccessKey: string,
};

type RegisterSmartWalletPayload = {
  walletId: string,
  privateKey: string,
  ethAddress: string,
  fcmToken: string,
};

type MapContactsAddresses = Array<{
  contactId: string,
  accessKeys?: {
    userAccessKey: string,
    contactAccessKey: string,
  },
  connectionKeys?: {
    sourceIdentityKey: string,
    targetIdentityKey: string,
  },
}>;

const ethplorerSdk = new EthplorerSdk(ETHPLORER_API_KEY);

export default function SDKWrapper() {
  this.BCXSdk = null;
  this.pillarWalletSdk = null;
}

SDKWrapper.prototype.init = function (
  updateOAuth?: ?Function,
  oAuthTokensStored?: ?OAuthTokens,
  onOAuthTokensFailed?: ?Function,
) {
  this.BCXSdk = new BCX({ apiUrl: BCX_URL });
  this.pillarWalletSdk = new PillarSdk({
    apiUrl: SDK_PROVIDER, // ONLY if you have platform running locally
    notificationsUrl: NOTIFICATIONS_URL,
    investmentsUrl: INVESTMENTS_URL,
    updateOAuthFn: updateOAuth,
    oAuthTokens: oAuthTokensStored,
    tokensFailedCallbackFn: onOAuthTokensFailed,
  });
};

SDKWrapper.prototype.listAccounts = function (walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.infoSmartWallet({ walletId }))
    .then(({ data }) => data.wallets || [])
    .catch(() => []);
};

SDKWrapper.prototype.registerOnBackend = function (fcm: string, username: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.wallet.register({ fcmToken: fcm, username }))
    .then(({ data }) => data)
    .catch((e = {}) => {
      const status = get(e, 'response.status');
      if (status === USERNAME_EXISTS_ERROR_CODE) {
        return {
          error: true,
          reason: USERNAME_EXISTS,
        };
      }
      return {
        error: true,
        reason: REGISTRATION_FAILED,
      };
    });
};

SDKWrapper.prototype.registerSmartWallet = function (payload: RegisterSmartWalletPayload) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.wallet.registerSmartWallet(payload))
    .then(({ data }) => data)
    .catch(e => ({
      error: true,
      reason: e,
    }));
};

SDKWrapper.prototype.registerOnAuthServer = function (walletPrivateKey: string, fcm: string, username: string) {
  const privateKey = walletPrivateKey.indexOf('0x') === 0 ? walletPrivateKey.slice(2) : walletPrivateKey;
  return Promise.resolve()
    .then(() => {
      return this.pillarWalletSdk.wallet.registerAuthServer({
        privateKey,
        fcmToken: fcm,
        username,
      });
    })
    .then(({ data }) => data)
    .catch((error) => {
      Sentry.captureException({ type: 'Registration error', error });
      const responseStatus = get(error, 'response.status');
      const reason = responseStatus === USERNAME_EXISTS_ERROR_CODE
        ? USERNAME_EXISTS
        : REGISTRATION_FAILED;
      return { error: true, reason };
    });
};

SDKWrapper.prototype.updateFCMToken = function (walletId: string, fcmToken: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.wallet.update({ walletId, fcmToken }))
    .then(({ data }) => data)
    .catch(() => ({}));
};

SDKWrapper.prototype.fetchInitialAssets = function (walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.asset.defaults({ walletId }))
    .then(({ data }) => data)
    .catch(() => [])
    .then(transformAssetsToObject);
};

SDKWrapper.prototype.updateUser = function (user: Object) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.update(user))
    .then(({ data }) => ({ responseStatus: 200, ...data.user, walletId: user.walletId }))
    .catch(error => {
      const status = get(error, 'response.status');
      const message = get(error, 'response.data.message');

      Sentry.captureException({
        error: 'Failed to update user',
        walletId: user.walletId,
        user,
        status,
        message,
      });
      return { responseStatus: status, message };
    });
};

SDKWrapper.prototype.createOneTimePassword = function (user: Object) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.createOneTimePassword(user))
    .then(({ data }) => ({ responseStatus: 200, ...data.user, walletId: user.walletId }))
    .catch(error => {
      const status = get(error, 'response.status');
      const message = get(error, 'response.data.message');

      Sentry.captureException({
        error: 'Failed to send text',
        walletId: user.walletId,
        user,
        status,
        message,
      });
      return { responseStatus: status, message };
    });
};

SDKWrapper.prototype.verifyPhone = function (user: Object) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.validatePhone(user))
    .then(({ data }) => ({ responseStatus: 200, ...data.user, walletId: user.walletId }))
    .catch(error => {
      const status = get(error, 'response.status');
      const message = get(error, 'response.data.message');

      Sentry.captureException({
        error: 'Can\'t verify code',
        walletId: user.walletId,
        user,
        status,
        message,
      });
      return { responseStatus: status, message };
    });
};

SDKWrapper.prototype.claimTokens = function ({ walletId, code }: ClaimTokenAction) {
  return Promise.resolve()
    // TODO update pillarWalletSdk
    // .then(() => this.pillarWalletSdk.referral.claimTokens({ walletId, code }))
    // TODO return just 200
    .then(() => ({ responseStatus: 200, walletId, code }))
    .catch(error => {
      const status = get(error, 'response.status');
      const message = get(error, 'response.data.message');

      Sentry.captureException({
        error: 'Can\'t claim referral code',
        walletId,
        code,
        status,
        message,
      });
      return { responseStatus: status, message };
    });
};

SDKWrapper.prototype.updateUserAvatar = function (walletId: string, formData: Object) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.uploadProfileImageFormData(walletId, formData))
    .then(({ data }) => ({ profileImage: data.profileImage, walletId }))
    .catch(() => ({}));
};

SDKWrapper.prototype.getUserAvatar = function (userId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.imageByUserId(userId))
    .catch(() => null);
};

SDKWrapper.prototype.userInfo = function (walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.info({ walletId }))
    .then(({ data }) => ({ ...data, walletId }))
    .catch(() => ({}));
};

SDKWrapper.prototype.userInfoById = function (targetUserId: string, params: UserInfoByIdPayload) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.infoById(targetUserId, params))
    .then(({ data }) => ({ ...data }))
    .catch(() => ({}));
};

SDKWrapper.prototype.userSearch = function (query: string, walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.search({ query, walletId }))
    .then(({ data }) => data)
    .catch(() => []);
};

SDKWrapper.prototype.usernameSearch = function (username: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.usernameSearch({ username }))
    .then(({ data }) => data)
    .catch(error => {
      const status = get(error, 'response.status');
      const message = get(error, 'response.data.message');

      switch (status) {
        case 400:
          return { status, message };
        default:
          return {};
      }
    });

  // TODO: handle 404 and other errors in different ways (e.response.status === 404)
};

SDKWrapper.prototype.validateAddress = function (blockchainAddress: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.validate({ blockchainAddress }))
    .then(({ data }) => data)
    .catch(error => {
      Sentry.captureMessage('Unable to restore user wallet', {
        level: 'info',
        extra: {
          blockchainAddress,
          error,
        },
      });
      return {};
    });
};

SDKWrapper.prototype.fetchSupportedAssets = function (walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.asset.list({ walletId }))
    .then(({ data }) => data)
    .catch(() => []);
};

SDKWrapper.prototype.assetsSearch = function (query: string, walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.asset.search({ query, walletId }))
    .then(({ data }) => data)
    .catch(() => []);
};

SDKWrapper.prototype.fetchCollectibles = function (walletAddress: string) {
  if (!walletAddress) return Promise.resolve({ assets: [] });
  const url = `${OPEN_SEA_API}/assets/?owner=${walletAddress}` +
    '&exclude_currencies=true&order_by=listing_date&order_direction=asc';
  return new Promise((resolve, reject) => {
    getLimitedData(url, [], 300, 0, 'assets', resolve, reject);
  })
    .then(response => ({ assets: response }))
    .catch(() => ({ error: true }));
};

SDKWrapper.prototype.fetchCollectiblesTransactionHistory = function (walletAddress: string) {
  const url = `${OPEN_SEA_API}/events/?account_address=${walletAddress}&exclude_currencies=true&event_type=transfer`;
  return Promise.resolve()
    .then(() => fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-API-KEY': OPEN_SEA_API_KEY,
      },
    }))
    .then(data => data.json())
    .catch(() => ({ error: true }));
};

SDKWrapper.prototype.fetchNotifications = function (
  walletId: string,
  type: string,
  fromTimestamp?: string,
): Promise<RemoteNotification[]> {
  if (!walletId) return Promise.resolve([]);
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.notification.list({
      walletId,
      fromTimestamp,
      type,
    }))
    .then(({ data }) => data)
    .then(({ notifications }) => notifications || [])
    .then(notifications => {
      return notifications.map(notification => {
        if (!isTransactionEvent(notification.type)) return notification;

        const {
          type: notificationType,
          payload: {
            fromAddress,
            toAddress,
            txHash,
            ...restPayload
          },
          ...rest
        } = notification;

        return {
          type: notificationType,
          payload: {
            to: toAddress,
            from: fromAddress,
            hash: txHash,
            ...restPayload,
          },
          ...rest,
        };
      });
    })
    .catch(() => []);
};

SDKWrapper.prototype.fetchICOs = function (userId: string) { //eslint-disable-line
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.investments.icoList({ userId }))
    .then(({ data }) => data.data)
    .catch(() => []);
};

SDKWrapper.prototype.fetchICOFundingInstructions = function (walletId, currency) {
  const cryptos = ['ETH', 'BTC', 'LTC']; // mock purposes;
  const fixtures = {
    ...icoFundingInstructionsFixtures,
    currency,
    paymentType: cryptos.includes(currency) ? 'crypto_currency' : 'bank_transfer',
  };
  return Promise.resolve(fixtures);
};

SDKWrapper.prototype.fetchHistory = function (payload: HistoryPayload) {
  return this.BCXSdk.txHistory(payload)
    .then(({ txHistory: { txHistory } }) => txHistory)
    .then(history => {
      return history.map(({
        fromAddress,
        toAddress,
        txHash,
        timestamp,
        ...rest
      }): Transaction => ({
        to: toAddress,
        from: fromAddress,
        hash: txHash,
        createdAt: timestamp || 0,
        ...rest,
      }));
    })
    .catch(() => []);
};

SDKWrapper.prototype.fetchGasInfo = function () {
  return this.BCXSdk.gasStation()
    .then(data => ({
      min: data.safeLow,
      avg: data.standard,
      max: data.fast,
    }))
    .catch(() => ({}));
};

SDKWrapper.prototype.fetchTxInfo = function (hash: string) {
  return fetchTransactionInfo(hash);
};

SDKWrapper.prototype.fetchTransactionReceipt = function (hash: string) {
  return fetchTransactionReceipt(hash);
};

SDKWrapper.prototype.fetchLastBlockNumber = function () {
  return fetchLastBlockNumber();
};

SDKWrapper.prototype.fetchBalances = function ({ address, assets }: BalancePayload) {
  // TEMPORARY FETCH FROM BLOCKCHAIN DIRECTLY
  return fetchAssetBalances(assets, address);
  // const promises = assets.map(async ({ symbol, address: contractAddress }) => {
  //   const payload = { contractAddress, address, asset: symbol };
  //   const { balance: response } = await this.BCXSdk.getBalance(payload);
  //   return { balance: response.balance, symbol: response.ticker };
  // });
  // return Promise.all(promises).catch(() => []);
};

SDKWrapper.prototype.fetchBadges = function (walletId: string): Promise<UserBadgesResponse> {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.badge.my({ walletId }))
    .then(({ data }) => data)
    .then(data => uniqBy(data, 'id'))
    .catch(() => []);
};

SDKWrapper.prototype.fetchContactBadges = function (walletId: string, userId: string): Promise<Badges> {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.badge.get({ walletId, userId }))
    .then(({ data }) => data)
    .then(data => uniqBy(data, 'id'))
    .catch(() => []);
};

SDKWrapper.prototype.selfAwardBadge = function (walletId: string, event: string): Promise<SelfAwardBadgeResponse | {}> {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.badge.selfAward({ walletId, event }))
    .then(({ data }) => data)
    .catch(() => ({}));
};

SDKWrapper.prototype.sendOldInvitation = function (targetUserId: string, accessKey: string, walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.connection.invite({
      accessKey,
      targetUserId,
      walletId,
    }))
    .then(({ data }) => data)
    .catch(() => null);
};

SDKWrapper.prototype.cancelOldInvitation = function (targetUserId: string, accessKey: string, walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.connection.cancel({
      accessKey,
      targetUserId,
      walletId,
    }))
    .then(({ data }) => data)
    .catch(() => null);
};

SDKWrapper.prototype.acceptOldInvitation = function (
  targetUserId: string,
  targetUserAccessKey: string,
  accessKey: string,
  sourceIdentityKey: ?string,
  targetIdentityKey: ?string,
  walletId: string,
) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.connection.accept({
      sourceUserAccessKey: accessKey,
      targetUserId,
      targetUserAccessKey,
      sourceUserIdentityKeys: {
        sourceIdentityKey,
        targetIdentityKey,
      },
      walletId,
    }))
    .then(({ data }) => data)
    .catch(() => null);
};

SDKWrapper.prototype.rejectOldInvitation = function (targetUserId: string, accessKey: string, walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.connection.reject({
      accessKey,
      targetUserId,
      walletId,
    }))
    .then(({ data }) => data)
    .catch(() => null);
};

SDKWrapper.prototype.sendInvitation = function (
  targetUserId: string,
  sourceIdentityKey: string,
  targetIdentityKey: string,
  walletId: string,
) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.connectionV2.invite({
      targetUserId,
      sourceIdentityKey,
      targetIdentityKey,
      walletId,
    }))
    .then(({ data }) => data)
    .catch(() => null);
};

SDKWrapper.prototype.cancelInvitation = function (
  targetUserId: string,
  sourceIdentityKey: string,
  targetIdentityKey: string,
  walletId: string,
) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.connectionV2.cancel({
      targetUserId,
      sourceIdentityKey,
      targetIdentityKey,
      walletId,
    }))
    .then(({ data }) => data)
    .catch(() => null);
};

SDKWrapper.prototype.acceptInvitation = function (
  targetUserId: string,
  sourceUserIdentityKeys: {
    sourceIdentityKey: string;
    targetIdentityKey: string;
  },
  targetUserIdentityKeys: {
    sourceIdentityKey: string;
    targetIdentityKey: string;
  },
  walletId: string,
) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.connectionV2.accept({
      targetUserId,
      sourceUserIdentityKeys,
      targetUserIdentityKeys,
      walletId,
    }))
    .then(({ data }) => data)
    .catch(() => null);
};

SDKWrapper.prototype.rejectInvitation = function (
  targetUserId: string,
  sourceIdentityKey: string,
  targetIdentityKey: string,
  walletId: string,
) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.connectionV2.reject({
      targetUserId,
      sourceIdentityKey,
      targetIdentityKey,
      walletId,
    }))
    .then(({ data }) => data)
    .catch(() => null);
};

SDKWrapper.prototype.disconnectUser = function (
  targetUserId: string,
  sourceIdentityKey: string,
  targetIdentityKey: string,
  walletId: string,
) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.connectionV2.disconnect({
      targetUserId,
      sourceIdentityKey,
      targetIdentityKey,
      walletId,
    }))
    .then(({ data }) => data)
    .catch(() => null);
};

SDKWrapper.prototype.muteUser = function (
  targetUserId: string,
  sourceIdentityKey: string,
  targetIdentityKey: string,
  walletId: string,
  mute: boolean,
) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.connectionV2.mute({
      targetUserId,
      sourceIdentityKey,
      targetIdentityKey,
      walletId,
      mute,
    }))
    .then(({ data }) => data)
    .catch(() => null);
};

SDKWrapper.prototype.blockUser = function (
  targetUserId: string,
  sourceIdentityKey: string,
  targetIdentityKey: string,
  walletId: string,
  block: boolean,
) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.connectionV2.block({
      targetUserId,
      sourceIdentityKey,
      targetIdentityKey,
      walletId,
      block,
    }))
    .then(({ data }) => data)
    .catch(() => null);
};

SDKWrapper.prototype.fetchAccessTokens = function (walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.accessTokens({ walletId }))
    .then(({ data }) => data)
    .catch(() => []);
};

SDKWrapper.prototype.setUsername = function (username: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.configuration.setUsername(username))
    .catch(() => null);
};

SDKWrapper.prototype.approveLoginToExternalResource = function (loginToken: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.register.approveExternalLogin({ loginToken }))
    .catch(error => {
      Sentry.captureException({
        type: 'External login approve error',
        error,
      });
      return { error };
    });
};

SDKWrapper.prototype.connectionsCount = function (walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.connection.count({ walletId }))
    .then(({ data }) => data)
    .catch(() => null);
};

SDKWrapper.prototype.mapIdentityKeys = function (connectionKeyIdentityMap: ConnectionIdentityKeyMap) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.connection.mapIdentityKeys(connectionKeyIdentityMap))
    .then(({ data }) => data)
    .catch(() => []);
};

SDKWrapper.prototype.updateIdentityKeys = function (updatedIdentityKeys: ConnectionUpdateIdentityKeys) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.connection.updateIdentityKeys(updatedIdentityKeys))
    .then(({ data }) => data)
    .catch(() => false);
};

SDKWrapper.prototype.patchIdentityKeys = function (updatedIdentityKeys: ConnectionPatchIdentityKeys) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.connection.patchIdentityKeys(updatedIdentityKeys))
    .then(({ data }) => data)
    .catch(() => false);
};

SDKWrapper.prototype.getContactsSmartAddresses = function (walletId: string, contacts: MapContactsAddresses) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.mapContactsAddresses({ walletId, contacts }))
    .then(({ data }) => data)
    .catch(() => false);
};

SDKWrapper.prototype.importedEthTransactionHistory = function (walletAddress: string) {
  if (NETWORK_PROVIDER !== 'homestead') return Promise.resolve([]);
  return Promise.resolve()
    .then(() => ethplorerSdk.getAddressTransactions(walletAddress, { limit: 40 }))
    .then(data => Array.isArray(data) ? data : [])
    .catch(() => []);
};

SDKWrapper.prototype.importedErc20TransactionHistory = function (walletAddress: string) {
  if (NETWORK_PROVIDER !== 'homestead') return Promise.resolve([]);
  return Promise.resolve()
    .then(() => ethplorerSdk.getAddressHistory(walletAddress, { type: 'transfer', limit: 40 }))
    .then(data => get(data, 'operations', []))
    .catch(() => []);
};

SDKWrapper.prototype.getAddressErc20TokensInfo = function (walletAddress: string) {
  if (NETWORK_PROVIDER !== 'homestead') {
    const url = `https://blockchainparser.appspot.com/${NETWORK_PROVIDER}/${walletAddress}/`;
    return Promise.resolve()
      .then(() => fetch(url))
      .then(resp => resp.json())
      .catch(() => []);
  }
  return Promise.resolve()
    .then(() => ethplorerSdk.getAddressInfo(walletAddress))
    .then(data => get(data, 'tokens', []))
    .catch(() => []);
};

SDKWrapper.prototype.fetchMoonPayOffers = function (fromAsset: string, toAsset: string, amount: number) {
  const amountToGetOffer = amount < MIN_MOONPAY_FIAT_VALUE ? MIN_MOONPAY_FIAT_VALUE : amount;
  const url = `${MOONPAY_API_URL}/v3/currencies/${toAsset.toLowerCase()}/quote/?apiKey=${MOONPAY_KEY}`
  + `&baseCurrencyAmount=${amountToGetOffer}&baseCurrencyCode=${fromAsset.toLowerCase()}`;

  return Promise.resolve()
    .then(() => fetch(url))
    .then(resp => resp.json())
    .then(data => {
      if (data.totalAmount) {
        const {
          feeAmount,
          extraFeeAmount,
          quoteCurrencyAmount,
        } = data;

        const extraFeeAmountForAmountProvided = (extraFeeAmount / amountToGetOffer) * amount;
        const totalAmount = amount + feeAmount + extraFeeAmountForAmountProvided;

        return {
          provider: 'MoonPay',
          askRate: totalAmount,
          fromAsset: { code: fromAsset },
          toAsset: { code: toAsset },
          feeAmount,
          extraFeeAmount: extraFeeAmountForAmountProvided,
          quoteCurrencyAmount,
          _id: 'moonpay',
          minQuantity: MIN_MOONPAY_FIAT_VALUE,
          maxQuantity: 9999999,
        };
      }
      return { error: true };
    })
    .catch(() => ({ error: true }));
};

SDKWrapper.prototype.fetchMoonPaySupportedAssetsTickers = function () {
  const url = `${MOONPAY_API_URL}/v3/currencies`;
  return fetch(url)
    .then(resp => resp.json())
    .then(data => {
      return data.filter(({ isSuspended, code }) => !isSuspended && !!code).map(({ code }) => code.toUpperCase());
    })
    .catch(() => []);
};

SDKWrapper.prototype.fetchSendWyreOffers = function (fromAsset: string, toAsset: string, amount: number) {
  return Promise.resolve()
    .then(() => fetch(`${SENDWYRE_API_URL}/v3/rates?as=MULTIPLIER`))
    .then(resp => resp.json())
    .then(data => {
      if (data[fromAsset + toAsset]) {
        return {
          provider: 'SendWyre',
          askRate: amount,
          fromAsset: { code: fromAsset },
          toAsset: { code: toAsset },
          feeAmount: '',
          extraFeeAmount: '',
          quoteCurrencyAmount: amount * data[fromAsset + toAsset],
          _id: 'sendwyre',
          minQuantity: 0.01,
          maxQuantity: 9999999,
        };
      }
      return { error: true };
    })
    .catch(() => ({ error: true }));
};

SDKWrapper.prototype.fetchSendWyreSupportedAssetsTickers = function () {
  return fetch(`${SENDWYRE_API_URL}/v3/rates`)
    .then(resp => resp.json())
    .then(data => {
      const exchangePairs = Object.keys(data);
      const exchangePairsWithSupportedFiatAsFirstItem = exchangePairs.filter((pair) =>
        (pair.startsWith('USD') && !pair.startsWith('USDC')) || pair.startsWith('EUR') || pair.startsWith('GBP'));

      return exchangePairsWithSupportedFiatAsFirstItem.map((key) => key.substring(3));
    })
    .catch(() => []);
};
