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
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch } from 'react-redux';

import messaging from '@react-native-firebase/messaging';
import WebView from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';

import { reportLog, logBreadcrumb } from 'utils/common';
import {
  setNotificationsVisibleStatus,
  setNotificationsPermission,
  getNotificationsPermission,
} from 'utils/getNotification';
import MenuFooter from '../Menu/Menu/components/MenuFooter';

function Home() {
  const dispatch = useDispatch();

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#121116' }}>
      <WebView
        source={{
          uri: 'https://pillarx.app/',
          headers: {
            pk: '',
          },
        }}
        style={{ backgroundColor: '#121116' }}
        bounces={false}
      />
      <MenuFooter />
    </SafeAreaView>
  );
}

export default Home;
