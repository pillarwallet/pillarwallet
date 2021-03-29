// @flow
import * as React from 'react';
import { ScrollView } from 'react-native';
import SafeAreaView from 'react-native-safe-area-view';
import styled from 'styled-components/native';

// Types
import { ViewProps } from 'utils/types/react-native';

/**
 * Root element for screens. Normally contains `HeaderBlock` & `Content`.
 */
export const Container: React.ComponentType<ViewProps> = styled.View`
  flex: 1;
`;

type ContentProps = {|
  children: React.Node,
|};

/**
 * Content for regular screens, holds in children inside `ScrollView`. 
 *
 * Correctly handles safe area.
 */
export function Content({ children }: ContentProps) {
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <ContentSafeArea>{children}</ContentSafeArea>
    </ScrollView>
  );
}

const ContentSafeArea = styled(SafeAreaView)`
    flex: 1;
`;
