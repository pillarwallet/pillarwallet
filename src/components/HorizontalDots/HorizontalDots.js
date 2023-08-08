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
import styled, { css } from 'styled-components/native';
import { getColorByTheme } from 'utils/themes';

const Wrapper = styled.View`
  flex-wrap: wrap;
  flex-direction: row;
  align-self: center;
  justify-content: space-between;
  ${({ wrapperWidth, wrapperVerticalMargin }) => `
    ${wrapperVerticalMargin && `margin-vertical: ${wrapperVerticalMargin}px;`}
    ${wrapperWidth && `width: ${wrapperWidth}px;`}
  `}
`;

const Dot = styled.View`
  width: 16px;
  height: 16px;
  background-color: ${({ active, theme }) =>
    active
      ? theme.colors.basic000
      : css`
          ${getColorByTheme({ lightKey: 'basic005', darkKey: 'basic030' })}
        `};
  border-radius: 8px;
  shadow-color: ${({ active, theme }) => (active ? theme.colors.basic000 : theme.colors.basic070)};
  shadow-opacity: 1;
  shadow-radius: 8;
  elevation: 16;
`;

type Props = {
  numAllDots: number,
  numActiveDots?: number,
  wrapperWidth?: number,
  wrapperVerticalMargin?: number,
  dotStyle?: Object,
};

const HorizontalDots = (props: Props) => {
  const { numAllDots, numActiveDots, dotStyle, wrapperWidth, wrapperVerticalMargin } = props;
  const dotsArray = Array(numAllDots)
    .fill('')
    .map((el, i) => ({
      key: i,
      active: numActiveDots && numActiveDots >= i + 1,
    }));

  return (
    <Wrapper wrapperWidth={wrapperWidth} wrapperVerticalMargin={wrapperVerticalMargin}>
      {dotsArray.map(({ key, active }) => (
        <Dot style={dotStyle} key={key} active={active} />
      ))}
    </Wrapper>
  );
};

export default HorizontalDots;
