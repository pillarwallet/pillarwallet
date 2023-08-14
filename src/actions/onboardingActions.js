/* eslint-disable no-template-curly-in-string */
/* eslint-disable i18next/no-literal-string */
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
import { ethers } from 'ethers';
import { NavigationActions } from 'react-navigation';
import t from 'translations/translate';

// constants
import { SET_WALLET, UPDATE_WALLET_BACKUP_STATUS } from 'constants/walletConstants';
import { APP_FLOW, TUTORIAL_FLOW, HOME, WELCOME_BACK } from 'constants/navigationConstants';
import { SET_USER } from 'constants/userConstants';
import { UPDATE_SESSION } from 'constants/sessionConstants';
import {
  RESET_ONBOARDING,
  SET_FINISHING_ONBOARDING,
  SET_IMPORTING_WALLET,
  SET_ONBOARDING_ERROR,
  SET_ONBOARDING_PIN_CODE,
  SET_ONBOARDING_USER,
  SET_ONBOARDING_USERNAME_REGISTRATION_FAILED,
  SET_ONBOARDING_WALLET,
  SET_REGISTERING_USER,
  SET_NEW_USER,
  SET_VIEWED_RECEIVE_TOKENS_WARNING,
  SET_FETCHING,
  SET_LOADING_MESSAGE,
  SET_BIOMETIC_STATUS,
} from 'constants/onboardingConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { CHAIN } from 'constants/chainConstants';
import { NFT_FLAG } from 'constants/assetsConstants';

// components
import Toast from 'components/Toast';

// utils
import { generateMnemonicPhrase } from 'utils/wallet';
import { reportErrorLog, logBreadcrumb, getEnsPrefix, extractUsernameFromEnsName } from 'utils/common';
import { getAccountEnsName, findFirstEtherspotAccount } from 'utils/accounts';
import { isLogV2AppEvents } from 'utils/environment';

// services
import Storage from 'services/storage';
import { navigate } from 'services/navigation';
import { firebaseMessaging, firebaseRemoteConfig } from 'services/firebase';
import { getExistingServicesAccounts, isUsernameTaken } from 'services/onboarding';
import etherspotService from 'services/etherspot';

// actions
import { importArchanovaAccountsIfNeededAction, managePPNInitFlagAction } from 'actions/smartWalletActions';
import { saveDbAction } from 'actions/dbActions';
import { checkForWalletBackupToastAction, encryptAndSaveWalletAction } from 'actions/walletActions';
import { fetchTransactionsHistoryAction } from 'actions/historyActions';
import { logEventAction } from 'actions/analyticsActions';
import { addMissingWalletEventsIfNeededAction } from 'actions/walletEventsActions';
import { loadRemoteConfigWithUserPropertiesAction } from 'actions/remoteConfigActions';
import { fetchAssetsRatesAction } from 'actions/ratesActions';
import {
  resetAppServicesAction,
  resetAppStateAction,
  updateFcmTokenAction,
  resetAndStartImportWalletAction,
} from 'actions/authActions';
import { checkIfKeyBasedWalletHasPositiveBalanceAction } from 'actions/keyBasedAssetTransferActions';
import {
  importEtherspotAccountsAction,
  initEtherspotServiceAction,
  fetchDefaultTokensRates,
} from 'actions/etherspotActions';
import {
  fetchSupportedAssetsAction,
  fetchOfflineLocalAssets,
  fetchAllAccountsTotalBalancesAction,
  fetchAllAccountsAssetsBalancesAction,
} from 'actions/assetsActions';
import { fetchTutorialDataIfNeededAction, bannerDataAction } from 'actions/cmsActions';
import { initialDeepLinkExecutedAction } from 'actions/appSettingsActions';
import { addAccountAction, deployAccounts } from 'actions/accountsActions';
import {
  setEstimatingTransactionAction,
  setTransactionsEstimateErrorAction,
  setTransactionsEstimateFeeAction,
} from 'actions/transactionEstimateActions';

// Selectors
import { accountsSelector } from 'selectors';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';

export const setupAddressAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    logBreadcrumb('onboarding', 'setupAddressAction: dispatching SET_REGISTERING_USER');
    dispatch({ type: SET_REGISTERING_USER, payload: true });

    const {
      wallet: { data: wallet },
      session: {
        data: { isOnline },
      },
    } = getState();

    logBreadcrumb('onboarding', 'setupAddressAction: checking for privateKey');
    const privateKey = wallet?.privateKey;
    if (!privateKey) {
      logBreadcrumb('onboarding', 'setupAddressAction: failed: no privateKey');
      logBreadcrumb('onboarding', 'setupAddressAction: dispatching SET_REGISTERING_USER');
      dispatch({ type: SET_REGISTERING_USER, payload: false });
      return;
    }

    logBreadcrumb('onboarding', 'setupAddressAction: checking user is online');
    if (isOnline) {
      logBreadcrumb('onboarding', 'setupAddressAction: user is online, registering for FCM Remote Notifications');
      // we us FCM notifications so we must register for FCM, not regular native Push-Notifications
      await firebaseMessaging.registerForRemoteNotifications().catch((error) => {
        logBreadcrumb('onboarding', 'setupAddressAction: firebaseMessaging.registerForRemoteNotifications failed', {
          error,
        });
      });
      await firebaseMessaging.requestPermission().catch(() => null);

      logBreadcrumb('onboarding', 'setupAddressAction: user is online, getting fcmToken for firebase messaging');
      const fcmToken = await firebaseMessaging.getToken().catch((error) => {
        reportErrorLog('firebaseMessaging.getToken failed', { error });
        return null;
      });

      logBreadcrumb('onboarding', 'setupAddressAction: dispatching UPDATE_SESSION');
      dispatch({ type: UPDATE_SESSION, payload: { fcmToken } });

      logBreadcrumb('onboarding', 'setupAddressAction: dispatching logEventAction: wallet created');
      dispatch(logEventAction('wallet_created'));
      isLogV2AppEvents() && dispatch(logEventAction('v2_account_created'));
    }

    logBreadcrumb('onboarding', 'setupAddressAction: dispatching SET_REGISTERING_USER');
    dispatch({ type: SET_REGISTERING_USER, payload: false });
  };
};

export const setupUserAction = (username: ?string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    // eslint-disable-next-line i18next/no-literal-string
    logBreadcrumb('onboarding', 'setupUserAction: checking for username');
    if (!username) {
      logBreadcrumb('onboarding', 'setupUserAction failed: no username');
      return;
    }

    logBreadcrumb('onboarding', 'setupUserAction: dispatching SET_REGISTERING_USER');
    dispatch({ type: SET_REGISTERING_USER, payload: true });

    logBreadcrumb('onboarding', 'setupUserAction: dispatching SET_ONBOARDING_USERNAME_REGISTRATION_FAILED');
    dispatch({ type: SET_ONBOARDING_USERNAME_REGISTRATION_FAILED, payload: false }); // reset

    const {
      wallet: { data: wallet },
      session: {
        data: { isOnline },
      },
    } = getState();

    // save for future onboarding retry in case anything fails or is offline
    const user = { username };
    logBreadcrumb('onboarding', 'setupUserAction: dispatching saveDbAction', user);
    await dispatch(saveDbAction('user', { user }, true));

    logBreadcrumb('onboarding', 'setupUserAction: checking for privateKey while setupUserAction');
    const privateKey = wallet?.privateKey;
    if (!privateKey) {
      logBreadcrumb('onboarding', 'setupUserAction: failed: no privateKey', { username });
      logBreadcrumb('onboarding', 'setupUserAction: dispatching SET_REGISTERING_USER');
      dispatch({ type: SET_REGISTERING_USER, payload: false });
      return;
    }

    logBreadcrumb('onboarding', 'setupUserAction: checking user is online');
    if (isOnline) {
      logBreadcrumb('onboarding', 'setupUserAction: user is online, registering for FCM Remote Notifications');
      // we us FCM notifications so we must register for FCM, not regular native Push-Notifications
      await firebaseMessaging.registerDeviceForRemoteMessages().catch((error) => {
        reportErrorLog('firebaseMessaging.registerForRemoteNotifications failed', { error });
      });
      await firebaseMessaging.requestPermission().catch(() => null);

      logBreadcrumb('onboarding', 'setupUserAction: user is online, getting fcmToken for firebase messaging');
      const fcmToken = await firebaseMessaging.getToken().catch((error) => {
        reportErrorLog('firebaseMessaging.getToken failed', { error });
        return null;
      });

      // save updated
      logBreadcrumb('onboarding', 'setupUserAction: saving updated user info in DB');
      dispatch(saveDbAction('user', { user }, true));

      logBreadcrumb('onboarding', 'setupUserAction: dispatching UPDATE_SESSION');
      dispatch({ type: UPDATE_SESSION, payload: { fcmToken } });

      logBreadcrumb('onboarding', 'setupUserAction: dispatching logEventAction: wallet created');
      dispatch(logEventAction('wallet_created'));
      isLogV2AppEvents() && dispatch(logEventAction('v2_account_created'));
    }

    logBreadcrumb('onboarding', 'setupUserAction: dispatching SET_USER');
    dispatch({ type: SET_USER, payload: user });

    logBreadcrumb('onboarding', 'setupUserAction: dispatching SET_REGISTERING_USER');
    dispatch({ type: SET_REGISTERING_USER, payload: false });
  };
};

export const setupWalletAction = (enableBiometrics?: boolean) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      onboarding: {
        pinCode,
        wallet: importedWallet, // wallet was already added in import step
      },
    } = getState();

    logBreadcrumb('onboarding', 'setupWalletAction: checking for pinCode');
    if (!pinCode) {
      logBreadcrumb('onboarding', 'setupWalletAction failed: no pinCode');
      return;
    }

    const isImported = !!importedWallet;

    logBreadcrumb('onboarding', 'setupWalletAction: creating new mnemonic if importedWallet is not present');
    // will return new mnemonic if importedWallet is not present
    const mnemonic = importedWallet?.mnemonic || generateMnemonicPhrase();

    // create wallet object
    const ethersWallet = ethers.Wallet.fromMnemonic(mnemonic);

    // raw private key will be removed from reducer once registration finishes
    const { address, privateKey } = ethersWallet;

    logBreadcrumb('onboarding', 'setupWalletAction: dispatching SET_WALLET');
    dispatch({ type: SET_WALLET, payload: { address, privateKey } });

    logBreadcrumb('onboarding', 'setupWalletAction: checking for recovery pending and backup status');
    const backupStatus = { isImported, isBackedUp: !!isImported };

    // dispatch to reducer only, will be stored with encryptAndSaveWalletAction
    logBreadcrumb('onboarding', 'setupWalletAction: dispatching UPDATE_WALLET_BACKUP_STATUS');
    dispatch({ type: UPDATE_WALLET_BACKUP_STATUS, payload: backupStatus });

    // encrypt and store
    logBreadcrumb('onboarding', 'setupWalletAction: dispatching encryptAndSaveWalletAction');
    await dispatch(encryptAndSaveWalletAction(pinCode, ethersWallet, backupStatus, enableBiometrics));

    logBreadcrumb('onboarding', 'setupWalletAction: dispatching saveDbAction for saving app settings');
    dispatch(saveDbAction('app_settings', { appSettings: { wallet: +new Date() } }));
  };
};

export const walletSetupAction = (enableBiometrics?: boolean) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      onboarding: {
        pinCode,
        wallet: importedWallet, // wallet was already added in import step
        user: onboardingUsername,
        isNewUser: isNewUserState,
      },
    } = getState();

    dispatch({ type: SET_BIOMETIC_STATUS, payload: enableBiometrics });

    const storage = Storage.getInstance('db');

    const viewedReceiveTokensWarningDb = storage.get('viewed_receive_tokens_warning');
    logBreadcrumb('onboarding', 'walletSetupAction: checking for warning viewed', viewedReceiveTokensWarningDb);
    if (viewedReceiveTokensWarningDb?.viewedReceiveTokensWarning) {
      logBreadcrumb(
        'walletSetupAction',
        'flagging warning as viewed',
        viewedReceiveTokensWarningDb.viewedReceiveTokensWarning,
      );
      dispatch(setViewedReceiveTokensWarning(viewedReceiveTokensWarningDb.viewedReceiveTokensWarning));
    }

    dispatch({ type: SET_LOADING_MESSAGE, payload: t('onboardingLoaders.initEtherspot') });
    const isNewUserDb = await storage.get('is_new_user');
    const isNewUser = !!isNewUserDb?.isNewUser ?? !!isNewUserState;

    logBreadcrumb('onboarding', 'walletSetupAction: checking for pinCode');
    if (!pinCode) {
      logBreadcrumb('onboarding', 'walletSetupAction failed: no pinCode');
      dispatch({ type: SET_FETCHING, payload: false });
      dispatch({ type: SET_LOADING_MESSAGE, payload: '' });
      return;
    }

    dispatch({ type: SET_FETCHING, payload: true });
    dispatch({ type: SET_LOADING_MESSAGE, payload: t('onboardingLoaders.initEtherspot') });

    const isImported = !!importedWallet;

    // flag as a new user (not using archanova services)
    if (!isImported || isNewUser) {
      logBreadcrumb('onboarding', 'walletSetupAction: flagging account as a new user');
      dispatch({ type: SET_NEW_USER, payload: true });
      dispatch(saveDbAction('is_new_user', { isNewUser: true }));
    } else logBreadcrumb('onboarding', 'walletSetupAction: importing wallet');

    logBreadcrumb('onboarding', 'walletSetupAction: creating new mnemonic if importedWallet is not present');
    // will return new mnemonic if importedWallet is not present
    const mnemonic = importedWallet?.mnemonic || generateMnemonicPhrase();

    // create wallet object
    const ethersWallet = ethers.Wallet.fromMnemonic(mnemonic);

    // raw private key will be removed from reducer once registration finishes
    const { address, privateKey } = ethersWallet;

    dispatch(saveDbAction('wallet', { wallet: { data: { address } } }));
    logBreadcrumb('onboarding', 'walletSetupAction: dispatching SET_WALLET');
    dispatch({ type: SET_WALLET, payload: { address, privateKey } });
    dispatch({ type: SET_USER, payload: onboardingUsername });

    logBreadcrumb('onboarding', 'walletSetupAction: checking for recovery pending and backup status');
    const backupStatus = { isImported, isBackedUp: !!isImported };

    // dispatch to reducer only, will be stored with encryptAndSaveWalletAction
    logBreadcrumb('onboarding', 'walletSetupAction: dispatching UPDATE_WALLET_BACKUP_STATUS');
    dispatch({ type: UPDATE_WALLET_BACKUP_STATUS, payload: backupStatus });

    dispatch({ type: SET_LOADING_MESSAGE, payload: t('onboardingLoaders.encryptingKeys') });
    // encrypt and store
    logBreadcrumb('onboarding', 'walletSetupAction: dispatching encryptAndSaveWalletAction');
    await dispatch(encryptAndSaveWalletAction(pinCode, ethersWallet, backupStatus, enableBiometrics));

    logBreadcrumb('onboarding', 'walletSetupAction: dispatching saveDbAction for saving app settings');
    dispatch(saveDbAction('app_settings', { appSettings: { wallet: +new Date() } }));

    dispatch({ type: SET_LOADING_MESSAGE, payload: t('onboardingLoaders.initEtherspot') });
    if (onboardingUsername) {
      await dispatch(setupUserAction(onboardingUsername?.username));
    } else {
      logBreadcrumb('onboarding', 'walletSetupAction: dispatching setupAddressAction');
      await dispatch(setupAddressAction());
    }

    logBreadcrumb('onboarding', 'walletSetupAction: dispatching setupAppServicesAction');
    await dispatch(setupAppServicesAction(privateKey));

    logBreadcrumb('onboarding', 'walletSetupAction: dispatching initialDeepLinkExecutedAction');
    dispatch(initialDeepLinkExecutedAction());

    dispatch(bannerDataAction());

    dispatch({ type: SET_LOADING_MESSAGE, payload: t('onboardingLoaders.deployingGnosis') });
    logBreadcrumb('onboarding', 'walletSetupAction: dispatching deployAccounts');
    if (!__DEV__) dispatch(deployAccounts());

    logBreadcrumb('onboarding', 'walletSetupAction: completed, dispatching SET_FINISHING_ONBOARDING');
    isLogV2AppEvents() && dispatch(logEventAction('v2_account_sign_up_completed'));
    dispatch({ type: SET_FINISHING_ONBOARDING, payload: false });

    dispatch({ type: SET_LOADING_MESSAGE, payload: t('onboardingLoaders.ready') });

    setTimeout(() => {
      dispatch({ type: SET_FETCHING, payload: false });
      dispatch({ type: SET_LOADING_MESSAGE, payload: '' });
    }, 0);
  };
};

export const setupAppServicesAction = (privateKey: ?string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      wallet: { backupStatus, data: walletData },
      session: {
        data: { isOnline },
      },
      onboarding: { isNewUser: isNewUserState },
    } = getState();

    const storage = Storage.getInstance('db');
    const isNewUserDb = await storage.get('is_new_user');

    const isNewUser = !!isNewUserDb?.isNewUser ?? !!isNewUserState;

    // flag as a new user (not using archanova services)
    if (isNewUser) {
      logBreadcrumb('onboarding', 'walletSetupAction: flagging account as a new user');
      dispatch({ type: SET_NEW_USER, payload: true });
      dispatch(saveDbAction('is_new_user', { isNewUser: true }));
    }

    logBreadcrumb('onboarding', 'setupAppServicesAction: checking for private key');
    if (!privateKey) {
      logBreadcrumb('onboarding', 'setupAppServicesAction failed: no private key');
      return;
    }

    await dispatch(fetchOfflineLocalAssets());

    logBreadcrumb('onboarding', 'onboardingAction.js: checking user is online or not');

    // all the calls below require user to be online
    if (!isOnline) {
      return;
    }

    dispatch({ type: SET_LOADING_MESSAGE, payload: t('onboardingLoaders.initEtherspot') });

    logBreadcrumb('onboarding', 'setupAppServicesAction: dispatching updateFcmTokenAction');
    await dispatch(updateFcmTokenAction());

    // active Etherspot service is required to proceed
    logBreadcrumb('onboarding', 'setupAppServicesAction: dispatching initEtherspotServiceAction');
    await dispatch(initEtherspotServiceAction(privateKey));

    // user might not be registered at this point
    dispatch({ type: SET_LOADING_MESSAGE, payload: t('onboardingLoaders.fetchingTokens') });
    await dispatch(fetchSupportedAssetsAction());

    dispatch({ type: SET_LOADING_MESSAGE, payload: t('onboardingLoaders.creatingAccounts') });
    // create Archanova accounts if needed
    if (!isNewUser) {
      logBreadcrumb('onboarding', 'setupAppServicesAction: dispatching importArchanovaAccountsIfNeededAction');
      await dispatch(importArchanovaAccountsIfNeededAction(privateKey));
    }

    // create Etherspot accounts
    logBreadcrumb('onboarding', 'setupAppServicesAction: dispatching importEtherspotAccountsAction');
    await dispatch(importEtherspotAccountsAction());

    // create key based accounts
    if (walletData?.address) {
      logBreadcrumb('onboarding', 'setupAppServicesAction: dispatching addAccountAction for key based account');
      dispatch(addAccountAction(walletData.address, ACCOUNT_TYPES.KEY_BASED));
    } else {
      logBreadcrumb('onboarding', 'setupAppServicesAction: cannot find key based address');
    }

    if (!isNewUser) {
      dispatch({ type: SET_LOADING_MESSAGE, payload: t('onboardingLoaders.loadingWallet') });
      await dispatch(fetchAllAccountsAssetsBalancesAction());
    }

    // by default fetch default tokens
    dispatch({ type: SET_LOADING_MESSAGE, payload: t('onboardingLoaders.fetchingPrices') });
    logBreadcrumb('onboarding', 'setupAppServicesAction: dispatching fetchDefaultTokensRates');
    dispatch(fetchDefaultTokensRates());

    logBreadcrumb('onboarding', 'setupAppServicesAction: dispatching fetchAllAccountsTotalBalancesAction');
    dispatch(fetchAllAccountsTotalBalancesAction());

    dispatch({ type: SET_LOADING_MESSAGE, payload: t('onboardingLoaders.loadingTxHistory') });
    logBreadcrumb('onboarding', 'setupAppServicesAction: dispatching fetchTransactionsHistoryAction');
    dispatch(fetchTransactionsHistoryAction());

    dispatch({ type: SET_LOADING_MESSAGE, payload: t('onboardingLoaders.fetchingPrices') });
    logBreadcrumb('onboarding', 'setupAppServicesAction: dispatching rates action: fetchAssetsRatesAction');
    await dispatch(fetchAssetsRatesAction());

    logBreadcrumb('onboarding', 'setupAppServicesAction: dispatching managePPNInitFlagAction');
    dispatch(managePPNInitFlagAction());

    // add wallet created / imported events
    logBreadcrumb('onboarding', 'setupAppServicesAction: dispatching getWalletsCreationEventsAction');
    dispatch(addMissingWalletEventsIfNeededAction());

    // if wallet was imported let's check its balance for key based assets migration
    if (backupStatus.isImported) {
      logBreadcrumb(
        'onboarding',
        'setupAppServicesAction: wallet was imported, dispatching checkIfKeyBasedWalletHasPositiveBalanceAction',
      );
      dispatch(checkIfKeyBasedWalletHasPositiveBalanceAction());
    }

    const visibleNFTs = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.APP_NFTS);
    logBreadcrumb('onboarding', 'finishOnboardingAction: dispatching app nfts flag');
    dispatch({ type: NFT_FLAG, payload: visibleNFTs });

    // check if wallet backup warning toast needed, balance can only be retrieved online
    logBreadcrumb('onboarding', 'setupAppServicesAction: dispatching checkForWalletBackupToastAction');
    dispatch(checkForWalletBackupToastAction());

    logBreadcrumb('onboarding', 'setupAppServicesAction: dispatching loadRemoteConfigWithUserPropertiesAction');
    dispatch(loadRemoteConfigWithUserPropertiesAction());
  };
};

export const finishOnboardingAction = (retry?: boolean) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    logBreadcrumb('onboarding', 'finishOnboardingAction: dispatching SET_FINISHING_ONBOARDING');
    dispatch({ type: SET_FINISHING_ONBOARDING, payload: true });

    // reset on retry
    if (retry) {
      logBreadcrumb('onboarding', 'finishOnboardingAction: reset on retry, dispatching SET_ONBOARDING_ERROR');
      dispatch({ type: SET_ONBOARDING_ERROR, payload: null });
    }

    const {
      onboarding: { user: onboardingUser },
      user: { data: user },
      wallet: { data: walletData },
    } = getState();

    logBreadcrumb('onboarding', 'finishOnboardingAction: dispatching setupUserAction');
    await dispatch(setupUserAction(onboardingUser?.username || user?.username));

    logBreadcrumb('onboarding', 'finishOnboardingAction: dispatching setupAppServicesAction');
    await dispatch(setupAppServicesAction(walletData?.privateKey));

    logBreadcrumb('onboarding', 'finishOnboardingAction: checking if there were error at the time of onboarding ');
    const { errorMessage, usernameRegistrationFailed } = getState().onboarding;

    // do not reset onboarding in case there were errors as retry will happen in app flow
    if (!errorMessage && !usernameRegistrationFailed) {
      logBreadcrumb('onboarding', 'finishOnboardingAction: no errors received, dispatching RESET_ONBOARDING');
      dispatch({ type: RESET_ONBOARDING });
    } else {
      logBreadcrumb('finishOnboardingAction', 'errors received retry will happen in application', errorMessage);
    }

    /**
     * initial deep link executed setting is used to prevent deep links from execution before PIN screen,
     * at this point user us authorized and we can let deep links to go through safely
     */
    logBreadcrumb('onboarding', 'finishOnboardingAction: dispatching initialDeepLinkExecutedAction');
    dispatch(initialDeepLinkExecutedAction());

    let routeName = HOME;

    const enableOnboardingTutorial = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.FEATURE_ONBOARDING_TUTORIAL);
    if (enableOnboardingTutorial) {
      logBreadcrumb('onboarding', 'finishOnboardingAction: dispatching fetchTutorialDataIfNeededAction');
      await dispatch(fetchTutorialDataIfNeededAction());
      const {
        onboarding: { tutorialData },
      } = getState();
      if (tutorialData) routeName = TUTORIAL_FLOW;
    }

    // check if tutorial needs to bw shown and navigate accordingly
    logBreadcrumb(
      'onboarding',
      'finishOnboardingAction: checking if tutorial needs to be shown and navigating accordingly',
    );
    navigate(
      NavigationActions.navigate({
        routeName: APP_FLOW,
        params: {},
        action: NavigationActions.navigate({ routeName }),
      }),
    );

    logBreadcrumb('onboarding', 'finishOnboardingAction: completed, dispatching SET_FINISHING_ONBOARDING');
    isLogV2AppEvents() && dispatch(logEventAction('v2_account_sign_up_completed'));
    dispatch({ type: SET_FINISHING_ONBOARDING, payload: false });
  };
};

export const beginOnboardingAction = (enableBiometrics?: boolean) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    // pass current onboarding and some session values to keep after redux state reset
    const {
      onboarding,
      session: {
        data: {
          isOnline,
          translationsInitialised,
          fallbackLanguageVersion,
          sessionLanguageCode,
          sessionLanguageVersion,
        },
      },
    } = getState();

    logBreadcrumb('onboarding', 'beginOnboardingAction: dispatching resetAppStateAction');
    dispatch(
      resetAppStateAction({
        onboarding,
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

    logBreadcrumb('onboarding', 'beginOnboardingAction: dispatching resetAppServicesAction');
    await dispatch(resetAppServicesAction());

    logBreadcrumb('onboarding', 'beginOnboardingAction: dispatching walletSetupAction');
    await dispatch(walletSetupAction(enableBiometrics));
  };
};

export const importWalletFromMnemonicAction = (mnemonicInput: string) => {
  return async (dispatch: Dispatch) => {
    // reset if back was pressed and new mnemonic entered
    dispatch({ type: SET_ONBOARDING_WALLET, payload: null });
    dispatch({ type: SET_ONBOARDING_USER, payload: null });

    logBreadcrumb('onboarding', 'importWalletFromMnemonicAction: dispatching SET_IMPORTING_WALLET');
    dispatch({ type: SET_IMPORTING_WALLET });
    dispatch({ type: SET_NEW_USER, payload: false });
    dispatch({ type: SET_VIEWED_RECEIVE_TOKENS_WARNING, payload: false });
    dispatch(saveDbAction('is_new_user', { isNewUser: false }));
    dispatch(setViewedReceiveTokensWarning(false));

    let importedWallet;
    try {
      importedWallet = ethers.Wallet.fromMnemonic(mnemonicInput);
    } catch (e) {
      // keep error unsent in case it contains mnemonic phrase
    }

    if (!importedWallet) {
      logBreadcrumb(
        'onboarding',
        'importWalletFromMnemonicAction: dispatching SET_ONBOARDING_ERROR',
        t('auth:error.incorrectBackupPhrase.default'),
      );
      dispatch({ type: SET_ONBOARDING_ERROR, payload: t('auth:error.incorrectBackupPhrase.default') });
      return;
    }

    dispatch(resetAndStartImportWalletAction());

    logBreadcrumb('onboarding', 'importWalletFromMnemonicAction: Trying to validate registered user');
    const existingAccounts = await getExistingServicesAccounts(importedWallet.privateKey);
    const existingAccountWithPillarEns = existingAccounts.find((account) => {
      const ensName = getAccountEnsName(account);
      return ensName && ensName.includes(getEnsPrefix());
    });
    const ensName = getAccountEnsName(existingAccountWithPillarEns);

    if (existingAccountWithPillarEns && ensName) {
      const username = extractUsernameFromEnsName(ensName);

      logBreadcrumb(
        'onboarding',
        'importWalletFromMnemonicAction: registered wallet user, dispatching SET_ONBOARDING_USER',
        { username },
      );
      dispatch({ type: SET_ONBOARDING_USER, payload: { username, isExisting: true } });
    } else dispatch({ type: SET_ONBOARDING_USER, payload: { isExisting: true } });

    const {
      mnemonic: { phrase: mnemonic },
      address,
      privateKey,
    } = importedWallet;

    logBreadcrumb('onboarding', 'importWalletFromMnemonicAction: dispatching SET_ONBOARDING_WALLET');
    dispatch({ type: SET_ONBOARDING_WALLET, payload: { mnemonic, address, privateKey } });

    logBreadcrumb('onboarding', 'importWalletFromMnemonicAction: wallet imported from Mnemonic Action');
    dispatch(logEventAction('wallet_imported', { method: 'Words Phrase' }));
    isLogV2AppEvents() && dispatch(logEventAction('v2_account_imported', { method: 'Seed phrase' }));
    navigate(NavigationActions.navigate({ routeName: WELCOME_BACK }));
  };
};

let usernameCheckOfflineToastShown = false;

export const resetUsernameCheckAction = (resetOfflineToast?: boolean) => {
  return (dispatch: Dispatch) => {
    if (resetOfflineToast) usernameCheckOfflineToastShown = false;

    logBreadcrumb('onboarding', 'resetUsernameCheckAction: dispatching SET_ONBOARDING_USER');
    dispatch({ type: SET_ONBOARDING_USER, payload: null });

    logBreadcrumb('onboarding', 'resetUsernameCheckAction: dispatching SET_ONBOARDING_ERROR');
    dispatch({ type: SET_ONBOARDING_ERROR, payload: null });
  };
};

export const resetOnboardingAction = () => ({ type: RESET_ONBOARDING });

export const resetOnboardingAndNavigateAction = (routeName: string, nextRouteName: string) => {
  return (dispatch: Dispatch) => {
    logBreadcrumb('onboarding', 'resetOnboardingAndNavigateAction: dispatching resetOnboardingAction');
    dispatch(resetOnboardingAction());
    navigate(NavigationActions.navigate({ routeName, params: { nextRouteName } }));
  };
};

export const checkUsernameAvailabilityAction = (username: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    logBreadcrumb('onboarding', 'checkUsernameAvailabilityAction: dispatching resetUsernameCheckAction');
    dispatch(resetUsernameCheckAction());

    logBreadcrumb(
      'onboarding',
      'checkUsernameAvailabilityAction: checking user state, if offline proceeding with local registeration',
    );
    // if user is offline then proceed with local registration
    if (!getState()?.session?.data?.isOnline) {
      if (!usernameCheckOfflineToastShown) {
        logBreadcrumb('onboarding', 'checkUsernameAvailabilityAction: showing Toast message user is offline');
        Toast.closeAll(); // just in case another offline toast is showing from welcome screen
        Toast.show({
          message: t('auth:toast.userIsOffline'),
          emoji: 'satellite_antenna',
        });
        usernameCheckOfflineToastShown = true;
      }

      logBreadcrumb('onboarding', 'checkUsernameAvailabilityAction: dispatching SET_ONBOARDING_USER');
      dispatch({
        type: SET_ONBOARDING_USER,
        payload: { username },
      });
      return;
    }

    logBreadcrumb('onboarding', 'checkUsernameAvailabilityAction: searching for username}');
    const usernameTaken = await isUsernameTaken(username);
    if (usernameTaken) {
      logBreadcrumb('onboarding', 'checkUsernameAvailabilityAction failed', t('auth:error.invalidUsername.taken'));
      logBreadcrumb('onboarding', 'checkUsernameAvailabilityAction: dispatching SET_ONBOARDING_ERROR');
      dispatch({
        type: SET_ONBOARDING_ERROR,
        payload: t('auth:error.invalidUsername.taken'),
      });
      return;
    }

    logBreadcrumb('onboarding', 'checkUsernameAvailabilityAction: done, dispatching SET_ONBOARDING_USER', username);
    dispatch({
      type: SET_ONBOARDING_USER,
      payload: { username },
    });
  };
};

export const claimENSNameAction = (username: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const accounts = accountsSelector(getState());

    const etherspotAccount = findFirstEtherspotAccount(accounts);
    if (!etherspotAccount) {
      logBreadcrumb('claimENSNameAction', 'failed: no Etherspot account found');
      return;
    }
    const reserved = await etherspotService.reserveEnsName(username);
    if (!reserved) {
      logBreadcrumb('reserveEtherspotENSNameAction', 'reserveENSName failed', { username });
    } else {
      dispatch({ type: SET_USER, payload: { username } });
      dispatch(saveDbAction('user', { user: { data: { username } } }));
    }
    let errorMessage;
    let feeInfo;
    dispatch(setEstimatingTransactionAction(true));
    try {
      feeInfo = await etherspotService.estimateENSTransactionFee(CHAIN.ETHEREUM);
      dispatch(setEstimatingTransactionAction(false));
      dispatch(setTransactionsEstimateFeeAction(feeInfo));
    } catch (error) {
      errorMessage = error?.message;
    }
    if (!feeInfo || errorMessage) {
      logBreadcrumb('estimateEnsMigrationFromArchanovaToEtherspotAction', 'estimateAccountRawTransactions failed', {
        errorMessage,
      });
      dispatch(setTransactionsEstimateErrorAction(errorMessage || t('toast.transactionFeeEstimationFailed')));
    }
  };
};

export const setOnboardingPinCodeAction = (pinCode: string) => {
  return async (dispatch: Dispatch) => {
    logBreadcrumb('onboarding', 'setOnboardingPinCodeAction: dispatching SET_ONBOARDING_PIN_CODE');
    dispatch({
      type: SET_ONBOARDING_PIN_CODE,
      payload: pinCode,
    });
  };
};

export const resetWalletImportErrorAction = () => {
  return async (dispatch: Dispatch) => {
    logBreadcrumb('onboarding', 'resetWalletImportErrorAction: dispatching SET_ONBOARDING_ERROR');
    dispatch({
      type: SET_ONBOARDING_ERROR,
      payload: null,
    });
  };
};

export const setViewedReceiveTokensWarning = (viewed: boolean) => {
  return async (dispatch: Dispatch) => {
    logBreadcrumb('onboarding', 'setViewedReceiveTokensWarning: dispatching SET_VIEWED_RECEIVE_TOKENS_WARNING', viewed);
    dispatch(saveDbAction('viewed_receive_tokens_warning', { viewedReceiveTokensWarning: viewed }));
    dispatch({
      type: SET_VIEWED_RECEIVE_TOKENS_WARNING,
      payload: viewed,
    });
  };
};
