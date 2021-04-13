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
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import { Container } from 'components/modern/Layout';
import HeaderBlock from 'components/HeaderBlock';
import Text from 'components/modern/Text';

// Utils
import { appFont, spacing } from 'utils/variables';

// Local
import { useHistoryItems, mapHistoryItemsToSections } from './utils';
import type { HistoryItem, HistorySection } from './utils';

function History() {
  const { t } = useTranslationWithPrefix('history');
  const navigation = useNavigation();

  const items = useHistoryItems();
  const sections = mapHistoryItemsToSections(items);

  const renderSectionHeader = (section: HistorySection) => {
    return <SectionHeader>{section.title}</SectionHeader>;
  };

  const renderItem = (item: HistoryItem) => {
    return <Text>{item.title}</Text>;
  };

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} noPaddingTop />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.title}
        renderSectionHeader={({ section }) => renderSectionHeader(section)}
        renderItem={({ item }) => renderItem(item)}
      />
    </Container>
  );
}

export default History;

const SectionHeader = styled(Text)`
  padding: ${spacing.large}px ${spacing.large}px ${spacing.small}px;
  font-family: "${appFont.medium}";
  color: ${({ theme }) => theme.colors.basic020};
`;
