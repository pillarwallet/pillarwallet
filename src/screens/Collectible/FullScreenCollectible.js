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

import * as React from 'react';
import styled from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import { baseColors } from 'utils/variables';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';

import type { Collectible } from 'models/Collectible';
import type { NavigationScreenProp } from 'react-navigation';

type Props = {
  collectible: Collectible,
  navigation: NavigationScreenProp<*>,
};

const CollectibleImage = styled(CachedImage)`
  flex: 1;
  resize-mode: cover;
  justify-content: center;
  min-height: 300px;
  min-width: 300px;
  align-self: center;
`;

const genericCollectible = require('assets/images/no_logo.png');

class FullScreenCollectible extends React.PureComponent<Props> {
  collectible: Collectible;

  constructor(props: Props) {
    super(props);

    const { navigation: { state: { params: { collectible } } } } = props;

    this.collectible = collectible;
  }

  render() {
    const {
      id,
      image,
    } = this.collectible;

    return (
      <ContainerWithHeader
        backgroundColor={baseColors.white}
        inset={{ bottom: 0 }}
      >
        <CollectibleImage
          key={id.toString()}
          source={{ uri: image }}
          fallbackSource={genericCollectible}
          resizeMode="contain"
        />
      </ContainerWithHeader>
    );
  }
}

export default FullScreenCollectible;
