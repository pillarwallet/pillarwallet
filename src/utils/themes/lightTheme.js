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

// In Zeplin, all of them has suffix "Light" (basic000Light, for example)
export default {
  // basic
  [BASIC['000']]: '#007AFF',
  [BASIC['005']]: '#EBF0F5',
  [BASIC['010']]: '#0A1427',
  [BASIC['020']]: '#818EB3',
  [BASIC['030']]: '#8B939E',
  [BASIC['040']]: '#627288',
  [BASIC['050']]: '#FFFFFF',
  [BASIC['060']]: '#EBF0F6',
  [BASIC['070']]: '#FAFAFA',
  [BASIC['080']]: '#EDEDED',
  [BASIC['090']]: '#FCFDFF',

  // primaryAccent1
  [PRIMARY_ACCENT['100']]: '#99CAFF',
  [PRIMARY_ACCENT['110']]: '#66B0FF',
  [PRIMARY_ACCENT['120']]: '#3395FF',
  [PRIMARY_ACCENT['130']]: '#007AFF',
  [PRIMARY_ACCENT['140']]: '#006EE6',
  [PRIMARY_ACCENT['150']]: '#0062CC',
  [PRIMARY_ACCENT['160']]: '#004A99',
  [PRIMARY_ACCENT['170']]: '#003166',
  [PRIMARY_ACCENT['180']]: '#00254D',

  // primaryAccent2
  [PRIMARY_ACCENT['200']]: '#1BFF65',
  [PRIMARY_ACCENT['210']]: '#18E65B',
  [PRIMARY_ACCENT['220']]: '#15CC51',
  [PRIMARY_ACCENT['230']]: '#12B347',
  [PRIMARY_ACCENT['240']]: '#2AA057',
  [PRIMARY_ACCENT['250']]: '#0F993D',
  [PRIMARY_ACCENT['260']]: '#0D8033',
  [PRIMARY_ACCENT['270']]: '#0A6629',
  [PRIMARY_ACCENT['280']]: '#084D1F',

  // secondaryAccent1
  [SECONDARY_ACCENT['100']]: '#1BFF65',
  [SECONDARY_ACCENT['110']]: '#18E65B',
  [SECONDARY_ACCENT['120']]: '#15CC51',
  [SECONDARY_ACCENT['130']]: '#12B347',
  [SECONDARY_ACCENT['140']]: '#2AA057',
  [SECONDARY_ACCENT['150']]: '#0F993D',
  [SECONDARY_ACCENT['160']]: '#0D8033',
  [SECONDARY_ACCENT['170']]: '#0A6629',
  [SECONDARY_ACCENT['180']]: '#084D1F',

  // secondaryAccent2
  [SECONDARY_ACCENT['200']]: '#FDB09B',
  [SECONDARY_ACCENT['210']]: '#F1987E',
  [SECONDARY_ACCENT['220']]: '#E37F63',
  [SECONDARY_ACCENT['230']]: '#CE6649',
  [SECONDARY_ACCENT['240']]: '#BD573A',
  [SECONDARY_ACCENT['250']]: '#A84427',
  [SECONDARY_ACCENT['260']]: '#903016',
  [SECONDARY_ACCENT['270']]: '#6F1A0A',
  [SECONDARY_ACCENT['280']]: '#5F0F01',

  // synthetic
  [SYNTHETIC['100']]: '#8080D6',
  [SYNTHETIC['110']]: '#6B6BD6',
  [SYNTHETIC['120']]: '#5656D6',
  [SYNTHETIC['130']]: '#4040D6',
  [SYNTHETIC['140']]: '#2329D6',
  [SYNTHETIC['150']]: '#151CD6',
  [SYNTHETIC['160']]: '#0000CC',
  [SYNTHETIC['170']]: '#0000B3',
  [SYNTHETIC['180']]: '#000099',
};
