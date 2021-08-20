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
import styled from 'styled-components/native';

// Components
import CollectibleImage from 'components/CollectibleImage';
import Icon from 'components/modern/Icon';
import Text from 'components/modern/Text';

// Utils
import { useThemedImages } from 'utils/images';
import { useChainConfig } from 'utils/uiConfig';
import { appFont, fontStyles, spacing } from 'utils/variables';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { Collectible } from 'models/Collectible';

type Props = {|
  collectible: Collectible,
  onRequestSelect?: () => mixed,
  style?: ViewStyleProp,
|};

/**
 * TextInput for handling token value input.
 */
function CollectibleInput({ collectible, onRequestSelect, style }: Props) {
  const chainConfig = useChainConfig(collectible.chain);
  const title = collectible.name;

  const { towellie: genericCollectible } = useThemedImages();

  const source = collectible.imageUrl ? { uri: collectible.imageUrl } : genericCollectible;

  return (
    <Container style={style}>
      <TouchableTitleContainer onPress={onRequestSelect}>
        <Title>{title}</Title>
        <ChainIcon name={chainConfig.iconName} />
      </TouchableTitleContainer>

      <CollectibleImage
        source={source}
        resizeMode="contain"
        width={180}
        height={180}
      />
    </Container>
  );
}

export default CollectibleInput;

const Container = styled.View`
  align-items: center;
`;

// Token symbol & icons are positioned by hand, because baseline alignment does not work for android.
const TouchableTitleContainer = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  margin-bottom: 8px;
`;

const Title = styled(Text)`
  ${fontStyles.medium};
  font-family: ${appFont.medium};
  margin-right: ${spacing.small}px;
`;

const ChainIcon = styled(Icon)`
`;
