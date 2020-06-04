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
import LinearGraph from 'components/LinearGraph';
import { getDeviceWidth } from 'utils/common';

type Props = {
  onDragStart?: () => void,
  onDragEnd?: () => void,
}

const BalanceGraph = (props: Props) => {
  const { onDragStart, onDragEnd } = props;
  const data = [{ x: 0.2, y: 150 }, { x: 2, y: 100 }, { x: 4, y: 140 }, { x: 8, y: 190 }, { x: 9, y: 120 }, { x: 12, y: 140 }];

  return (
    <LinearGraph
      data={data}
      resolution={20}
      width={getDeviceWidth()}
      height={140}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      getTooltipContent={(day) => `${day} April\n$${data[day].y}`}
    />
  );
};

export default BalanceGraph;
