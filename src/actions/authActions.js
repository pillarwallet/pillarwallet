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
import { NavigationActions } from 'react-navigation';
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
import { RESET_APP_STATE } from 'constants/authConstants';
import { UPDATE_SESSION } from 'constants/sessionConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { SET_CACHED_URLS } from 'constants/cacheConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { NFT_FLAG } from 'constants/assetsConstants';
import { SET_NEW_USER } from 'constants/onboardingConstants';

// utils
import { logBreadcrumb, reportLog } from 'utils/common';
import { decryptWalletFromStorage, getDecryptedWallet } from 'utils/wallet';
import { clearWebViewCookies } from 'utils/webview';
import { resetKeychainDataObject } from 'utils/keychain';
import { isSupportedBlockchain } from 'utils/blockchainNetworks';
import { findFirstArchanovaAccount, findFirstEtherspotAccount, findKeyBasedAccount } from 'utils/accounts';
import { getDeviceUniqueId } from 'utils/device';

// services
import Storage from 'services/storage';
import { navigate, getNavigationState } from 'services/navigation';
import { firebaseAuth, firebaseMessaging, firebaseRemoteConfig } from 'services/firebase';
import etherspotService from 'services/etherspot';
import archanovaService from 'services/archanova';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { OnValidPinCallback } from 'models/Wallet';

// actions
import { saveDbAction } from './dbActions';
import { setupLoggingServicesAction } from './appActions';
import { addAccountAction, initOnLoginArchanovaAccountAction, deployAccounts } from './accountsActions';
import { encryptAndSaveWalletAction, checkForWalletBackupToastAction, updatePinAttemptsAction } from './walletActions';
import { fetchTransactionsHistoryAction } from './historyActions';
import { setAppThemeAction, setAppLanguageAction, setDeviceUniqueIdIfNeededAction } from './appSettingsActions';
import { setActiveBlockchainNetworkAction } from './blockchainNetworkActions';
import { loadRemoteConfigWithUserPropertiesAction } from './remoteConfigActions';
import { checkInitialDeepLinkAction } from './deepLinkActions';
import {
  checkIfKeyBasedWalletHasPositiveBalanceAction,
  checkKeyBasedAssetTransferTransactionsAction,
} from './keyBasedAssetTransferActions';
import { setSessionTranslationBundleInitialisedAction } from './sessionActions';
import { importEtherspotAccountsAction, initEtherspotServiceAction, fetchDefaultTokensRates } from './etherspotActions';
import { setEnsNameIfNeededAction } from './ensRegistryActions';
import { fetchTutorialDataIfNeededAction, bannerDataAction } from './cmsActions';
import { fetchAllAccountsAssetsBalancesAction, fetchAllAccountsTotalBalancesAction } from './assetsActions';
import { finishOnboardingAction, setViewedReceiveTokensWarning } from './onboardingActions';
import { addMissingWalletEventsIfNeededAction } from './walletEventsActions';
import { fetchAllCollectiblesDataAction } from './collectiblesActions';
import { fetchAppsHoldingsAction } from './appsHoldingsActions';

const storage = Storage.getInstance('db');

export const updateFcmTokenAction = () => {
  return async (dispatch: Dispatch) => {
    const fcmToken = await firebaseMessaging.getToken().catch((e) => {
      // We was unable to fetch the FCM token.
      reportLog(`Unable to fetch Firebase FCM token: ${e.message}`, e);
      return null;
    });
    if (!fcmToken) return;

    dispatch({ type: UPDATE_SESSION, payload: { fcmToken } });
  };
};

export const loginAction = (pin: ?string, privateKey: ?string, onLoginSuccess: ?OnValidPinCallback) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      appSettings: {
        data: { blockchainNetwork },
      },
      session: {
        data: { isOnline },
      },
      accounts: { data: accounts },
      user: { data: user },
      onboarding: { bannerData, isNewUser: isNewUserState },
    } = getState();

    const viewedReceiveTokensWarningDb = await storage.get('viewed_receive_tokens_warning');
    logBreadcrumb('loginAction', 'checking if warning viewed', viewedReceiveTokensWarningDb);
    if (viewedReceiveTokensWarningDb?.viewedReceiveTokensWarning) {
      logBreadcrumb(
        'loginAction',
        'flagging warning as viewed',
        viewedReceiveTokensWarningDb.viewedReceiveTokensWarning,
      );
      dispatch(setViewedReceiveTokensWarning(viewedReceiveTokensWarningDb.viewedReceiveTokensWarning));
    }

    const isNewUserDb = await storage.get('is_new_user');
    const isNewUser = !!isNewUserDb?.isNewUser ?? !!isNewUserState;

    // flag as a new user (not using archanova services)
    if (isNewUser) {
      logBreadcrumb('loginAction', 'flagging account as a new user');
      dispatch({ type: SET_NEW_USER, payload: true });
      dispatch(saveDbAction('is_new_user', { isNewUser: true }));
    }

    dispatch({ type: UPDATE_SESSION, payload: { isAuthorizing: true } });

    await dispatch(checkAuthAction(pin, privateKey, onLoginSuccess));

    const wallet = getState().wallet.data;
    if (!wallet) {
      logBreadcrumb('loginAction', 'failed: no wallet', { user });
      dispatch({ type: UPDATE_SESSION, payload: { isAuthorizing: false } });
      return;
    }

    const decryptedPrivateKey = wallet?.privateKey;
    if (!decryptedPrivateKey) {
      logBreadcrumb('loginAction', 'failed: no private key', { user });
      dispatch({ type: UPDATE_SESSION, payload: { isAuthorizing: false } });
      return;
    }

    const { address } = wallet;
    const unlockedWallet = { address };

    if (isEmpty(accounts)) {
      // complete registration, this can happen due offline onboarding
      dispatch({ type: SET_WALLET, payload: { ...unlockedWallet, privateKey: decryptedPrivateKey } });
      await dispatch(finishOnboardingAction());
    } else {
      dispatch({ type: SET_WALLET, payload: unlockedWallet });
    }

    const visibleNFTs = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.APP_NFTS);
    logBreadcrumb('onboarding', 'finishOnboardingAction: dispatching app nfts flag');
    dispatch({ type: NFT_FLAG, payload: visibleNFTs });

    dispatch(setupLoggingServicesAction());
    dispatch(updatePinAttemptsAction(false));

    const { lastActiveScreen, lastActiveScreenParams } = getNavigationState();
    let navigateAction = NavigationActions.navigate({
      // current active screen will be always AUTH_FLOW due to login/logout
      routeName: lastActiveScreen || MAIN_FLOW,
      params: lastActiveScreenParams,
    });

    const enableOnboardingTutorial = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.FEATURE_ONBOARDING_TUTORIAL);
    if (enableOnboardingTutorial) {
      await dispatch(fetchTutorialDataIfNeededAction());
      const {
        onboarding: { tutorialData },
      } = getState();
      if (tutorialData) navigateAction = NavigationActions.navigate({ routeName: TUTORIAL_FLOW });
    }

    if (!bannerData) dispatch(bannerDataAction());

    const navigateToAppAction = NavigationActions.navigate({
      routeName: APP_FLOW,
      params: {},
      action: navigateAction,
    });

    dispatch(checkInitialDeepLinkAction());

    navigate(navigateToAppAction);

    dispatch({ type: UPDATE_SESSION, payload: { isAuthorizing: false } });

    /**
     * set Ethereum network as active if we disable feature flag
     * or end beta testing program while user has set BTC as active network
     */
    // TODO: subject to deprecate?
    const revertToDefaultNetwork = !isSupportedBlockchain(blockchainNetwork);
    if (revertToDefaultNetwork || !blockchainNetwork) {
      dispatch(setActiveBlockchainNetworkAction(BLOCKCHAIN_NETWORK_TYPES.ETHEREUM));
    }

    dispatch(checkForWalletBackupToastAction());
    dispatch(addMissingWalletEventsIfNeededAction());

    // further calls require network connection
    if (!isOnline) return;

    await dispatch(updateFcmTokenAction());

    // init Etherspot SDK
    await dispatch(initEtherspotServiceAction(decryptedPrivateKey));

    // init Archanova SDK if needed
    const archanovaAccount = findFirstArchanovaAccount(accounts);
    if (archanovaAccount) {
      await dispatch(initOnLoginArchanovaAccountAction(decryptedPrivateKey));
    }

    // Dispatch action to try and get the latest remote config values...
    dispatch(loadRemoteConfigWithUserPropertiesAction());

    // create etherspot account if does not exist, this also applies as migration from old key based wallets
    const etherspotAccount = findFirstEtherspotAccount(accounts);
    if (!etherspotAccount) {
      await dispatch(importEtherspotAccountsAction()); // imports and sets as active
    }

    // create key based account if does not exist
    const keyBasedAccount = findKeyBasedAccount(accounts);
    if (!keyBasedAccount) dispatch(addAccountAction(address, ACCOUNT_TYPES.KEY_BASED));

    // by default fetch default tokens
    dispatch(fetchDefaultTokensRates());

    dispatch(fetchTransactionsHistoryAction());
    dispatch(setEnsNameIfNeededAction());
    dispatch(checkIfKeyBasedWalletHasPositiveBalanceAction());
    dispatch(checkKeyBasedAssetTransferTransactionsAction());
    dispatch(fetchAllAccountsTotalBalancesAction());
    dispatch(fetchAllAccountsAssetsBalancesAction());
    dispatch(fetchAllCollectiblesDataAction());
    dispatch(fetchAppsHoldingsAction());
    if (!__DEV__) dispatch(deployAccounts());
  };
};

export const checkAuthAction = (
  pin: ?string,
  decryptedPrivateKey: ?string,
  onValidPin: ?OnValidPinCallback,
  withMnemonic: boolean = false,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      appSettings: {
        data: { useBiometrics },
      },
    } = getState();

    dispatch({ type: SET_WALLET_IS_DECRYPTING });

    const deviceUniqueId = getState().appSettings.data.deviceUniqueId ?? (await getDeviceUniqueId());
    dispatch(setDeviceUniqueIdIfNeededAction(deviceUniqueId));

    let wallet;
    let decryptError;
    try {
      wallet = await getDecryptedWallet(pin, decryptedPrivateKey, deviceUniqueId, useBiometrics, withMnemonic);
    } catch (error) {
      decryptError = error;
    }

    dispatch({ type: SET_WALLET_IS_DECRYPTING, payload: false });

    if (!wallet || decryptError) {
      logBreadcrumb('checkAuthAction', 'failed to get decrypted wallet', { decryptError });
      dispatch({ type: SET_WALLET_ERROR, payload: t('auth:error.invalidPin.default') });
      dispatch(updatePinAttemptsAction(true));
      return;
    }

    const { privateKey, address } = wallet;

    // private key checked and removed on every root navigation component update, make sure it stays this way
    dispatch({ type: SET_WALLET, payload: { privateKey, address } });

    if (onValidPin) onValidPin(pin, wallet);
  };
};

export const changePinAction = (newPin: string, currentPin: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: SET_WALLET_IS_CHANGING_PIN, payload: true });

    const { wallet: encryptedWallet } = await storage.get('wallet');
    const {
      appSettings: {
        data: { useBiometrics },
      },
    } = getState();

    dispatch({ type: SET_WALLET_IS_DECRYPTING, payload: true });

    const deviceUniqueId = getState().appSettings.data.deviceUniqueId ?? (await getDeviceUniqueId());
    dispatch(setDeviceUniqueIdIfNeededAction(deviceUniqueId));

    const wallet = await decryptWalletFromStorage(currentPin, deviceUniqueId);

    dispatch({ type: SET_WALLET_IS_DECRYPTING, payload: false });

    const backupStatus = encryptedWallet?.backupStatus ?? {};
    await dispatch(encryptAndSaveWalletAction(newPin, wallet, backupStatus, useBiometrics));

    dispatch({ type: SET_WALLET_IS_CHANGING_PIN, payload: false });

    // check if 6 digits flag is active
    const { hasSixDigitsPin } = getState().appSettings.data;
    if (!hasSixDigitsPin) return;

    // remove 6 digits pin flag
    dispatch({ type: UPDATE_APP_SETTINGS, payload: { hasSixDigitsPin: false } });
  };
};

export const resetIncorrectPasswordAction = () => ({ type: RESET_WALLET_ERROR });

export const lockScreenAction = (onLoginSuccess: ?OnValidPinCallback, errorMessage?: string) => {
  return () => {
    navigate(
      NavigationActions.navigate({
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
      }),
    );
  };
};

export const resetAppStateAction = (stateAfterReset: Object) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const {
      appSettings: {
        data: { localisation: savedLocalisation, themeType: savedThemeType },
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
    if (firebaseAuth.currentUser) {
      await firebaseAuth.currentUser
        .delete()
        .catch((e) => reportLog(`Could not delete the Firebase ID when resetting app state: ${e.message}`, e));
    }

    // reset storage, but restore previously set env
    const env = await storage.get('environment');
    await storage.removeAll();
    if (env) await storage.save('environment', env, true);

    await etherspotService.logout();
    await archanovaService.reset();

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
    const { isOnline, translationsInitialised, fallbackLanguageVersion, sessionLanguageCode, sessionLanguageVersion } =
      getState().session.data; // keep these session values state after reset

    dispatch(
      resetAppStateAction({
        session: {
          data: {
            isOnline,
            translationsInitialised,
            fallbackLanguageVersion,
            sessionLanguageCode,
            sessionLanguageVersion,
          },
        },
      }),
    );

    // is cleaned up so we would not blind users after they delete wallet :)

    // leave translation initialised flag in place
    if (getState()?.session?.data?.translationsInitialised) dispatch(setSessionTranslationBundleInitialisedAction());
    navigate(NavigationActions.navigate({ routeName: ONBOARDING_FLOW }));
  };
};

export const resetAndStartImportWalletAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    // reset services
    await dispatch(resetAppServicesAction());

    // reset reducer state
    const { isOnline, translationsInitialised, fallbackLanguageVersion, sessionLanguageCode, sessionLanguageVersion } =
      getState().session.data; // keep these session values state after reset

    dispatch(
      resetAppStateAction({
        session: {
          data: {
            isOnline,
            translationsInitialised,
            fallbackLanguageVersion,
            sessionLanguageCode,
            sessionLanguageVersion,
          },
        },
      }),
    );

    // leave translation initialised flag in place
    if (getState()?.session?.data?.translationsInitialised) dispatch(setSessionTranslationBundleInitialisedAction());
  };
};
