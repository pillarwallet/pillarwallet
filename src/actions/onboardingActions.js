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
import ethers from 'ethers';
import { NavigationActions } from 'react-navigation';
import firebase from 'react-native-firebase';
import { delay, uniqBy } from 'utils/common';
import Intercom from 'react-native-intercom';
import { ImageCacheManager } from 'react-native-cached-image';
import { generateMnemonicPhrase, getSaltedPin } from 'utils/wallet';
import {
  ENCRYPTING,
  GENERATE_ENCRYPTED_WALLET,
  GENERATING,
  UPDATE_WALLET_STATE,
  REGISTERING,
  USERNAME_EXISTS,
  USERNAME_OK,
  CHECKING_USERNAME,
  SET_API_USER,
  INAPPROPRIATE_USERNAME,
  INVALID_USERNAME,
} from 'constants/walletConstants';
import { APP_FLOW, NEW_WALLET, ASSETS } from 'constants/navigationConstants';
import { SET_INITIAL_ASSETS, UPDATE_ASSETS } from 'constants/assetsConstants';
import { UPDATE_CONTACTS } from 'constants/contactsConstants';
import {
  TYPE_ACCEPTED,
  TYPE_RECEIVED,
  UPDATE_INVITATIONS,
} from 'constants/invitationsConstants';
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import { UPDATE_RATES } from 'constants/ratesConstants';
import { PENDING, REGISTERED, UPDATE_USER } from 'constants/userConstants';
import { UPDATE_ACCESS_TOKENS } from 'constants/accessTokensConstants';
import { SET_HISTORY } from 'constants/historyConstants';
import { toastWalletBackup } from 'utils/toasts';
import { updateOAuthTokensCB } from 'utils/oAuth';
import Storage from 'services/storage';
import { navigate } from 'services/navigation';
import { getExchangeRates } from 'services/assets';
import { signalInitAction } from 'actions/signalClientActions';
import { saveDbAction } from './dbActions';
import { generateWalletMnemonicAction } from './walletActions';

const storage = Storage.getInstance('db');

const getTokenWalletAndRegister = async (privateKey: string, api: Object, user: Object, dispatch: Function) => {
  await firebase.messaging().requestPermission().catch(() => { });
  const fcmToken = await firebase.messaging().getToken().catch(() => { });

  await Intercom.sendTokenToIntercom(fcmToken).catch(() => null);
  const sdkWallet = await api.registerOnAuthServer(privateKey, fcmToken, user.username);
  const registrationSucceed = !sdkWallet.error;
  const userInfo = await api.userInfo(sdkWallet.walletId);
  const userState = Object.keys(userInfo).length ? REGISTERED : PENDING;

  if (Object.keys(userInfo).length) {
    dispatch(saveDbAction('user', { user: userInfo }, true));
  }

  const oAuthTokens = {
    refreshToken: sdkWallet.refreshToken,
    accessToken: sdkWallet.accessToken,
  };

  const updateOAuth = updateOAuthTokensCB(dispatch);
  await updateOAuth(oAuthTokens);

  dispatch({
    type: UPDATE_USER,
    payload: {
      user: userInfo,
      state: userState,
    },
  });

  if (!registrationSucceed) {
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: sdkWallet.reason,
    });
  }

  // invalidate image cache
  ImageCacheManager().clearCache().catch(() => null);

  return {
    sdkWallet,
    userInfo,
    userState,
    fcmToken,
    registrationSucceed,
    oAuthTokens,
  };
};

const finishRegistration = async (api: Object, userInfo: Object, dispatch: Function) => {
  // get & store initial assets
  const initialAssets = await api.fetchInitialAssets(userInfo.walletId);
  const rates = await getExchangeRates(Object.keys(initialAssets));

  dispatch({
    type: UPDATE_RATES,
    payload: rates,
  });

  dispatch({
    type: SET_INITIAL_ASSETS,
    payload: initialAssets,
  });

  dispatch(saveDbAction('assets', { assets: initialAssets }));

  // restore access tokens
  await dispatch(restoreAccessTokensAction(userInfo.walletId)); // eslint-disable-line
};

const navigateToAppFlow = (isWalletBackedUp: boolean) => {
  const navigateToAssetsAction = NavigationActions.navigate({
    routeName: APP_FLOW,
    params: {},
    action: NavigationActions.navigate({ routeName: ASSETS }),
  });

  toastWalletBackup(isWalletBackedUp);
  navigate(navigateToAssetsAction);
};

export const registerWalletAction = () => {
  return async (dispatch: Function, getState: () => any, api: Object) => {
    const currentState = getState();
    const {
      mnemonic,
      pin,
      importedWallet,
      apiUser,
    } = currentState.wallet.onboarding;

    const mnemonicPhrase = mnemonic.original;
    const { isBackedUp, isImported } = currentState.wallet.backupStatus;

    // STEP 0: Clear local storage
    await storage.removeAll();
    dispatch({ type: UPDATE_CONTACTS, payload: [] });
    dispatch({ type: UPDATE_INVITATIONS, payload: [] });
    dispatch({ type: UPDATE_ASSETS, payload: {} });
    dispatch({ type: UPDATE_APP_SETTINGS, payload: {} });
    dispatch({ type: UPDATE_ACCESS_TOKENS, payload: [] });
    dispatch({ type: SET_HISTORY, payload: [] });

    // STEP 1: navigate to the new wallet screen
    navigate(NavigationActions.navigate({ routeName: NEW_WALLET }));
    await delay(50);

    // STEP 2: check if wallet was imported or create it from the mnemonic phrase otherwise
    let wallet = importedWallet;
    if (!wallet) {
      dispatch({
        type: UPDATE_WALLET_STATE,
        payload: GENERATING,
      });
      await delay(50);
      wallet = ethers.Wallet.fromMnemonic(mnemonicPhrase);
    }

    // STEP 3: encrypt the wallet
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: ENCRYPTING,
    });
    await delay(50);
    const saltedPin = await getSaltedPin(pin, dispatch);
    const encryptedWallet = await wallet.RNencrypt(saltedPin, { scrypt: { N: 16384 } })
      .then(JSON.parse)
      .catch(() => ({}));

    dispatch(saveDbAction('wallet', {
      wallet: {
        ...encryptedWallet,
        backupStatus: { isImported: !!importedWallet, isBackedUp },
      },
    }));
    dispatch(saveDbAction('app_settings', { appSettings: { wallet: +new Date() } }));
    const user = apiUser.username ? { username: apiUser.username } : {};
    dispatch(saveDbAction('user', { user }));
    dispatch({
      type: GENERATE_ENCRYPTED_WALLET,
      payload: {
        address: wallet.address,
      },
    });

    // STEP 4: Initialize SDK and register user
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: REGISTERING,
    });

    api.init();
    const {
      sdkWallet,
      userInfo,
      fcmToken,
      registrationSucceed,
      oAuthTokens,
    } = await getTokenWalletAndRegister(wallet.privateKey, api, user, dispatch);

    await dispatch(signalInitAction({
      userId: sdkWallet.userId,
      username: user.username,
      walletId: sdkWallet.walletId,
      ethAddress: wallet.address,
      fcmToken,
      ...oAuthTokens,
    }));

    if (!registrationSucceed) { return; }

    // STEP 5: finish registration
    await finishRegistration(api, userInfo, dispatch);

    // STEP 6: all done, navigate to the assets screen
    const isWalletBackedUp = isImported || isBackedUp;
    navigateToAppFlow(isWalletBackedUp);
  };
};

export const registerOnBackendAction = () => {
  return async (dispatch: Function, getState: () => Object, api: Object) => {
    const {
      wallet: {
        data: walletData,
        onboarding: { apiUser },
        backupStatus: { isBackedUp, isImported },
      },
    } = getState();
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: REGISTERING,
    });
    let { user } = await storage.get('user');
    if (apiUser.username) {
      user = apiUser;
    }
    await delay(1000);

    const { registrationSucceed, userInfo } = await getTokenWalletAndRegister(
      walletData.privateKey,
      api,
      user,
      dispatch,
    );
    if (!registrationSucceed) { return; }

    await finishRegistration(api, userInfo, dispatch);
    const isWalletBackedUp = isImported || isBackedUp;
    navigateToAppFlow(isWalletBackedUp);
  };
};

export const validateUserDetailsAction = ({ username }: Object) => {
  return async (dispatch: Function, getState: () => Object, api: Object) => {
    const currentState = getState();
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: CHECKING_USERNAME,
    });
    const { mnemonic } = currentState.wallet.onboarding;
    const mnemonicPhrase = generateMnemonicPhrase(mnemonic.original);
    dispatch(generateWalletMnemonicAction(mnemonicPhrase));
    await delay(200);

    api.init();
    const apiUser = await api.usernameSearch(username);
    const usernameExists = apiUser.username === username;
    const inappropriateUsername = apiUser.status === 400 && apiUser.message === INAPPROPRIATE_USERNAME;
    let usernameStatus = usernameExists ? USERNAME_EXISTS : USERNAME_OK;
    if (apiUser.status === 400 && apiUser.message === INAPPROPRIATE_USERNAME) {
      usernameStatus = INVALID_USERNAME;
    }

    dispatch({
      type: SET_API_USER,
      payload: usernameExists || inappropriateUsername ? apiUser : { username },
    });
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: usernameStatus,
    });
  };
};

export function restoreAccessTokensAction(walletId: string) {
  return async (dispatch: Function, getState: () => Object, api: Object) => {
    const restoredAccessTokens = [];
    const userAccessTokens = await api.fetchAccessTokens(walletId);

    // get connectionRequestedEvent & connectionAcceptedEvent notifications
    const types = [
      TYPE_RECEIVED,
      TYPE_ACCEPTED,
    ];
    const rawNotifications = await api.fetchNotifications(walletId, types.join(' '));
    if (!rawNotifications.length) return;

    const notifications = rawNotifications
      .map(({ payload: { msg }, createdAt }) => ({ ...JSON.parse(msg), createdAt }))
      .map(({ senderUserData, type, createdAt }) => ({ ...senderUserData, type, createdAt }))
      .sort((a, b) => b.createdAt - a.createdAt);

    // split into groups
    let receivedConnectionRequests = notifications.filter(notification => notification.type === TYPE_RECEIVED);
    let sentConnectionRequests = notifications.filter(notification => notification.type === TYPE_ACCEPTED);

    // remove duplicates
    receivedConnectionRequests = uniqBy(receivedConnectionRequests, 'id');
    sentConnectionRequests = uniqBy(sentConnectionRequests, 'id');

    userAccessTokens.forEach(token => {
      // check in received connection requests
      let found = receivedConnectionRequests.find(({ id }) => id === token.contactId);

      // not found? check in sent connection requests
      if (!found) {
        found = sentConnectionRequests.find(({ id }) => id === token.contactId);
      }

      // can't find again? then skip this connection
      if (!found) return;

      restoredAccessTokens.push({
        myAccessToken: token.accessKey,
        userId: token.contactId,
        userAccessToken: found.connectionKey,
      });
    });
    await dispatch({
      type: UPDATE_ACCESS_TOKENS,
      payload: restoredAccessTokens,
    });
    await dispatch(saveDbAction('accessTokens', { accessTokens: restoredAccessTokens }, true));
  };
}
