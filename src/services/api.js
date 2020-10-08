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
import { Platform } from 'react-native';
import { getEnv } from 'configs/envConfig';
import axios, { AxiosResponse } from 'axios';
import isEmpty from 'lodash.isempty';
import { GasPriceOracle } from 'gas-price-oracle';
import https from 'https';

// constants
import { SDK_REASON_REGISTRATION_FAILED, SDK_REASON_USERNAME_FAILED } from 'constants/walletConstants';
import { ALTALIX_AVAILABLE_COUNTRIES } from 'constants/fiatToCryptoConstants';

// utils
import { transformAssetsToObject } from 'utils/assets';
import { isTransactionEvent } from 'utils/history';
import { reportErrorLog, reportLog, uniqBy } from 'utils/common';
import { validEthplorerTransaction } from 'utils/notifications';
import { normalizeWalletAddress } from 'utils/wallet';

// models, types
import type { Asset } from 'models/Asset';
import type { UserBadgesResponse, SelfAwardBadgeResponse, Badges } from 'models/Badge';
import type { ApiNotification } from 'models/Notification';
import type { OAuthTokens } from 'utils/oAuth';
import type { ClaimTokenAction } from 'actions/referralsActions';
import type { AltalixTrxParams, SendwyreRates, SendwyreTrxParams } from 'models/FiatToCryptoProviders';

// services
import {
  fetchAddressBalancesFromProxyContract,
  fetchAssetBalancesOnChain,
  fetchLastBlockNumber,
  fetchTransactionInfo,
  fetchTransactionReceipt,
} from './assets';
import EthplorerSdk from './EthplorerSdk';
import { getLimitedData } from './opensea';


const ERROR = 'error';
const LOCATION_NOT_SUPPORTED = 'Location not supported';
const USERNAME_EXISTS_ERROR_CODE = 409;
export const API_REQUEST_TIMEOUT = 10000;
export const defaultAxiosRequestConfig = { timeout: API_REQUEST_TIMEOUT };

type BalancePayload = {
  address: string,
  assets: Asset[],
};

type RegisterSmartWalletPayload = {
  walletId: string,
  privateKey: string,
  ethAddress: string,
  fcmToken: string,
};

type VerifyEmail = {|
  walletId: string,
  oneTimePassword: string,
|};

type SendReferralInvitationParams = {|
  walletId: string,
  token: string,
  referralLink: string,
  email?: string,
  phone?: string,
|};

type ValidatedUserResponse = $Shape<{
  id: string,
  walletId: string,
  username: string,
  profileImage: string,
  profileLargeImage: string,
  error: boolean,
}>;

type DirectSdkRequestOptions = {|
  path: string,
  method?: string,
  data?: Object,
  params?: Object,
|};

const ethplorerSdk = new EthplorerSdk(getEnv().ETHPLORER_API_KEY);

class SDKWrapper {
  pillarWalletSdk: PillarSdk = null;
  gasOracle: GasPriceOracle = null;

  init(
    updateOAuth?: ?Function,
    oAuthTokensStored?: ?OAuthTokens,
    onOAuthTokensFailed?: ?Function,
  ) {
    this.gasOracle = new GasPriceOracle();
    const {
      SDK_PROVIDER,
      NOTIFICATIONS_URL,
      INVESTMENTS_URL,
    } = getEnv();
    this.pillarWalletSdk = new PillarSdk({
      apiUrl: SDK_PROVIDER, // ONLY if you have platform running locally
      notificationsUrl: NOTIFICATIONS_URL,
      investmentsUrl: INVESTMENTS_URL,
      updateOAuthFn: updateOAuth,
      oAuthTokens: oAuthTokensStored,
      tokensFailedCallbackFn: onOAuthTokensFailed,
    });
    this.pillarWalletSdk.configuration.setRequestTimeout(API_REQUEST_TIMEOUT);
  }

  supportHmac(): string {
    return this.pillarWalletSdk.user.supportHmac({ project: Platform.OS })
      .then(({ data }) => data.hmac || '')
      .catch(() => '');
  }

  listAccounts(walletId: string) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.user.infoSmartWallet({ walletId }))
      .then(({ data }) => data.wallets || [])
      .catch(() => []);
  }

  registerOnBackend(fcmToken: ?string, username: string) {
    let requestPayload = { username };
    if (!isEmpty(fcmToken)) requestPayload = { ...requestPayload, fcmToken };
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.wallet.register(requestPayload))
      .then(({ data }) => data)
      .catch((e = {}) => {
        const status = get(e, 'response.status');
        if (status === USERNAME_EXISTS_ERROR_CODE) {
          return {
            error: true,
            reason: SDK_REASON_USERNAME_FAILED,
          };
        }
        return {
          error: true,
          reason: SDK_REASON_REGISTRATION_FAILED,
        };
      });
  }

  registerSmartWallet(payload: RegisterSmartWalletPayload) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.wallet.registerSmartWallet(payload))
      .then(({ data }) => data)
      .catch(e => ({
        error: true,
        reason: e,
      }));
  }

  registerOnAuthServer(
    walletPrivateKey: string,
    fcmToken: ?string,
    username: ?string,
    recovery?: {
      accountAddress: string,
      deviceAddress: string,
    },
  ) {
    const privateKey = walletPrivateKey.indexOf('0x') === 0 ? walletPrivateKey.slice(2) : walletPrivateKey;
    let requestPayload = { privateKey };
    if (username) requestPayload = { ...requestPayload, username };
    if (!isEmpty(fcmToken)) requestPayload = { ...requestPayload, fcmToken };
    if (!isEmpty(recovery)) requestPayload = { ...requestPayload, recovery };
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.wallet.registerAuthServer(requestPayload))
      .then(({ data }) => data)
      .catch((error) => {
        reportErrorLog('Registration error', { error });
        const responseStatus = get(error, 'response.status');
        const reason = responseStatus === USERNAME_EXISTS_ERROR_CODE
          ? SDK_REASON_USERNAME_FAILED
          : SDK_REASON_REGISTRATION_FAILED;
        return { error: true, reason };
      });
  }

  updateFCMToken(walletId: string, fcmToken: string) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.wallet.update({ walletId, fcmToken }))
      .then(({ data }) => data)
      .catch(() => ({}));
  }

  fetchInitialAssets(walletId: string) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.asset.defaults({ walletId }))
      .then(({ data }) => {
        if (!Array.isArray(data)) {
          reportLog('Wrong initial assets received', { data });
          return [];
        }
        return data;
      })
      .catch(() => [])
      .then(transformAssetsToObject);
  }

  updateUser(user: Object) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.user.update(user))
      .then(({ data }) => ({ responseStatus: 200, ...data.user, walletId: user.walletId }))
      .catch(error => {
        const status = get(error, 'response.status');
        const message = get(error, 'response.data.message');

        reportErrorLog('updateUser: Failed to update user', {
          walletId: user.walletId,
          user,
          status,
          message,
        });
        return { responseStatus: status, message };
      });
  }

  createOneTimePassword(user: Object) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.user.createOneTimePassword(user))
      .then(({ data }) => ({ responseStatus: 200, ...data.user, walletId: user.walletId }))
      .catch(error => {
        const status = get(error, 'response.status');
        const message = get(error, 'response.data.message');

        reportErrorLog('createOneTimePassword: Failed to send text', {
          walletId: user.walletId,
          user,
          status,
          message,
        });
        return { responseStatus: status, message };
      });
  }

  verifyEmail(params: VerifyEmail) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.user.validateEmail(params))
      .then(({ data }) => ({ responseStatus: 200, ...data.user, walletId: params.walletId }))
      .catch(error => {
        const status = get(error, 'response.status');
        const message = get(error, 'response.data.message');

        reportErrorLog('Can\'t verify code', {
          walletId: params.walletId,
          user: params,
          status,
          message,
        });
        return { responseStatus: status, message };
      });
  }

  verifyPhone(user: Object) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.user.validatePhone(user))
      .then(({ data }) => ({ responseStatus: 200, ...data.user, walletId: user.walletId }))
      .catch(error => {
        const status = get(error, 'response.status');
        const message = get(error, 'response.data.message');

        if (message !== 'One-time password is not valid.') {
          reportErrorLog('verifyPhone: Can\'t verify code', {
            walletId: user.walletId,
            user,
            status,
            message,
          });
        }
        return { responseStatus: status, message };
      });
  }

  generateReferralToken(walletId: string) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.referral.generateToken({
        walletId,
      }))
      .then(({ data }) => data)
      .catch(() => ({ result: ERROR }));
  }

  sendReferralInvitation(params: SendReferralInvitationParams) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.referral.sendInvitation(params))
      .then(({ data }) => data)
      .catch((error) => ({ result: ERROR, error }));
  }

  claimTokens({ walletId, code }: ClaimTokenAction) {
    return Promise.resolve()
      // TODO update pillarWalletSdk
      // .then(() => this.pillarWalletSdk.referral.claimTokens({ walletId, code }))
      // TODO return just 200
      .then(() => ({ responseStatus: 200, walletId, code }))
      .catch(error => {
        const status = get(error, 'response.status');
        const message = get(error, 'response.data.message');

        reportErrorLog('claimTokens: Can\'t claim referral code', {
          walletId,
          code,
          status,
          message,
        });
        return { responseStatus: status, message };
      });
  }

  getSentReferralInvites(walletId: string) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.referral.list({ walletId }))
      .then(({ data }) => data.data)
      .catch(() => []);
  }

  getReferralCampaignsInfo(walletId: string, referralToken: ?string) {
    const requestPayload = referralToken ? { walletId, token: referralToken } : { walletId };
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.referral.listCampaigns(requestPayload))
      .then(({ data }) => get(data, 'campaigns', {}))
      .catch(() => ({}));
  }

  getReferralRewardIssuerAddress(walletId: string, referralToken: ?string) {
    const requestPayload = referralToken ? { walletId, token: referralToken } : { walletId };
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.referral.listCampaigns(requestPayload))
      .then(({ data }) => {
        const campaignsData = get(data, 'campaigns', {});
        return Object.keys(campaignsData).reduce((memo, campaign) => {
          if (!campaignsData[campaign].rewards && !campaignsData[campaign].rewards.length) return memo;
          const campaignsAddresses = campaignsData[campaign].rewards.map(({ rewardAddress }) => rewardAddress)
            .filter(n => n);
          return [...memo, ...campaignsAddresses];
        }, []);
      })
      .catch(() => []);
  }

  updateUserAvatar(walletId: string, formData: Object) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.user.uploadProfileImageFormData(walletId, formData))
      .then(({ data }) => ({ profileImage: data.profileImage, walletId }))
      .catch(() => ({}));
  }

  getUserAvatar(userId: string) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.user.imageByUserId(userId))
      .catch(() => null);
  }

  deleteUserAvatar(walletId: string): Promise<boolean> {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.user.deleteProfileImage({ walletId }))
      .then(response => response.status === 204)
      .catch((error) => {
        reportErrorLog('Failed to delete user avatar', { error });
        return false;
      });
  }

  userInfo(walletId: string): Promise<Object> {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.user.info({ walletId }))
      .then(({ data }) => ({ ...data, walletId }))
      .catch(() => ({}));
  }

  userInfoById(targetUserId: string, myWalletId: string) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.user.infoById(targetUserId, { walletId: myWalletId }))
      .then(({ data }) => ({ ...data }))
      .catch(() => ({}));
  }

  userSearch(query: string, walletId: string) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.user.search({ query, walletId }))
      .then(({ data }) => data)
      .catch(() => []);
  }

  usernameSearch(username: string) {
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
  }

  validateAddress(blockchainAddress: string): Promise<ValidatedUserResponse> {
    blockchainAddress = normalizeWalletAddress(blockchainAddress);
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.user.validate({ blockchainAddress }))
      .then(({ data }) => data)
      .catch((error) => {
        reportLog('validateAddress failed', { error });
        return null;
      });
  }

  fetchSupportedAssets(walletId: string) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.asset.list({ walletId }))
      .then(({ data }) => {
        if (!Array.isArray(data)) {
          reportLog('Wrong supported assets received', { data });
          return [];
        }
        return data;
      })
      .catch(() => []);
  }

  assetsSearch(query: string, walletId: string) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.asset.search({ query, walletId }))
      .then(({ data }) => data)
      .catch(() => []);
  }

  /* eslint-disable i18next/no-literal-string */
  fetchCollectibles(walletAddress: string) {
    if (!walletAddress) return Promise.resolve({ assets: [] });
    const url = `${getEnv().OPEN_SEA_API}/assets/?owner=${walletAddress}` +
      '&exclude_currencies=true&order_by=listing_date&order_direction=asc';
    return new Promise((resolve, reject) => {
      getLimitedData(url, [], 300, 0, 'assets', resolve, reject);
    })
      .then(response => ({ assets: response }))
      .catch(() => ({ error: true }));
  }
  /* eslint-enable i18next/no-literal-string */

  fetchCollectiblesTransactionHistory(walletAddress: string) {
    // eslint-disable-next-line i18next/no-literal-string, max-len
    const url = `${getEnv().OPEN_SEA_API}/events/?account_address=${walletAddress}&exclude_currencies=true&event_type=transfer`;
    return Promise.resolve()
      .then(() => axios.get(url, {
        ...defaultAxiosRequestConfig,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-API-KEY': getEnv().OPEN_SEA_API_KEY,
        },
      }))
      .then(({ data }: AxiosResponse) => data)
      .catch(() => ({ error: true }));
  }

  fetchNotifications(
    walletId: string,
    type: string,
    fromTimestamp?: string,
  ): Promise<ApiNotification[]> {
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
  }

  fetchGasInfo() {
    return this.gasOracle.fetchGasPricesOffChain()
      .then(data => ({
        min: data.low,
        avg: data.standard,
        max: data.fast,
      }))
      .catch(() => ({}));
  }

  fetchTxInfo(hash: string, network?: string) {
    return fetchTransactionInfo(hash, network);
  }

  fetchTransactionReceipt(hash: string, network?: string) {
    return fetchTransactionReceipt(hash, network);
  }

  fetchLastBlockNumber(network?: string) {
    return fetchLastBlockNumber(network);
  }

  async fetchBalances({ address, assets }: BalancePayload) {
    // try to get all the balances in one call (mainnet and kovan only)
    const balances = await fetchAddressBalancesFromProxyContract(assets, address);
    if (!isEmpty(balances)) return balances;

    // if we fail to get the balances in one call, let's use the fallback method
    return fetchAssetBalancesOnChain(assets, address);
  }

  fetchBadges(walletId: string): Promise<UserBadgesResponse> {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.badge.my({ walletId }))
      .then(({ data }) => data)
      .then(data => uniqBy(data, 'id'))
      .catch(() => []);
  }

  fetchContactBadges(walletId: string, userId: string): Promise<Badges> {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.badge.get({ walletId, userId }))
      .then(({ data }) => data)
      .then(data => uniqBy(data, 'id'))
      .catch(() => []);
  }

  selfAwardBadge(walletId: string, event: string): Promise<SelfAwardBadgeResponse | {}> {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.badge.selfAward({ walletId, event }))
      .then(({ data }) => data)
      .catch(() => ({}));
  }

  setUsername(username: string) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.configuration.setUsername(username))
      .catch(() => null);
  }

  approveLoginToExternalResource(loginToken: string) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.register.approveExternalLogin({ loginToken }))
      .catch(error => {
        reportErrorLog('approveLoginToExternalResource: External login approve error', { error });
        return { error };
      });
  }

  sendInvitation(
    targetUserId: string,
    walletId: string,
  ) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.connectionV2.invite({
        targetUserId,
        walletId,
      }))
      .then(({ data }) => data)
      .catch(() => null);
  }

  cancelInvitation(
    targetUserId: string,
    walletId: string,
  ) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.connectionV2.cancel({
        targetUserId,
        walletId,
      }))
      .then(({ data }) => data)
      .catch(() => null);
  }

  acceptInvitation(
    targetUserId: string,
    walletId: string,
  ) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.connectionV2.accept({
        targetUserId,
        walletId,
      }))
      .then(({ data }) => data)
      .catch(() => null);
  }

  rejectInvitation(
    targetUserId: string,
    walletId: string,
  ) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.connectionV2.reject({
        targetUserId,
        walletId,
      }))
      .then(({ data }) => data)
      .catch(() => null);
  }

  disconnectUser(
    targetUserId: string,
    walletId: string,
  ) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.connectionV2.disconnect({
        targetUserId,
        walletId,
      }))
      .then(({ data }) => data)
      .catch(() => null);
  }

  muteUser(
    targetUserId: string,
    walletId: string,
    mute: boolean,
  ) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.connectionV2.mute({
        targetUserId,
        walletId,
        mute,
      }))
      .then(({ data }) => data)
      .catch(() => null);
  }

  blockUser(
    targetUserId: string,
    walletId: string,
    block: boolean,
  ) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.connectionV2.block({
        targetUserId,
        walletId,
        block,
      }))
      .then(({ data }) => data)
      .catch(() => null);
  }

  importedEthTransactionHistory(walletAddress: string) {
    if (getEnv().NETWORK_PROVIDER !== 'homestead') return Promise.resolve([]);
    return Promise.resolve()
      .then(() => ethplorerSdk.getAddressTransactions(walletAddress, { limit: 40 }))
      .then(data => Array.isArray(data) ? data : [])
      .then(data => data.filter(validEthplorerTransaction))
      .catch(() => []);
  }

  importedErc20TransactionHistory(walletAddress: string) {
    if (getEnv().NETWORK_PROVIDER !== 'homestead') return Promise.resolve([]);
    return Promise.resolve()
      .then(() => ethplorerSdk.getAddressHistory(walletAddress, { limit: 40 }))
      .then(data => get(data, 'operations', []))
      .then(data => data.filter(validEthplorerTransaction))
      .catch(() => []);
  }

  getAddressErc20TokensInfo(walletAddress: string) {
    if (getEnv().NETWORK_PROVIDER !== 'homestead') {
      // eslint-disable-next-line i18next/no-literal-string
      const url = `https://blockchainparser.appspot.com/${getEnv().NETWORK_PROVIDER}/${walletAddress}/`;
      return Promise.resolve()
        .then(() => axios.get(url, defaultAxiosRequestConfig))
        .then(({ data }: AxiosResponse) => data)
        .catch(() => []);
    }
    return Promise.resolve()
      .then(() => ethplorerSdk.getAddressInfo(walletAddress))
      .then(data => get(data, 'tokens', []))
      .catch(() => []);
  }

  makeDirectSdkRequest({ path, method = 'GET', ...rest }: DirectSdkRequestOptions): Promise<AxiosResponse> {
    const requestOptions = {
      url: getEnv().SDK_PROVIDER + path,
      defaultRequest: {
        method,
        httpsAgent: new https.Agent({ rejectUnathorized: false }),
      },
      ...rest,
    };

    return this.pillarWalletSdk.configuration.executeRequest(requestOptions);
  }

  generateAltalixTransactionUrl(data: AltalixTrxParams): Promise<string | null> {
    return this.makeDirectSdkRequest({
      path: '/partners/altalix/generate-transaction-url',
      method: 'POST',
      data,
    })
      .then(response => response.data.url)
      .catch(error => {
        reportErrorLog(
          'generateAltalixTransactionUrl: SDK request error',
          error.response?.data ?? { error },
        );
        return null;
      });
  }

  fetchAltalixAvailability(walletId: string): Promise<boolean> {
    return this.makeDirectSdkRequest({
      path: '/user/location',
      params: { walletId },
    })
      .then(response => ALTALIX_AVAILABLE_COUNTRIES.includes(response.data.country))
      .catch(error => {
        reportErrorLog(
          'fetchAltalixAvailability: SDK request error',
          error.response?.data ?? { error },
        );
        return false;
      });
  }

  getSendwyreRates(walletId: string): Promise<SendwyreRates> {
    return this.makeDirectSdkRequest({
      path: '/partners/wyre/exchange-rates',
      params: { walletId },
    })
      .then(response => response.data.exchangeRates)
      .catch(error => {
        reportErrorLog(
          'getSendwyreRates: SDK request error',
          error.response?.data ?? { error },
        );
        return {};
      });
  }

  getSendwyreCountrySupport(walletId: string): Promise<boolean | null> {
    // NOTE: this request should always return an error from the server.
    // Because testing whether the user location is within a country supported
    // by Wyre occurs before data validation, we send an empty (and thus invalid)
    // request and base the answer on the type of error returned with the response.
    //
    // 400 Bad Request => country is supported
    // 403 Forbidden   => country is not supported

    return this.makeDirectSdkRequest({
      path: '/partners/wyre/generate-order-reservation',
      method: 'POST',
      data: { walletId },
    })
      .then(() => true)
      .catch(error => {
        const { response: { status, data } = {} } = error;

        if (status === 400) return true;
        if (status === 403 && data.message === LOCATION_NOT_SUPPORTED) return false;

        // Any other type of error is unexpected and will be reported as usual.
        reportErrorLog(
          'getSendwyreCountrySupport: SDK request error',
          data ?? { error },
        );
        return null;
      });
  }

  getSendwyreWidgetURL({ address, ...params }: SendwyreTrxParams): Promise<string | null> {
    return this.makeDirectSdkRequest({
      path: '/partners/wyre/generate-order-reservation',
      method: 'POST',
      data: {
        ...params,
        dest: `ethereum:${address}`,
        lockFields: ['destCurrency'],
      },
    })
      .then(response => response.data.url)
      .catch(error => {
        reportErrorLog(
          'getSendwyreWidgetURL: SDK request error',
          error.response?.data ?? { error },
        );
        return null;
      });
  }
}

export default SDKWrapper;
