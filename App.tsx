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
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import remoteConfig from '@react-native-firebase/remote-config';
import * as Sentry from '@sentry/react-native';
import { getEnv, setupEnv, switchEnvironments } from 'configs/envConfig';
import React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { Linking, Platform, StatusBar, UIManager } from 'react-native';
import { AppearanceProvider } from 'react-native-appearance';
import appsFlyer from 'react-native-appsflyer';
import DeviceInfo from 'react-native-device-info';
import { PlayInstallReferrer } from 'react-native-play-install-referrer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Provider, connect } from 'react-redux';
import styled, { ThemeProvider } from 'styled-components/native';
import t from 'translations/translate';
import 'utils/setup';

import localeConfig from 'configs/localeConfig';
import 'services/localisation/translations';

// actions
import { initAppAndRedirectAction } from 'actions/appActions';
import { handleSystemDefaultThemeChangeAction, setAppThemeAction } from 'actions/appSettingsActions';
import { executeDeepLinkAction } from 'actions/deepLinkActions';
import { changeLanguageAction, updateTranslationResourceOnContextChangeAction } from 'actions/localisationActions';
import {
  startListeningOnOpenNotificationAction,
  stopListeningOnOpenNotificationAction,
} from 'actions/notificationsActions';
import { updateOfflineQueueNetworkStatusAction } from 'actions/offlineApiActions';
import { updateSessionNetworkStatusAction } from 'actions/sessionActions';
import { initWalletConnectSessionsAction } from 'actions/walletConnectSessionsActions';

// constants
import { DARK_THEME, LIGHT_THEME } from 'constants/appSettingsConstants';
import { STAGING } from 'constants/envConstants';
import { INITIAL_REMOTE_CONFIG, REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// components
import Button from 'components/legacy/Button';
import Modal from 'components/Modal';
import PercentsInputAccessoryHolder from 'components/PercentsInputAccessory/PercentsInputAccessoryHolder';
import Root from 'components/Root';
import Spinner from 'components/Spinner';
import Toast from 'components/Toast';
import Walkthrough from 'components/Walkthrough';

// utils
import { logBreadcrumb, reportLog, reportOrWarn } from 'utils/common';
import { log } from 'utils/logger';
import { getActiveRouteName } from 'utils/navigation';
import { getThemeByType } from 'utils/themes';

// services
import { logScreenViewAction } from 'actions/analyticsActions';
import { firebaseRemoteConfig } from 'services/firebase';
import { setRoutesState } from 'services/navigation';

// types
import type { I18n } from 'models/Translations';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Steps } from 'reducers/walkthroughsReducer';

// other
import RootNavigation from 'navigation/rootNavigation';
import { store } from 'src/configureStore';

// redux
import { syncStateWithFirestore } from 'src/redux/actions/firestore-actions';
import { fetchGasThresholds } from 'src/redux/actions/gas-threshold-actions';

const queryClient = new QueryClient();

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const LoadingSpinner = styled(Spinner)`
  padding: 10px;
  align-items: center;
  justify-content: center;
`;

interface Props extends WithTranslation {
  dispatch: Dispatch;
  isFetched: boolean;
  fetchAppSettingsAndRedirect: () => void;
  updateSessionNetworkStatus: (isOnline: boolean) => void;
  updateOfflineQueueNetworkStatus: (isOnline: boolean) => void;
  startListeningOnOpenNotification: () => void;
  stopListeningOnOpenNotification: () => void;
  executeDeepLink: (deepLinkUrl: string) => void;
  activeWalkthroughSteps: Steps;
  themeType: string;
  setAppTheme: (themeType: string) => void;
  isManualThemeSelection: boolean;
  handleSystemDefaultThemeChange: () => void;
  i18n: I18n;
  changeLanguage: (language: string) => void;
  translationsInitialised: boolean;
  updateTranslationResourceOnContextChange: () => void;
  initialDeepLinkExecuted: boolean;
  sessionLanguageVersion: string | null;
  logScreenView: (screenName: string) => void;
  initWalletConnectSessionsWithoutReset: () => void;
  syncReduxStateWithFirestore: () => void;
  reduxFetchGasThresholds: () => void;
  isVisibleModal: boolean;
}

class App extends React.Component<Props, any> {
  removeNetInfoEventListener: NetInfoSubscription;
  offlineToastId: null | string = null;

  constructor(props: Props) {
    super(props);
    if (!__DEV__) {
      const dist = DeviceInfo.getBuildNumber();
      const release = `${DeviceInfo.getBundleId()}@${DeviceInfo.getVersion()}+${dist}`;
      Sentry.init({ dsn: getEnv().SENTRY_DSN, release, dist });
      Sentry.setTags({ environment: getEnv().BUILD_TYPE });
    }
    this.state = {
      env: null,
    };
  }

  // https://reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path
  componentWillUnmount() {
    const { stopListeningOnOpenNotification } = this.props;
    stopListeningOnOpenNotification();
    if (this.removeNetInfoEventListener) {
      this.removeNetInfoEventListener();
      delete this.removeNetInfoEventListener;
    }
    Linking.removeAllListeners('url');
  }

  async componentDidMount() {
    const {
      fetchAppSettingsAndRedirect,
      startListeningOnOpenNotification,
      sessionLanguageVersion,
      updateTranslationResourceOnContextChange,
    } = this.props;

    logBreadcrumb('App.js', 'Setting up environment...');
    const env = await setupEnv();
    log.info('Environment: ', env);
    this.setState({ env });
    logBreadcrumb('App.js', 'Done setting up environment.');

    /**
     * First, we need to set the defaults for Remote Config.
     * This makes the default values immediately available
     * on app load and can be used.
     *
     * @url https://rnfirebase.io/reference/remote-config#setDefaults
     */

    logBreadcrumb('App.js', 'Remote Config: Setting up default values...');
    remoteConfig()
      .setDefaults(INITIAL_REMOTE_CONFIG)
      .then(() => logBreadcrumb('App.js ', 'Remote Config: Defaults loaded and available'))
      .catch((e) => reportOrWarn('Remote Config: An error occurred loading defaults:', e, 'error'));
    logBreadcrumb('App.js', 'Remote Config: Finished setting up default values.');

    logBreadcrumb('App.js', 'Remote Config: Ensuring last activated values are available...');
    remoteConfig()
      .ensureInitialized()
      .then(() => logBreadcrumb('App.js ', 'Remote Config: Defaults loaded and available'))
      .catch((e) => reportOrWarn('Remote Config: An error occurred loading defaults:', e, 'error'));
    logBreadcrumb('App.js', 'Remote Config: Finished ensuring last activated values are available.');

    /**
     * Secondly, we need to activate any remotely fetched values
     * if they exist at all. The values that have been fetched
     * and activated override the default values above (see @url
     * above).
     *
     * @url https://rnfirebase.io/reference/remote-config#activate
     */

    logBreadcrumb('App.js', 'Remote Config: Activating latest values, if any...');
    remoteConfig()
      .activate()
      .then((activationResult) => {
        logBreadcrumb('App.js', `Remote Config: Activation result was ${activationResult}`);
        if (sessionLanguageVersion !== firebaseRemoteConfig.getString(REMOTE_CONFIG.APP_LOCALES_LATEST_TIMESTAMP)) {
          logBreadcrumb('App.js', 'Remote Config: Triggering i18n update...');
          updateTranslationResourceOnContextChange();
        }
      })
      .catch((e) => reportOrWarn('Remote Config: An error occurred while activating:', e));
    logBreadcrumb('App.js', 'Remote Config: Finished activating latest values, if any.');

    /**
     * Next, lets set up AppsFlyer which allows us to monitor user
     * aquisition and attribution.
     */
    logBreadcrumb('App.js', 'AppsFlyer: Running initSdk...');
    appsFlyer.initSdk(
      {
        devKey: getEnv().APPSFLYER_DEVKEY,
        isDebug: __DEV__,
        appId: getEnv().IOS_APP_ID, // iOS only
        onInstallConversionDataListener: true, // Optional
        onDeepLinkListener: true, // Optional
        timeToWaitForATTUserAuthorization: 10, // for iOS 14.5
      },
      (result) => {
        logBreadcrumb('App.js', `AppsFlyer: initSdk completed successfully: ${result}`);
      },
      (error) => reportOrWarn('AppsFlyer reported an error whilst running initSdk', error),
    );

    // GA Install Referrer - get install timestamp, install version, ...
    if (Platform.OS === 'android') {
      PlayInstallReferrer.getInstallReferrerInfo((installReferrerInfo, error) => {
        if (!error) {
          logBreadcrumb('GA Install Referrer: installReferrerInfo', installReferrerInfo);
        } else {
          reportLog('GA Install Referrer: An error occurred getInstallReferrerInfo method', error, 'error');
        }
      });
    }

    // hold the UI and wait until network status finished for later app connectivity checks
    await NetInfo.fetch()
      .then((netInfoState) => this.setOnlineStatus(netInfoState.isInternetReachable))
      .catch(() => null);
    this.removeNetInfoEventListener = NetInfo.addEventListener(this.handleConnectivityChange);
    fetchAppSettingsAndRedirect();
    StatusBar.setBarStyle('dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('transparent');
    }
    Linking.addEventListener('url', this.handleDeepLinkEvent);
    startListeningOnOpenNotification();
  }

  componentDidUpdate(prevProps: Props) {
    const {
      isFetched,
      handleSystemDefaultThemeChange,
      themeType,
      syncReduxStateWithFirestore,
      reduxFetchGasThresholds,
    } = this.props;
    const { isFetched: prevIsFetched, themeType: prevThemeType } = prevProps;
    if (isFetched && !prevIsFetched) {
      handleSystemDefaultThemeChange();
      syncReduxStateWithFirestore();
      reduxFetchGasThresholds();
    }

    if (themeType !== prevThemeType) {
      if (themeType === DARK_THEME) {
        StatusBar.setBarStyle('light-content');
      } else {
        StatusBar.setBarStyle('dark-content');
      }
    }
  }

  setOnlineStatus = (isOnline) => {
    const { updateSessionNetworkStatus, updateOfflineQueueNetworkStatus } = this.props;
    updateSessionNetworkStatus(isOnline);
    updateOfflineQueueNetworkStatus(isOnline);
  };

  handleConnectivityChange = (state: NetInfoState) => {
    const { updateTranslationResourceOnContextChange, initWalletConnectSessionsWithoutReset } = this.props;
    const isOnline = state.isInternetReachable;
    this.setOnlineStatus(isOnline);

    if (!isOnline) {
      if (this.offlineToastId === null) {
        this.offlineToastId = Toast.show({
          message: t('toast.userIsOffline'),
          emoji: 'satellite_antenna',
          autoClose: false,
          onClose: () => {
            this.offlineToastId = null;
          },
        });
      }
    } else {
      if (this.offlineToastId !== null) {
        Toast.close(this.offlineToastId);
      }
      updateTranslationResourceOnContextChange();
      initWalletConnectSessionsWithoutReset();
    }
  };

  handleDeepLinkEvent = (event: { url: string }) => {
    // prevents invoking upon app launch, before login
    if (this.props.initialDeepLinkExecuted) {
      const { executeDeepLink } = this.props;
      const { url: deepLink } = event;
      if (deepLink === undefined) {
        return;
      }
      executeDeepLink(deepLink);
    }
  };

  handleNavigationStateChange = (route) => {
    // Use for WC modal
    const { isVisibleModal } = this.props;
    if (route.type === 'stack' || !isVisibleModal) Modal.closeAll();
    setRoutesState(route);

    const nextRouteName = getActiveRouteName(route);
    if (!!nextRouteName) {
      this.props.logScreenView(nextRouteName);
    }
  };

  render() {
    const {
      isFetched,
      themeType,
      setAppTheme,
      activeWalkthroughSteps,
      i18n: i18next,
      changeLanguage,
      translationsInitialised,
    } = this.props;
    const theme = getThemeByType(themeType);

    const { current, colors } = theme;

    if (!isFetched || (localeConfig.isEnabled && !translationsInitialised)) {
      return null;
    }

    return (
      <AppearanceProvider>
        <ThemeProvider theme={theme}>
          <React.Fragment>
            <Root>
              <RootNavigation
                theme={{ dark: current !== LIGHT_THEME, colors }} // eslint-disable-line i18next/no-literal-string
                language={i18next.language}
                onNavigationStateChange={this.handleNavigationStateChange}
              />
              {!!getEnv().SHOW_THEME_TOGGLE && (
                <Button
                  title={`THEME: ${current}`} // eslint-disable-line i18next/no-literal-string
                  onPress={() => {
                    const themeToChangeTo = current === LIGHT_THEME ? DARK_THEME : LIGHT_THEME;
                    setAppTheme(themeToChangeTo);
                  }}
                />
              )}
              {!!getEnv().SHOW_LANG_TOGGLE && (
                <Button
                  title={`Change lang (current: ${i18next.language})`} // eslint-disable-line i18next/no-literal-string
                  // eslint-disable-next-line i18next/no-literal-string
                  onPress={() => changeLanguage(i18next.language === 'am' ? localeConfig.defaultLanguage : 'am')}
                />
              )}
              {!!activeWalkthroughSteps.length && <Walkthrough steps={activeWalkthroughSteps} />}
              {this.state.env === STAGING && (
                <Button
                  title={`Environment: ${this.state.env}`} // eslint-disable-line i18next/no-literal-string
                  onPress={() => switchEnvironments()}
                />
              )}
              <PercentsInputAccessoryHolder
                ref={(c) => {
                  if (c && !PercentsInputAccessoryHolder.instances.includes(c)) {
                    PercentsInputAccessoryHolder.instances.push(c);
                  }
                }}
              />
            </Root>
          </React.Fragment>
        </ThemeProvider>
      </AppearanceProvider>
    );
  }
}

const mapStateToProps = ({
  appSettings: {
    isFetched,
    data: { themeType, isManualThemeSelection, initialDeepLinkExecuted },
  },
  walkthroughs: { steps: activeWalkthroughSteps },
  session: {
    data: { translationsInitialised, sessionLanguageVersion },
  },
  walletConnect: { isVisibleModal },
}: RootReducerState): Partial<Props> => ({
  isFetched,
  themeType,
  isManualThemeSelection,
  activeWalkthroughSteps,
  translationsInitialised,
  initialDeepLinkExecuted,
  sessionLanguageVersion,
  isVisibleModal,
});

const mapDispatchToProps = (dispatch: Dispatch): Partial<Props> => ({
  fetchAppSettingsAndRedirect: () => dispatch(initAppAndRedirectAction()),
  updateSessionNetworkStatus: (isOnline: boolean) => dispatch(updateSessionNetworkStatusAction(isOnline)),
  updateOfflineQueueNetworkStatus: (isOnline: boolean) => dispatch(updateOfflineQueueNetworkStatusAction(isOnline)),
  startListeningOnOpenNotification: () => dispatch(startListeningOnOpenNotificationAction()),
  stopListeningOnOpenNotification: () => dispatch(stopListeningOnOpenNotificationAction()),
  executeDeepLink: (deepLink: string) => dispatch(executeDeepLinkAction(deepLink)),
  setAppTheme: (themeType: string) => dispatch(setAppThemeAction(themeType)),
  handleSystemDefaultThemeChange: () => dispatch(handleSystemDefaultThemeChangeAction()),
  changeLanguage: (language) => dispatch(changeLanguageAction(language)),
  updateTranslationResourceOnContextChange: () => dispatch(updateTranslationResourceOnContextChangeAction()),
  logScreenView: (screenName: string) => dispatch(logScreenViewAction(screenName)),
  initWalletConnectSessionsWithoutReset: () => dispatch(initWalletConnectSessionsAction(false)),
  syncReduxStateWithFirestore: () => dispatch(syncStateWithFirestore()),
  reduxFetchGasThresholds: () => dispatch(fetchGasThresholds()),
});

// @ts-ignore
const AppWithNavigationState = connect(mapStateToProps, mapDispatchToProps)(withTranslation()(App));

const AppRoot = () => (
  <SafeAreaProvider>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <AppWithNavigationState />
        </QueryClientProvider>
      </Provider>
  </SafeAreaProvider>
);

export default AppRoot;
