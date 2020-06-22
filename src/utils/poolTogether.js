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

export const countDownDHMS = (remainingTimeMs: number) => {
  const seconds = remainingTimeMs / 1000;
  const days = Math.floor(seconds / 24 / 60 / 60);
  const hoursLeft = Math.floor((seconds) - (days * 86400));
  const hours = Math.floor(hoursLeft / 3600);
  const minutesLeft = Math.floor((hoursLeft) - (hours * 3600));
  const minutes = Math.floor(minutesLeft / 60);
  const remainingSeconds = seconds % 60;
  return {
    days,
    hours,
    minutes,
    remainingSeconds,
  };
};

export const getWinChance = (currentCount: number = 0, totalPoolTicketsCount: number = 0): number => {
  return (currentCount * 100) / (totalPoolTicketsCount > 0 ? totalPoolTicketsCount : 1); // win chance in %
};
