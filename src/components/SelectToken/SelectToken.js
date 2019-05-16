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
import { Picker } from 'react-native';
import { SDK_PROVIDER } from 'react-native-dotenv';
import styled from 'styled-components/native';
import { Wrapper } from 'components/Layout';
import { CachedImage } from 'react-native-cached-image';
import { UIColors } from 'utils/variables';

import type { AssetsList } from 'models/Asset';

const TokenContainer = styled(Wrapper)`
  align-items: center;
  background-color: ${UIColors.defaultInputBackgroundColor};
  border: 1px solid ${UIColors.defaultDividerColor};
  display: flex;
  flex-direction: row;
  padding: 0 10px;
  min-width: 120px;
`;

const TokenIcon = styled(CachedImage)`
  margin: 0;
  height: 32px;
  width: 32px;
`;

const TokenSelect = styled(Picker)`
  background-color: ${UIColors.defaultInputBackgroundColor};
  border: 0;
  flex: 1;
`;

type Props = {
  assets: AssetsList,
  selectedToken: string,
  onTokenChange: (token: string) => void,
};

const genericToken = require('assets/images/tokens/genericToken.png');

const SelectToken = (props: Props) => {
  const { onTokenChange, assets, selectedToken } = props;
  const selected = assets.find(asset => asset.symbol) || assets[0];
  const { iconUrl } = selected;

  const fullIconUrl = iconUrl ? `${SDK_PROVIDER}/${iconUrl}?size=3` : '';

  return (
    <TokenContainer>
      <TokenIcon
        source={{ uri: fullIconUrl }}
        fallbackSource={genericToken}
        resizeMode="contain"
      />

      <TokenSelect
        iosHeader="Select token"
        selectedValue={selectedToken}
        onValueChange={onTokenChange}
      >
        {assets.map(asset => {
          const { symbol } = asset;

          return (
            <Picker.Item key={symbol} label={symbol} value={symbol} />
          );
        })}
      </TokenSelect>
    </TokenContainer>
  );
};

export default SelectToken;
