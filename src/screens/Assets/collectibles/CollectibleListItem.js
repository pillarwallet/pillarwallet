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
import { SvgCssUri } from 'react-native-svg';

// Components
import Image from 'components/Image';
import Text from 'components/core/Text';

// Utils
import { spacing } from 'utils/variables';
import { isSvgImage } from 'utils/images';

type Props = {|
  title: ?string,
  iconUrl: ?string,
  onPress?: () => mixed,
  width: number,
|};

function CollectibleListItem({ title, iconUrl, onPress, width }: Props) {
  const isSvg = isSvgImage(iconUrl);

  return (
    <TouchableContainer onPress={onPress} disabled={!onPress} style={{ width }}>
      <IconContainer width={width}>
        {!!iconUrl && (
          <>
            {isSvg && <SvgCssUri uri={iconUrl} width="100%" height="100%" />}
            {!isSvg && <Icon source={{ uri: iconUrl }} resizeMode={Image.resizeMode.contain} />}
          </>
        )}
      </IconContainer>

      <TitleContainer>
        <Text variant="small" numberOfLines={1}>
          {title}
        </Text>
      </TitleContainer>
    </TouchableContainer>
  );
}

export default CollectibleListItem;

const TouchableContainer = styled.TouchableOpacity`
  align-items: center;
  margin: ${spacing.extraSmall}px;
  padding: 16px;
  border-radius: 10px;
  background-color: ${({ theme }) => theme.colors.basic050}};
`;

const IconContainer = styled.View`
  justify-content: center;
  align-items: center;
  width: ${({ width }) => width - 32}px;
  height: ${({ width }) => width - 32}px;
  padding: 12px;
`;

const Icon = styled(Image)`
  flex: 1;
  aspect-ratio: 1;
`;

const TitleContainer = styled.View`
  justify-content: center;
  margin-top: 16px;
`;
