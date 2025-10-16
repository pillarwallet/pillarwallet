// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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

import * as React from 'react';
import { BackHandler, PermissionsAndroid, Platform } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';

import messaging from '@react-native-firebase/messaging';
import WebView from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components';

// Selectors
import { useActiveAccount } from 'selectors';

// Utils
import { reportLog, logBreadcrumb } from 'utils/common';
import {
  setNotificationsVisibleStatus,
  setNotificationsPermission,
  getNotificationsPermission,
} from 'utils/getNotification';
import { getKeychainDataObject } from 'utils/keychain';

// Translations
import t from 'translations/translate';

// Constants
import { MENU_FLOW } from 'constants/navigationConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// Services
import { firebaseRemoteConfig } from 'services/firebase';

function Home() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const activeAccount = useActiveAccount();
  const webviewRef = React.useRef<any>(null);
  const [pk, setPk] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [retryCount, setRetryCount] = React.useState(0);

  React.useEffect(() => {
    let isMounted = true;
    let timeoutId;

    (async () => {
      try {
        logBreadcrumb('Home', 'Attempting to load private key from keychain', { attempt: retryCount + 1 });
        const keychainData = await getKeychainDataObject(() => null); // Pass custom error handler to prevent alert
        if (!isMounted) return;

        const privateKey = keychainData?.privateKey ?? '';

        if (privateKey) {
          logBreadcrumb('Home', 'Private key successfully loaded from keychain');
          setPk(privateKey);
        } else {
          // Keychain doesn't have private key yet - retry up to 5 times with 500ms delay
          logBreadcrumb('Home', 'No private key found in keychain', { retryCount });
          if (retryCount < 5) {
            timeoutId = setTimeout(() => {
              if (isMounted) {
                setRetryCount((prev) => prev + 1);
              }
            }, 500);
          } else {
            reportLog('Home: Failed to load private key after 5 attempts');
          }
        }
      } catch (error) {
        if (isMounted) {
          reportLog('Home: Failed to get keychain data', error);
        }
      }
    })();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [retryCount]);

  React.useEffect(() => {
    // if (status === 'denied' || status === 'granted') return;
    (async () => {
      const status = await getNotificationsPermission();
      if (['never_ask_again', 'granted', 0, 1, '1', '0'].includes(status)) return;
      try {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
          await setNotificationsPermission(dispatch, granted);
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            logBreadcrumb('Notification permission granted', granted);
            await setNotificationsVisibleStatus(dispatch, true);
          } else {
            logBreadcrumb('Notification permission denied', granted);
          }
          return;
        }
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        setNotificationsPermission(dispatch, authStatus);
        if (enabled) await setNotificationsVisibleStatus(dispatch, true);
        logBreadcrumb('Firebase messaging permission:', enabled ? 'granted' : 'denied');
      } catch (error) {
        reportLog('Failed to request notification permissions:', error);
      }
    })();
  }, [dispatch]);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => backHandler.remove();
    }, []),
  );

  const onWebViewMessage = (event) => {
    const data = JSON.parse(event?.nativeEvent?.data) || null;

    if (data?.type === 'pillarXAuthRequest' && data?.value === 'pk') {
      webviewRef.current.postMessage(JSON.stringify({ type: 'pillarWalletPkResponse', value: { pk } }), '*');
    }
    if (data?.type === 'pillarXAuthRequest' && data?.value === 'settings') {
      // Open Menu
      navigation.navigate(MENU_FLOW);
    }
  };

  const pillarXEndpoint = firebaseRemoteConfig.getString(REMOTE_CONFIG.PILLARX_ENDPOINT);

  return (
    <SafeArea>
      {pk && (
        <WebView
          ref={webviewRef}
          source={{
            // eslint-disable-next-line i18next/no-literal-string
            uri: `http://localhost:5176?devicePlatform=${Platform.OS}&eoaAddress=${activeAccount?.id || ''}`,
          }}
          bounces={false}
          onMessage={onWebViewMessage}
          onLoadEnd={() => setLoading(false)}
          style={{ backgroundColor: 'transparent' }}
          scalesPageToFit={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          // eslint-disable-next-line i18next/no-literal-string
          injectedJavaScript={`
            const meta = document.createElement('meta');
            meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
            meta.setAttribute('name', 'viewport');
            document.getElementsByTagName('head')[0].appendChild(meta);
          `}
        />
      )}
      {(!pk || loading) && (
        <LoadingContainer>
          <LoadingText>{t('home.loading')}</LoadingText>
        </LoadingContainer>
      )}
    </SafeArea>
  );
}

const SafeArea = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.grayPrimary};
`;

const LoadingContainer = styled.View`
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
`;

const LoadingText = styled.Text`
  font-size: 16px;
  color: white;
  font-weight: 600;
`;

export default Home;
