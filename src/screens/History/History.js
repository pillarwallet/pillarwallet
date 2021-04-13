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

// Local
import { useHistoryItems, mapHistoryItemsToSections, renderHistoryItem } from './utils';
import type { HistorySection } from './utils';

function History() {
  const { t } = useTranslationWithPrefix('history');
  const navigation = useNavigation();
  const safeArea = useSafeAreaInsets();

  const items = useHistoryItems();
  const sections = mapHistoryItemsToSections(items);

  const theme = useTheme();

  const renderSectionHeader = (section: HistorySection) => {
    return <SectionHeader>{section.title}</SectionHeader>;
  };

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} noPaddingTop />
      <SectionList
        contentContainerStyle={{ paddingBottom: safeArea.bottom }}
        sections={sections}
        keyExtractor={(item) => item._id}
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
