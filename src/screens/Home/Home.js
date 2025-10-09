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
import { useActiveAccount, useRootSelector } from 'selectors';

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

// Config
import { getEnv } from 'configs/envConfig';

function Home() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const activeAccount = useActiveAccount();
  const webviewRef = React.useRef<any>(null);
  const [pk, setPk] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const wallet = useRootSelector((root) => root.onboarding.wallet);

  React.useEffect(() => {
    (async () => {
      const keychainData = await getKeychainDataObject();
      if (wallet?.privateKey || keychainData?.privateKey) {
        setPk(wallet?.privateKey ?? keychainData?.privateKey ?? '');
      }
    })();
  }, [wallet]);

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

  return (
    <SafeArea>
      {pk && (
        <WebView
          ref={webviewRef}
          source={{
            // eslint-disable-next-line i18next/no-literal-string
            uri: `${getEnv().PILLARX_ENDPOINT}?devicePlatform=${Platform.OS}&eoaAddress=${activeAccount?.id || ''}`,
          }}
          bounces={false}
          onMessage={onWebViewMessage}
          onLoadEnd={() => setLoading(false)}
          style={{ backgroundColor: 'transparent' }}
        />
      )}
      {(loading || !pk) && (
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
