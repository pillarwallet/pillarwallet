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
import t from 'translations/translate';
import type { NavigationScreenProp } from 'react-navigation';

// components
import WebView from 'components/WebView';

// constants
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// services
import { firebaseRemoteConfig } from 'services/firebase';

type Props = {
  navigation: NavigationScreenProp<mixed>
};

const KnowledgeBaseWebView = ({
  navigation,
}: Props) => {
  const url = firebaseRemoteConfig.getString(REMOTE_CONFIG.KNOWLEDGE_BASE_URL);
  return (
    <WebView
      title={t('settingsContent.settingsItem.faq.title')}
      url={url}
      navigation={navigation}
      goBackDismiss
      isKnowledgeBaseUrl
    />
  );
};

export default KnowledgeBaseWebView;
