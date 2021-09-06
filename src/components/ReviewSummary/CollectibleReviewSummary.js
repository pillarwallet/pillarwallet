// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

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
import React from 'react';
import styled from 'styled-components/native';
import { BaseText, MediumText } from 'components/legacy/Typography';
import { Spacing } from 'components/legacy/Layout';
import CollectibleImage from 'components/CollectibleImage';
import type { Collectible } from 'models/Collectible';


type Props = {
  collectible: Collectible,
  text: string,
};

const Container = styled.View`
  align-items: center;
`;

const CollectibleImageWrapper = styled.View`
  width: 192px;
  height: 192px;
`;

const CollectibleReviewSummary = ({ collectible, text }: Props) => {
  return (
    <Container>
      <CollectibleImageWrapper>
        <CollectibleImage source={{ uri: collectible.imageUrl }} width={192} height={192} />
      </CollectibleImageWrapper>
      <Spacing h={16} />
      <BaseText regular>{text}</BaseText>
      <Spacing h={16} />
      <MediumText medium>{collectible.name}</MediumText>
    </Container>
  );
};

export default CollectibleReviewSummary;
