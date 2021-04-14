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
import styled, { useTheme } from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import { Container } from 'components/modern/Layout';
import HeaderBlock from 'components/HeaderBlock';
import Text from 'components/modern/Text';

// Utils
import { appFont, spacing } from 'utils/variables';
import { humanizeDateString } from 'utils/date';

// Local
import { mapHistoryItemsToSections, renderHistoryItem } from './utils';
import { useHistoryItems } from './utilsArchanova';
import type { HistorySection } from './utils';

function History() {
  const { t } = useTranslationWithPrefix('history');
  const navigation = useNavigation();
  const safeArea = useSafeAreaInsets();

  let ts = new Date().getTime();
  const items = useHistoryItems();
  console.log("USE HI", new Date().getTime() - ts);

  let ts2 = new Date().getTime();
  const sections = mapHistoryItemsToSections(items);
  console.log('USE HI', new Date().getTime() - ts2);

  const theme = useTheme();

  items.forEach((item) => console.log("ITEM", item.id));

  const renderSectionHeader = (section: HistorySection) => {
    return <SectionHeader>{humanizeDateString(section.date)}</SectionHeader>;
  };

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} noPaddingTop />
      <SectionList
        contentContainerStyle={{ paddingBottom: safeArea.bottom }}
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => renderSectionHeader(section)}
        renderItem={({ item }) => renderHistoryItem(item, theme)}
      />
    </Container>
  );
}

export default History;

const SectionHeader = styled(Text)`
  padding: ${spacing.large}px ${spacing.large}px ${spacing.small}px;
  font-family: '${appFont.medium}';
  color: ${({ theme }) => theme.colors.basic020};
  background-color: ${({ theme }) => theme.colors.basic070};
`;
