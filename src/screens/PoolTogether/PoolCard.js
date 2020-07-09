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
import { Image } from 'react-native';
import styled, { withTheme } from 'styled-components/native';

import { DAI } from 'constants/assetsConstants';

import ShadowedCard from 'components/ShadowedCard';
import { BaseText, MediumText } from 'components/Typography';
import Progress from 'components/Progress';
import { Spacing } from 'components/Layout';

import type { Theme } from 'models/Theme';

import { getThemeColors, themedColors } from 'utils/themes';
import { countDownDHMS, getWinChance } from 'utils/poolTogether';
import { formatAmount } from 'utils/common';

const CardRow = styled.View`
  flex-direction: row;
  width: 100%;
  align-items: center;
  justify-content: center;
`;

const CardColumn = styled.View`
  align-items: center;
  justify-content: center;
`;

const Separator = styled.View`
  width: 1px;
  height: 40px;
  background-color: ${themedColors.border};
`;

type Props = {
  name: string,
  currentPrize: string,
  prizeEstimate: string,
  remainingTimeMs: number,
  activeTab: string,
  userTickets: number,
  totalPoolTicketsCount: number,
  theme: Theme,
};

const daiIcon = require('assets/images/dai_color.png');
const usdcIcon = require('assets/images/usdc_color.png');

const PoolCard = (props: Props) => {
  const {
    currentPrize,
    prizeEstimate,
    remainingTimeMs = 0,
    activeTab: symbol,
    userTickets = 0,
    totalPoolTicketsCount,
    theme,
  } = props;

  const colors = getThemeColors(theme);

  const { days, hours, minutes } = countDownDHMS(remainingTimeMs);

  let remainingTime;
  if (days === 0 && hours === 0 && minutes === 0) {
    remainingTime = 'Ending soon';
  } else {
    const dayW = days === 1 ? 'day' : 'days';
    const hourW = hours === 1 ? 'hour' : 'hours';
    const minW = minutes === 1 ? 'minute' : 'minutes';
    remainingTime = `Ends in ${days} ${dayW}, ${hours} ${hourW}, ${minutes} ${minW}`;
  }

  let winChance = 0;
  if (userTickets > 0) {
    winChance = getWinChance(userTickets, totalPoolTicketsCount);
  }

  const iconSrc = symbol === DAI ? daiIcon : usdcIcon;

  return (
    <ShadowedCard
      wrapperStyle={{
        marginTop: 4,
        marginBottom: 10,
        paddingHorizontal: 16,
      }}
      contentWrapperStyle={{ paddingLeft: 20, paddingRight: 20, paddingVertical: 16 }}
    >
      <CardRow style={{ width: '100%' }}>
        <CardColumn style={{ width: '50%' }}>
          <CardRow>
            <BaseText regular secondary>Prize est.</BaseText>
          </CardRow>
          <Spacing h={6} />
          <CardRow>
            <MediumText large>${prizeEstimate}</MediumText>
            <Image
              source={iconSrc}
              style={{
                marginLeft: 6,
                height: 24,
                width: 24,
              }}
            />
          </CardRow>
        </CardColumn>
        <Separator />
        <CardColumn style={{ width: '50%' }}>
          <CardRow>
            <BaseText regular secondary>Current prize</BaseText>
          </CardRow>
          <Spacing h={6} />
          <CardRow>
            <MediumText big color={colors.poolTogetherPink}>${currentPrize}</MediumText>
          </CardRow>
        </CardColumn>
      </CardRow>
      <Spacing h={14} />
      <CardRow style={{ width: '100%' }}>
        <Progress
          fullStatusValue={prizeEstimate}
          currentStatusValue={currentPrize}
          activeTab={symbol}
        />
      </CardRow>
      <Spacing h={16} />
      <CardRow>
        <BaseText regular secondary>{remainingTime}</BaseText>
      </CardRow>
      {userTickets > 0 &&
        <>
          <Spacing h={16} />
          <CardRow>
            <MediumText big>{userTickets} tickets</MediumText>
            <Spacing w={4} />
            <BaseText medium secondary>({userTickets} {symbol})</BaseText>
          </CardRow>
          <CardRow>
            <BaseText regular primary>
              {formatAmount(winChance, 6)} %
            </BaseText>
            <Spacing w={4} />
            <BaseText regular>chance of win </BaseText>
          </CardRow>
        </>
      }
    </ShadowedCard>
  );
};

export default withTheme(PoolCard);
