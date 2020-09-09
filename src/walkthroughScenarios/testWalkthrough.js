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

import { EXCHANGE, HOME } from 'constants/navigationConstants';
import { WALKTHROUGH_TYPES } from 'constants/walkthroughConstants';

export const testWalkthrough = [
  {
    id: 'home_intro',
    type: WALKTHROUGH_TYPES.SHADE,
    activeScreen: HOME,
    title: 'Home.',
    body: 'View and manage all your wallet activity including transactions, social connections, ' +
      'badges and open sessions with other dApps',
    buttonText: 'Next',
  },
  {
    id: 'balance',
    type: WALKTHROUGH_TYPES.TOOLTIP,
    activeScreen: HOME,
    title: '',
    body: 'Lorem',
    buttonText: 'Next',
  },
  {
    id: 'badge',
    type: WALKTHROUGH_TYPES.TOOLTIP,
    activeScreen: HOME,
    title: '',
    body: 'Lorem ipsum!\n Dolor sit amet',
    buttonText: 'Next',
  },
  {
    id: 'exchange_intro',
    type: WALKTHROUGH_TYPES.SHADE,
    activeScreen: EXCHANGE,
    title: 'Exchange.',
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore ' +
      'et dolore magna aliqua.',
    buttonText: 'Next',
  },
  {
    id: 'exchange',
    type: WALKTHROUGH_TYPES.TOOLTIP,
    activeScreen: EXCHANGE,
    title: 'Exchange tooltip title',
    body: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco',
    buttonText: 'Finish',
  },
];
