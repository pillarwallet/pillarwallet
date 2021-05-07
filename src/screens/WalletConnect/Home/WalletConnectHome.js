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
import { SectionList, useWindowDimensions } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';
import { groupBy, chunk } from 'lodash';

// Components
import { Container } from 'components/modern/Layout';
import HeaderBlock from 'components/HeaderBlock';
import Text from 'components/modern/Text';
import FloatingButtons from 'components/FloatingButtons';

// Utils
import { appFont, fontStyles, spacing } from 'utils/variables';

// Types
import type { SectionBase } from 'utils/types/react-native';

// Local
import { type WalletConnectItem, useWalletConnectItems } from './selectors';
import WalletConnectListItem from './WalletConnectListItem';

function WalletConnectHome() {
  const { t } = useTranslationWithPrefix('walletConnect.home');
  const navigation = useNavigation();
  const safeArea = useSafeAreaInsets();

  const { numberOfColumns, columnWidth } = useColumnDimensions();
  const sections = useSectionData(numberOfColumns);

  // Note: in order to achieve multicolumn layout, we group n normal items, into one list row item.
  const renderListRow = (items: WalletConnectItem[]) => {
    return (
      <ListRow key={items[0].title}>
        {items.map((item) => (
          <WalletConnectListItem key={item.title} title={item.title} iconUrl={item.iconUrl} width={columnWidth} />
        ))}
      </ListRow>
    );
  };

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} noPaddingTop />

      <SectionList
        sections={sections}
        renderSectionHeader={({ section }) => <SectionHeader>{section.title}</SectionHeader>}
        renderSectionFooter={() => <SectionFooter />}
        renderItem={({ item }) => renderListRow(item)}
        keyExtractor={(items) => items[0]?.title}
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

const useColumnDimensions = () => {
  const { width } = useWindowDimensions();
  const availableWidth = width - (2 * spacing.layoutSides);
  const minColumnWidth = 80;

  const numberOfColumns = Math.floor(availableWidth / minColumnWidth);
  const columnWidth = Math.floor(availableWidth / numberOfColumns);
  return { numberOfColumns, columnWidth };
};

const useSectionData = (numberOfColumns: number): Section[] => {
  const items = useWalletConnectItems();
  const groups = groupBy(items, item => item.category);

  return Object.keys(groups).map(key => {
    const data = chunk(groups[key], numberOfColumns);
    return { key, title: key, data };
  });
};

const SectionHeader = styled(Text)`
  padding: ${spacing.extraSmall}px ${spacing.layoutSides}px;
  font-family: ${appFont.medium};
  ${fontStyles.big};
  background-color: ${({ theme }) => theme.colors.background};
`;

const SectionFooter = styled.View`
  height: 24px;
`;

const ListRow = styled.View`
  flex-direction: row;
  align-items: stretch;
  padding: 0 ${spacing.layoutSides}px;
`;
