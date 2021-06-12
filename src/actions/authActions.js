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

import { Linking } from 'react-native';
import { NavigationActions } from 'react-navigation';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import t from 'translations/translate';

// constants
import {
  SET_WALLET,
  SET_WALLET_ERROR,
  SET_WALLET_IS_DECRYPTING,
  RESET_WALLET_ERROR,
  SET_WALLET_IS_CHANGING_PIN,
} from 'constants/walletConstants';
import {
  APP_FLOW,
  AUTH_FLOW,
  ONBOARDING_FLOW,
  MAIN_FLOW,
  PIN_CODE_UNLOCK,
  LOGOUT_PENDING,
  TUTORIAL_FLOW,
} from 'constants/navigationConstants';
import { SET_USER } from 'constants/userConstants';
import { RESET_APP_STATE } from 'constants/authConstants';
import { UPDATE_SESSION } from 'constants/sessionConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { SET_CACHED_URLS } from 'constants/cacheConstants';

// utils
import { delay, reportLog, reportOrWarn } from 'utils/common';
import { getSaltedPin, decryptWallet, constructWalletFromPrivateKey } from 'utils/wallet';
import { clearWebViewCookies } from 'utils/webview';
import {
  setKeychainDataObject,
  resetKeychainDataObject,
  getWalletFromPkByPin,
  canLoginWithPkFromPin,
} from 'utils/keychain';
import { isSupportedBlockchain } from 'utils/blockchainNetworks';
import {
  findFirstArchanovaAccount,
  findFirstEtherspotAccount,
} from 'utils/accounts';
import { isTest } from 'utils/environment';

// services
import Storage from 'services/storage';
import { navigate, getNavigationState, getNavigationPathAndParamsState } from 'services/navigation';
import { firebaseIid, firebaseCrashlytics, firebaseMessaging } from 'services/firebase';
import etherspotService from 'services/etherspot';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';

// actions
import { saveDbAction } from './dbActions';
import { setupSentryAction } from './appActions';
import { initOnLoginArchanovaAccountAction } from './accountsActions';
import {
  encryptAndSaveWalletAction,
  checkForWalletBackupToastAction,
  updatePinAttemptsAction,
} from './walletActions';
import { fetchTransactionsHistoryAction } from './historyActions';
import { setAppThemeAction, initialDeeplinkExecutedAction, setAppLanguageAction } from './appSettingsActions';
import { setActiveBlockchainNetworkAction } from './blockchainNetworkActions';
import { loadRemoteConfigWithUserPropertiesAction } from './remoteConfigActions';
import { executeDeepLinkAction } from './deepLinkActions';
import {
  checkIfKeyBasedWalletHasPositiveBalanceAction,
  checkKeyBasedAssetTransferTransactionsAction,
} from './keyBasedAssetTransferActions';
import { setSessionTranslationBundleInitialisedAction } from './sessionActions';
import {
  importEtherspotAccountsAction,
  refreshEtherspotAccountsAction,
  initEtherspotServiceAction,
} from './etherspotActions';
import { setEnsNameIfNeededAction } from './ensRegistryActions';
import { getTutorialDataAction } from './cmsActions';
import { fetchAllAccountsTotalBalancesAction } from './assetsActions';
import { finishOnboardingAction } from './onboardingActions';


const storage = Storage.getInstance('db');

export const updateFcmTokenAction = () => {
  return async (dispatch: Dispatch) => {
    const fcmToken = await firebaseMessaging.getToken().catch(e => {
      // We was unable to fetch the FCM token.
      reportLog(`Unable to fetch Firebase FCM token: ${e.message}`, e);
      return null;
    });
    if (!fcmToken) return;

    dispatch({ type: UPDATE_SESSION, payload: { fcmToken } });
  };
};

/**
 * ### IMPORTANT ###
 * If you plan to use any method within loginAction that calls
 * Pillar Wallet SDK API please make sure you wait until it completes
 * as first method might also perform tokens refresh during the request
 */
export const loginAction = (
  pin: ?string,
  privateKey: ?string,
  onLoginSuccess: ?Function,
  useBiometrics?: ?boolean,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      appSettings: {
        data: {
          blockchainNetwork, useBiometrics: biometricsSetting, initialDeeplinkExecuted, hasSeenTutorial,
        },
      },
      session: { data: { isOnline } },
      accounts: { data: accounts },
    } = getState();

    dispatch({ type: UPDATE_SESSION, payload: { isAuthorizing: true } });

    try {
      let wallet;

      dispatch({ type: SET_WALLET_IS_DECRYPTING });

      const keychainLogin = await canLoginWithPkFromPin(!!biometricsSetting);
      if (pin && keychainLogin) {
        wallet = await getWalletFromPkByPin(pin);
      } else if (pin) {
        const { wallet: encryptedWallet } = await storage.get('wallet');
        await delay(100);
        const saltedPin = await getSaltedPin(pin, dispatch);
        wallet = await decryptWallet(encryptedWallet, saltedPin);
        // no further code will be executed if pin is wrong
        // migrate older users for keychain access OR fallback for biometrics login
        const keychainDataObject = {
          pin,
          privateKey: wallet.privateKey,
          mnemonic: wallet?.mnemonic?.phrase || '',
        };
        await setKeychainDataObject(keychainDataObject, useBiometrics);
      } else if (privateKey) {
        wallet = constructWalletFromPrivateKey(privateKey);
      } else {
        // nothing provided, invalid login
        throw new Error();
      }

      const { user = {} } = await storage.get('user');

      const decryptedPrivateKey = wallet?.privateKey;
      if (!decryptedPrivateKey) {
        reportLog('Unable to get wallet private key', { user });
        throw new Error();
      }

      dispatch({ type: SET_USER, payload: user });

      const { address } = wallet;
      const unlockedWallet = { address };

      // execute login success callback
      if (onLoginSuccess) {
        const rawPrivateKey = decryptedPrivateKey.indexOf('0x') === 0
          ? decryptedPrivateKey.slice(2)
          : decryptedPrivateKey;
        await onLoginSuccess(rawPrivateKey);
      }

      if (isEmpty(accounts)) {
        // complete registration, this can happen due offline
        dispatch({ type: SET_WALLET, payload: { ...unlockedWallet, privateKey: decryptedPrivateKey } });
        await dispatch(finishOnboardingAction());
      } else {
        dispatch({ type: SET_WALLET, payload: unlockedWallet });
      }

      // Archanova init flow
      const archanovaAccount = findFirstArchanovaAccount(accounts);
      if (archanovaAccount) {
        await dispatch(initOnLoginArchanovaAccountAction(decryptedPrivateKey));
      }

      // init Etherspot SDK
      await dispatch(updateFcmTokenAction());
      await dispatch(initEtherspotServiceAction(decryptedPrivateKey));

      /**
       * set Ethereum network as active if we disable feature flag
       * or end beta testing program while user has set BTC as active network
       */
      const revertToDefaultNetwork = !isSupportedBlockchain(blockchainNetwork);
      if (revertToDefaultNetwork || !blockchainNetwork) {
        dispatch(setActiveBlockchainNetworkAction(BLOCKCHAIN_NETWORK_TYPES.ETHEREUM));
      }

      if (isOnline) {
        // Dispatch action to try and get the latest remote config values...
        dispatch(loadRemoteConfigWithUserPropertiesAction());

        // create etherspot account if does not exist, this also applies as migration from old key based wallets
        const etherspotAccount = findFirstEtherspotAccount(accounts);
        if (!etherspotAccount) {
          await dispatch(importEtherspotAccountsAction()); // imports and sets as active
        } else {
          await dispatch(refreshEtherspotAccountsAction());
        }

        dispatch(setEnsNameIfNeededAction());

        dispatch(checkIfKeyBasedWalletHasPositiveBalanceAction());
        dispatch(checkKeyBasedAssetTransferTransactionsAction());
        dispatch(fetchAllAccountsTotalBalancesAction());
      }

      dispatch(checkForWalletBackupToastAction());

      // user is registered
      if (isOnline) {
        dispatch(fetchTransactionsHistoryAction());
        firebaseCrashlytics.setUserId(user.username);
      }

      dispatch(updatePinAttemptsAction(false));

      if (!__DEV__) {
        dispatch(setupSentryAction(user, wallet));
      }

      // TODO: do we actually need getNavigationPathAndParamsState check at all?
      const pathAndParams = getNavigationPathAndParamsState();
      if (!pathAndParams && !isTest) { // do not execute check on test instance
        reportLog('loginAction failed: no pathAndParams');
        return;
      }

      const { lastActiveScreen, lastActiveScreenParams } = getNavigationState();
      const navigateToLastActiveScreen = NavigationActions.navigate({
        // current active screen will be always AUTH_FLOW due to login/logout
        routeName: lastActiveScreen || MAIN_FLOW,
        params: lastActiveScreenParams,
      });
      if (!hasSeenTutorial) await dispatch(getTutorialDataAction());
      const { onboarding: { tutorialData } } = getState();

      const navigateToAppAction = NavigationActions.navigate({
        routeName: APP_FLOW,
        params: {},
        action: tutorialData ? NavigationActions.navigate({ routeName: TUTORIAL_FLOW }) : navigateToLastActiveScreen,
      });

      if (!initialDeeplinkExecuted) {
        Linking.getInitialURL()
          .then(url => {
            if (url) dispatch(executeDeepLinkAction(url));
          })
          .catch(e => reportLog(`Could not get initial deeplink URL: ${e.message}`, e));
        dispatch(initialDeeplinkExecutedAction());
      }

      navigate(navigateToAppAction);
    } catch (e) {
      reportLog(`An error occurred whilst trying to complete auth actions: ${e.errorMessage}`, e);
      dispatch(updatePinAttemptsAction(true));
      dispatch({
        type: SET_WALLET_ERROR,
        payload: t('auth:error.invalidPin.default'),
      });
    }

    dispatch({ type: UPDATE_SESSION, payload: { isAuthorizing: false } });
  };
};

export const checkAuthAction = (
  pin: ?string,
  privateKey: ?string,
  onValidPin?: Function,
  withMnemonic: boolean = false,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { appSettings: { data: { useBiometrics } } } = getState();
    dispatch({ type: SET_WALLET_IS_DECRYPTING });
    try {
      let wallet;
      // fallback if biometrics check fails, or is rejected by user
      if (pin && useBiometrics) {
        const { wallet: encryptedWallet } = await storage.get('wallet');
        await delay(100);
        const saltedPin = await getSaltedPin(pin, dispatch);
        wallet = await decryptWallet(encryptedWallet, saltedPin);
      } else if (pin) {
        wallet = await getWalletFromPkByPin(pin, withMnemonic);
      } else if (privateKey) {
        wallet = constructWalletFromPrivateKey(privateKey);
      }
      if (wallet) {
        dispatch({
          type: SET_WALLET,
          payload: { address: wallet.address },
        });
        if (onValidPin) {
          onValidPin(pin, wallet);
        }
        return;
      }
    } catch (e) {
      reportOrWarn('Error constructing the wallet object', e, 'error');
    }
    dispatch({
      type: SET_WALLET_ERROR,
      payload: t('auth:error.invalidPin.default'),
    });
  };
};

export const changePinAction = (newPin: string, currentPin: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: SET_WALLET_IS_CHANGING_PIN, payload: true });

    const { wallet: encryptedWallet } = await storage.get('wallet');
    const { appSettings: { data: { useBiometrics } } } = getState();
    const backupStatus = get(encryptedWallet, 'backupStatus', {});


    dispatch({ type: SET_WALLET_IS_DECRYPTING, payload: true });

    const currentSaltedPin = await getSaltedPin(currentPin, dispatch);
    const wallet = await decryptWallet(encryptedWallet, currentSaltedPin);

    dispatch({ type: SET_WALLET_IS_DECRYPTING, payload: false });

    await dispatch(encryptAndSaveWalletAction(newPin, wallet, backupStatus, useBiometrics));

    dispatch({ type: SET_WALLET_IS_CHANGING_PIN, payload: false });
  };
};

export const resetIncorrectPasswordAction = () => ({ type: RESET_WALLET_ERROR });

export const lockScreenAction = (onLoginSuccess?: Function, errorMessage?: string) => {
  return () => {
    navigate(NavigationActions.navigate({
      routeName: AUTH_FLOW,
      params: {},
      action: NavigationActions.navigate({
        routeName: PIN_CODE_UNLOCK,
        params: {
          onLoginSuccess,
          errorMessage,
          forcePin: true,
        },
      }),
    }));
  };
};

export const resetAppStateAction = (stateAfterReset: Object) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const {
      appSettings: {
        data: {
          localisation: savedLocalisation,
          themeType: savedThemeType,
        },
      },
      cache: { cachedUrls },
    } = getState();

    dispatch({ type: RESET_APP_STATE, payload: stateAfterReset });

    // set and store theme after reset
    dispatch(setAppThemeAction(savedThemeType));

    // manage language settings (from onboarding) as those are overwritten
    if (savedLocalisation && savedLocalisation.activeLngCode) {
      const { activeLngCode } = savedLocalisation;
      dispatch(setAppLanguageAction(activeLngCode));
    }

    // app level cached urls
    if (cachedUrls) {
      dispatch({ type: SET_CACHED_URLS, payload: cachedUrls });
      dispatch(saveDbAction('cachedUrls', { cachedUrls }));
    }
  };
};

export const resetAppServicesAction = () => {
  return async () => {
    // reset firebase fcm
    await firebaseIid
      .delete()
      .catch(e => reportLog(`Could not delete the Firebase ID when resetting app state: ${e.message}`, e));

    // reset storage, but restore previously set env
    const env = await storage.get('environment');
    await storage.removeAll();
    if (env) await storage.save('environment', env, true);

    await etherspotService.logout();

    // reset data stored in keychain
    await resetKeychainDataObject();

    // reset app webview's cookies
    clearWebViewCookies();
  };
};

export const logoutAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    // show logout pending screen
    navigate(NavigationActions.navigate({ routeName: LOGOUT_PENDING }));

    // reset services
    await dispatch(resetAppServicesAction());

    // reset reducer state
    const {
      isOnline,
      translationsInitialised,
      fallbackLanguageVersion,
      sessionLanguageCode,
      sessionLanguageVersion,
    } = getState().session.data; // keep these session values state after reset

    dispatch(resetAppStateAction({
      session: {
        data: {
          isOnline,
          translationsInitialised,
          fallbackLanguageVersion,
          sessionLanguageCode,
          sessionLanguageVersion,
        },
      },
    }));

    // is cleaned up so we would not blind users after they delete wallet :)

    // leave translation initialised flag in place
    if (getState()?.session?.data?.translationsInitialised) dispatch(setSessionTranslationBundleInitialisedAction());
    navigate(NavigationActions.navigate({ routeName: ONBOARDING_FLOW }));
  };
};
