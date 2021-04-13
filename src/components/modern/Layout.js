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
import { ScrollView, SectionList } from 'react-native';
import SafeAreaView, { useSafeAreaInsets } from 'react-native-safe-area-view';
import styled from 'styled-components/native';

// Utils
import { spacing } from 'utils/variables';

// Types
import type { ViewProps, ViewStyleProp, SectionListProps } from 'utils/types/react-native';

/**
 * Root element for screens. Normally contains `HeaderBlock` & `Content`.
 */
export const Container: React.ComponentType<ViewProps> = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.basic070};
`;

type ContentProps = {|
  children: React.Node,
  paddingHorizontal?: number,
  paddingVertical?: number,
  contentContainerStyle?: ViewStyleProp,
|};

/**
 * Content for regular screens, holds in children inside `ScrollView`.
 *
 * Correctly handles safe area.
 */
export function Content({
  children,
  paddingHorizontal = spacing.layoutSides,
  paddingVertical = spacing.layoutSides,
  contentContainerStyle,
}: ContentProps) {
  const styles = [
    contentStyles.safeArea,
    { paddingHorizontal, paddingVertical },
  ];

  return (
    <ScrollView contentContainerStyle={[contentStyles.scrollViewContent, contentContainerStyle]}>
      <SafeAreaView style={styles}>{children}</SafeAreaView>
    </ScrollView>
  );
}

const contentStyles = {
  scrollViewContent: {
    flexGrow: 1,
  },
  safeArea: {
    flex: 1,
  },
};
