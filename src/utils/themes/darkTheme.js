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
/* eslint-disable i18next/no-literal-string */

import { BASIC, PRIMARY_ACCENT, SECONDARY_ACCENT, SYNTHETIC } from 'constants/themesConstants';

// In Zeplin, all of them has suffix "Dark" (basic000Light, for example)
export default {
  // basic
  [BASIC['000']]: '#FAFAFA',
  [BASIC['005']]: '#E7E7E7',
  [BASIC['010']]: '#CCCCCC',
  [BASIC['020']]: '#999999',
  [BASIC['030']]: '#7B7B7B',
  [BASIC['040']]: '#4D4D4D',
  [BASIC['050']]: '#262626',
  [BASIC['060']]: '#1E1E1E',
  [BASIC['070']]: '#1A1A1A',
  [BASIC['080']]: '#141414',
  [BASIC['090']]: '#000000',

  // primaryAccent1
  [PRIMARY_ACCENT['100']]: '#D9FFDE',
  [PRIMARY_ACCENT['110']]: '#B3FFBD',
  [PRIMARY_ACCENT['120']]: '#80FF92',
  [PRIMARY_ACCENT['130']]: '#4DFF66',
  [PRIMARY_ACCENT['140']]: '#00FF24',
  [PRIMARY_ACCENT['150']]: '#00E620',
  [PRIMARY_ACCENT['160']]: '#00CC1C',
  [PRIMARY_ACCENT['170']]: '#00B318',
  [PRIMARY_ACCENT['180']]: '#009915',

  // primaryAccent2
  [PRIMARY_ACCENT['200']]: '#EDD9FF',
  [PRIMARY_ACCENT['210']]: '#D8ABFF',
  [PRIMARY_ACCENT['220']]: '#CC91FF',
  [PRIMARY_ACCENT['230']]: '#BB6BFF',
  [PRIMARY_ACCENT['240']]: '#A945FF',
  [PRIMARY_ACCENT['250']]: '#9D2BFF',
  [PRIMARY_ACCENT['260']]: '#9112FF',
  [PRIMARY_ACCENT['270']]: '#8301F3',
  [PRIMARY_ACCENT['280']]: '#7501D9',

  // secondaryAccent1
  [SECONDARY_ACCENT['100']]: '#99FFDE',
  [SECONDARY_ACCENT['110']]: '#66FFCD',
  [SECONDARY_ACCENT['120']]: '#33FFBC',
  [SECONDARY_ACCENT['130']]: '#00FAA8',
  [SECONDARY_ACCENT['140']]: '#00E097',
  [SECONDARY_ACCENT['150']]: '#00C786',
  [SECONDARY_ACCENT['160']]: '#00AD75',
  [SECONDARY_ACCENT['170']]: '#009464',
  [SECONDARY_ACCENT['180']]: '#007A53',

  // secondaryAccent2
  [SECONDARY_ACCENT['200']]: '#FF99BB',
  [SECONDARY_ACCENT['210']]: '#FF80AA',
  [SECONDARY_ACCENT['220']]: '#FF6699',
  [SECONDARY_ACCENT['230']]: '#FF4D88',
  [SECONDARY_ACCENT['240']]: '#FF367F',
  [SECONDARY_ACCENT['250']]: '#FF1966',
  [SECONDARY_ACCENT['260']]: '#E6004C',
  [SECONDARY_ACCENT['270']]: '#CC0043',
  [SECONDARY_ACCENT['280']]: '#B3003B',

  // synthetic
  [SYNTHETIC['100']]: '#E6F2FF',
  [SYNTHETIC['110']]: '#CCE6FF',
  [SYNTHETIC['120']]: '#B3D9FF',
  [SYNTHETIC['130']]: '#99CCFF',
  [SYNTHETIC['140']]: '#90C2FF',
  [SYNTHETIC['150']]: '#66B3FF',
  [SYNTHETIC['160']]: '#4DA6FF',
  [SYNTHETIC['170']]: '#339AFF',
  [SYNTHETIC['180']]: '#198DFF',
};
