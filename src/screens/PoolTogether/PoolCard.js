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
import { Text } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
// constants
import { DAI, USDC } from 'constants/assetsConstants';

import ShadowedCard from 'components/ShadowedCard';
import Progress from 'components/Progress';
import type { Theme } from 'models/Theme';
import { getThemeColors } from 'utils/themes';
import {sym} from "enzyme/src/Utils";

const CardRow = styled.View`
  flex-direction: row;
  width: 100%;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
`;

const CardColumn = styled.View`
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
`;

type Props = {
  name: string,
  currentPrize: string,
  prizeEstimate: string,
  remainingTimeMs: number,
  activeTab: string,
  theme: Theme,
};

const PoolCard = (props: Props) => {
  const {
    currentPrize,
    prizeEstimate,
    remainingTimeMs,
    activeTab: symbol,
    theme,
  } = props;

  const colors = getThemeColors(theme);

  return (
    <ShadowedCard
      wrapperStyle={{
          marginTop: 8,
          marginBottom: 10,
          paddingHorizontal: 16,
        }}
      contentWrapperStyle={{ paddingLeft: 20, paddingRight: 40 }}
    >
      <CardRow>
        <CardColumn>
          <CardRow>
            <Text>Prize est.</Text>
          </CardRow>
          <CardRow>
            <Text>${prizeEstimate} {symbol}</Text>
          </CardRow>
        </CardColumn>
        <CardColumn>
          <Text > | </Text>
        </CardColumn>
        <CardColumn>
          <CardRow>
            <Text>Current prize</Text>
          </CardRow>
          <CardRow>
            <Text>${currentPrize} {symbol}</Text>
          </CardRow>
        </CardColumn>
      </CardRow>
      <CardRow style={{ width: '100%' }}>
        <Progress
          fullStatusValue={prizeEstimate}
          currentStatusValue={currentPrize}
          activeTab={symbol}
        />
      </CardRow>
      <CardRow style={{ paddingBottom: 16 }}>
        <Text>Ends in {remainingTimeMs}</Text>
      </CardRow>
    </ShadowedCard>
  );
};

export default withTheme(PoolCard);
