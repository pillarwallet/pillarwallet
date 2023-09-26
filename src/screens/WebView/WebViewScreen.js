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

import React from 'react';
import type { NativeStackNavigationProp as NavigationScreenProp } from '@react-navigation/native-stack';

// Type
import type { Route } from '@react-navigation/native';

// components
import WebView from 'components/WebView';

type Props = {
  navigation: NavigationScreenProp<*>,
  route: Route,
};

const WebViewScreen = ({ navigation, route }: Props) => {
  const title = route?.params?.title;
  const url = route?.params?.url;
  return <WebView title={title} url={url} navigation={navigation} />;
};

export default WebViewScreen;
