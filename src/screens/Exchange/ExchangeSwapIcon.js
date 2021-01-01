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
import { TouchableOpacity } from 'react-native';
import { CachedImage } from 'react-native-cached-image';
import styled, { withTheme } from 'styled-components/native';
import { images } from 'utils/images';
import type { Theme } from 'models/Theme';

const Wrapper = styled.View`
  width: 100%;
  margin: 10px 0 20px;
  align-items: center;
`;

type Props = {
  onPress: () => void,
  theme: Theme,
  disabled?: boolean,
};

const ExchangeSwapIcon = ({
  onPress, theme, disabled,
}: Props) => {
  const { exchangeIcon } = images(theme);
  return (
    <Wrapper>
      <TouchableOpacity onPress={onPress} disabled={disabled} >
        <CachedImage
          style={{ width: 18, height: 20 }}
          source={exchangeIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </Wrapper>
  );
};

export default withTheme(ExchangeSwapIcon);
