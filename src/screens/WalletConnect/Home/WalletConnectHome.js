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
import { SectionList } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';
import { groupBy, chunk } from 'lodash';

// Components
import { Container } from 'components/modern/Layout';
import HeaderBlock from 'components/HeaderBlock';
import FloatingButtons from 'components/FloatingButtons';

// Utils
import { spacing } from 'utils/variables';

// Types
import type { SectionBase } from 'utils/types/react-native';

// Local
import { type WalletConnectItem, useWalletConnectItems } from './selectors';
import ServiceListHeader from './ServiceListHeader';
import WalletConnectListItem from './WalletConnectListItem';

function WalletConnectHome() {
  const { t } = useTranslationWithPrefix('walletConnect.home');
  const navigation = useNavigation();
  const safeArea = useSafeAreaInsets();

  const numberOfColumns = 4;
  const sections = useSectionData(numberOfColumns);

  const renderSectionHeader = ({ title }: Section) => {
    return <ServiceListHeader title={title} />;
  };

  const renderItem = (items: WalletConnectItem[]) => {
    return (
      <ListRow key={items[0].title}>
        {items.map((item) => (
          <WalletConnectListItem key={item.title} title={item.title} iconUrl={item.iconUrl} />
        ))}
      </ListRow>
    );
  };


  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} noPaddingTop />

      <SectionList
        sections={sections}
        renderSectionHeader={({ section }) => renderSectionHeader(section)}
        renderItem={({ item }) => renderItem(item)}
        contentContainerStyle={{ paddingBottom: safeArea.bottom + FloatingButtons.SCROLL_VIEW_BOTTOM_INSET }}
      />
    </Container>
  );
}

export default WalletConnectHome;

type Section = {
  ...SectionBase<WalletConnectItem[]>,
  title: string,
};

const useSectionData = (numberOfColumns: number): Section[] => {
  const items = useWalletConnectItems();
  const groups = groupBy(items, item => item.category);

  return Object.keys(groups).map(key => {
    const groupItems = groups[key];
    return {
      key,
      title: key,
      data: chunk(groupItems, numberOfColumns),
    };
  });
};

const ListRow = styled.View`
  flex-direction: row;
  align-items: stretch;
  padding: 0 ${spacing.mediumLarge}px;
`;

