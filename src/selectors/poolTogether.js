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

import { getWinChance } from 'utils/poolTogether';
import { formatAmount, countDownDHMS } from 'utils/common';
import { createSelector } from 'reselect';
import { poolTogetherStatsSelector } from './selectors';

export const poolTogetherUserStatsSelector = createSelector(
  poolTogetherStatsSelector,
  (poolTogetherStats) => {
    return Object.keys(poolTogetherStats).map((symbol: string) => {
      const {
        currentPrize,
        prizeEstimate,
        remainingTimeMs,
        totalPoolTicketsCount,
        userInfo = null,
      } = poolTogetherStats[symbol];

      const { days, hours, minutes } = countDownDHMS(remainingTimeMs);

      let remainingTime;
      if (days === 0 && hours === 0 && minutes === 0) {
        remainingTime = 'Ending soon';
      } else {
        remainingTime = `In ${days}d ${hours}h ${minutes}m`;
      }

      let userTickets = 0;
      if (userInfo) {
        userTickets = Math.floor(parseFloat(userInfo.ticketBalance));
      }
      const winChanceRaw = getWinChance(userTickets, totalPoolTicketsCount);
      const winChance = `${formatAmount(winChanceRaw, 6)} %`;

      return {
        symbol,
        currentPrize,
        prizeEstimate,
        winChance,
        remainingTime,
        userTickets,
      };
    }).filter(({ userTickets }) => userTickets > 0);
  },
);
