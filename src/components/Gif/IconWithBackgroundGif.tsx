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

import React from 'react';
import styled from 'styled-components/native';

// Components
import Image from 'components/Image';
import Icon, { type IconName } from 'components/core/Icon';

// Assets
const logoBackgroundGif = require('assets/images/glow.gif');

interface Props {
  size?: number;
  iconName?: IconName;
}

const IconWithBackgroundGif = ({ size = 56, iconName }: Props) => {
  const imageSize = size * 2.1;

  return (
    <Container>
      <Image source={logoBackgroundGif} style={{ width: imageSize, height: imageSize }} />
      <Icon name={iconName ?? 'plr-white-logo'} style={{ position: 'absolute' }} height={size} width={size} />
    </Container>
  );
};

export default IconWithBackgroundGif;

const Container = styled.View`
  width: 100%;
  align-items: center;
  justify-content: center;
`;
