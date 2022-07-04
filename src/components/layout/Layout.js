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
import { Platform, View, ScrollView, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeAreaView from 'react-native-safe-area-view';
import styled from 'styled-components/native';

// Utils
import { spacing } from 'utils/variables';

// Types
import type { ViewProps, ViewStyleProp, ScrollEvent } from 'utils/types/react-native';

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
  scrollEnabled?: boolean,
  refreshControl?: React.Element<any>,
  onScroll?: ?(event: ScrollEvent) => void,
  scrollEventThrottle?: number,
  showsVerticalScrollIndicator?: boolean,
  bounces?: boolean,
|};

/**
 * Content for regular screens, holds in children inside `ScrollView`.
 *
 * Correctly handles safe area.
 */
export function Content({
  children,
  paddingHorizontal = spacing.large,
  paddingVertical = spacing.large,
  contentContainerStyle,
  scrollEnabled,
  refreshControl,
  onScroll,
  scrollEventThrottle = 0,
  showsVerticalScrollIndicator,
  bounces = true,
}: ContentProps) {
  const safeArea = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={contentStyles.keyboardAvoidingView}
    >
      <ScrollView
        contentContainerStyle={[
          contentStyles.scrollViewContent,
          { paddingHorizontal, paddingVertical },
          contentContainerStyle,
        ]}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        scrollEnabled={scrollEnabled}
        bounces={bounces}
      >
        <View style={[contentStyles.safeAreaContent, { paddingBottom: safeArea.bottom }]}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const contentStyles = {
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  safeAreaContent: {
    flex: 1,
  },
};

/**
 * Floating footer
 */
export function Footer({ children, style }: ViewProps) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : undefined}>
      <SafeAreaView style={[footerStyles.safeArea, style]}>{children}</SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const footerStyles = {
  safeArea: {
    paddingTop: spacing.small,
    paddingBottom: spacing.medium,
    paddingHorizontal: spacing.large,
  },
};

/**
 * Display items as a row, centered vertically.
 */
export const Row: React.ComponentType<ViewProps> = styled.View`
  flex-direction: row;
  align-items: center;
`;

/**
 * Display items as a row, centered vertically.
 */
export const ColumnRight: React.ComponentType<ViewProps> = styled.View`
  align-items: flex-end;
`;

type CenterProps = {|
  children: React.Node,
  flex?: number,
  height?: string | number,
  width?: string | number,
  padding?: string | number,
|};

export const Center: React.ComponentType<CenterProps> = styled.View`
  ${({ flex }) => flex != null && `flex: ${flex};`};
  ${({ height }) => height != null && `height: ${height}px;`}
  ${({ width }) => width != null && `width: ${width}px;`}
  ${({ padding }) => padding != null && `padding: 0 ${padding}px;`}
  justify-content: center;
  align-items: center;
`;

type SpacingProps = {|
  h?: number,
  w?: number,
  flex?: number,
|};

export const Spacing: React.ComponentType<SpacingProps> = styled.View`
  height: ${({ h }) => h ?? 0}px;
  width: ${({ w }) => w ?? 0}px;
  ${({ flex }) => (flex != null ? `flex: ${flex}` : '')};
`;
