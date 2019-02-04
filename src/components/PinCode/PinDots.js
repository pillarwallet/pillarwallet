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
import { baseColors } from 'utils/variables';

const Wrapper = styled.View`
  flex-wrap: wrap;
  margin-top: 20;
  margin-bottom: 40;
  flex-direction: row;
  align-self: center;
  justify-content: space-between;
  width: 156;
`;

const PinDot = styled.View`
  width: 16px;
  height: 16px;
  background-color: ${props => (props.active ? baseColors.electricBlue : baseColors.mediumLightGray)};
  border-radius: 8;
`;

type Props = {
  numAllDots: number,
  numActiveDots: number,
}

const PinDots = (props: Props) => {
  const { numAllDots, numActiveDots } = props;
  const dotsArray = Array(numAllDots).fill('')
    .map((el, i) => ({
      key: i,
      active: numActiveDots >= (i + 1),
    }));

  return (
    <Wrapper>
      {dotsArray.map(({ key, active }) => (
        <PinDot key={key} active={active} />
      ))}
    </Wrapper>
  );
};


export default PinDots;
