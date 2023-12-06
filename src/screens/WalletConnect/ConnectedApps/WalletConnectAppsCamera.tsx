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
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';
import { isEmpty } from 'lodash';

// Components
import SlideModal from 'components/Modals/SlideModal';

// Utils
import { spacing } from 'utils/variables';

// Selectors
import { useRootSelector } from 'selectors';

// Local
import AppListItem from './AppListItem';
import type { Chain } from 'models/Chain';

type AppItem = {
  key: string;
  title: string;
  chain: Chain;
  iconUrl: string;
};

export default function () {
  const { t } = useTranslationWithPrefix('walletConnect.connectedApps');
  const v2Sessions = useRootSelector((root) => root.walletConnectSessions.v2Sessions);

  const v2ActiveSessions = React.useMemo(() => {
    if (isEmpty(v2Sessions)) return [];
    return v2Sessions.map((session) => {
      const { peer, topic, pairingTopic } = session;
      const { name, icons } = peer?.metadata;
      return { key: `${topic}-${pairingTopic}`, title: name, iconUrl: icons[0], connector: null, v2Session: session };
    });
  }, [v2Sessions]);

  const renderItem = (item: AppItem, index: number) => {
    return <AppListItem key={index.toString()} {...item} />;
  };

  return (
    <SlideModal noPadding noClose showHeader centerTitle title={t('title')}>
      <ContentWrapper forceInset={{ top: 'never', bottom: 'always' }}>
        <InfoView>{v2ActiveSessions?.map((item, index) => renderItem(item, index))}</InfoView>
      </ContentWrapper>
    </SlideModal>
  );
}

const ContentWrapper = styled.View`
  padding: ${spacing.medium}px 0px;
  align-items: center;
`;

const InfoView = styled.ScrollView`
  width: 100%;
`;
