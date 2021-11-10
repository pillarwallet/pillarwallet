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
import { Platform, ScrollView, TouchableWithoutFeedback } from 'react-native';
import styled from 'styled-components/native';

// Components
import Text from 'components/core/Text';

// Utils
import { spacing } from 'utils/variables';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';

type TabItem<Key: ?string> = {|
  key: Key,
  title: string,
|};

type Props<Key: ?string> = {
  items: TabItem<Key>[],
  activeTab: Key,
  onActiveTabChange: (Key) => mixed,
  style?: ViewStyleProp,
};

const TabBar = <Key: ?string>({ items, activeTab, onActiveTabChange, style }: Props<Key>) => {
  const renderItem = ({ key, title }: TabItem<Key>) => {
    if (activeTab === key) {
      return (
        <TouchableWithoutFeedback key={key} onPress={() => onActiveTabChange(key)}>
          <TabContainer>
            <ActiveTabTitle>{title}</ActiveTabTitle>
            <Underline />
          </TabContainer>
        </TouchableWithoutFeedback>
      );
    }

    return (
      <TouchableWithoutFeedback key={key} onPress={() => onActiveTabChange(key)}>
        <TabContainer>
          <TabTitle>{title}</TabTitle>
        </TabContainer>
      </TouchableWithoutFeedback>
    );
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.scrollView, style]}>
      {items.map(renderItem)}
    </ScrollView>
  );
};

export default TabBar;

const styles = {
  scrollView: {
    width: '100%',
  },
  scrollViewContent: {
    flexDirection: 'row',
  },
};

const TabContainer = styled.View`
  padding: ${spacing.mediumLarge}px ${spacing.mediumLarge}px ${spacing.extraSmall}px;
`;

const ActiveTabTitle = styled(Text)`
`;

const TabTitle = styled(Text)`
  color: ${({ theme }) => theme.colors.secondaryText};
`;

const Underline = styled.View`
  margin-top: 3px;
  border-top-width: ${Platform.OS === 'android' ? '3px' : '6px'};
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
  border-color: ${({ theme }) => theme.colors.purple};
`;
