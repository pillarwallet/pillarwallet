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

// Components
import SlideModal from 'components/Modals/SlideModal';

// Utils
import { spacing } from 'utils/variables';

// Local
import AppListItem from './AppListItem';
import { type AppItem, useConnectedAppItems } from './selectors';

export default function () {
  const { t } = useTranslationWithPrefix('walletConnect.connectedApps');

  const items = useConnectedAppItems();

  const renderItem = (item: AppItem) => {
    return <AppListItem {...item} />;
  };

  return (
    <SlideModal noPadding noClose showHeader centerTitle title={t('title')}>
      <ContentWrapper forceInset={{ top: 'never', bottom: 'always' }}>
        <InfoView>{items?.map((item) => renderItem(item))}</InfoView>
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
