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
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';

// Components
import Text from 'components/core/Text';
import CollectibleImage from 'components/CollectibleImage';

// Utils
import { fontStyles, spacing } from 'utils/variables';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { Collectible } from 'models/Collectible';

type Props = {|
  collectible: Collectible,
  subtitle?: string,
  onPress?: () => mixed,
  leftAddOn?: React.Node,
  style?: ViewStyleProp,
  testID?: string,
  accessibilityLabel?: string,
|};

/**
 * Standard collectible list item displaying icon, name and optionally subtitle and left add-on (e.g. checkbox).
 */
function CollectibleListItem({ collectible, subtitle, onPress, leftAddOn, style, testID, accessibilityLabel }: Props) {
  return (
    <Container
      onPress={onPress}
      disabled={!onPress}
      style={style}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      {!!leftAddOn && <LeftAddOn>{leftAddOn}</LeftAddOn>}

      <CollectibleImage source={{ uri: collectible.iconUrl }} width={48} height={48} style={styles.icon} />

      <TitleContainer>
        <Title numberOfLines={1}>{collectible.name}</Title>
        {!!subtitle && <Subtitle numberOfLines={1}>{subtitle}</Subtitle>}
      </TitleContainer>
    </Container>
  );
}

export default CollectibleListItem;

const styles = {
  icon: {
    marginRight: spacing.medium,
  },
};

const Container = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  padding: ${spacing.medium}px ${spacing.large}px;
  min-height: 76px;
`;

const LeftAddOn = styled.View`
  align-self: stretch;
  justify-content: center;
  align-items: center;
  margin-right: ${spacing.large}px;
`;

const TitleContainer = styled.View`
  flex: 1;
  justify-content: center;
`;

const Title = styled(Text)`
  ${fontStyles.medium};
`;

const Subtitle = styled(Text)`
  color: ${({ theme }) => theme.colors.secondaryText};
`;
