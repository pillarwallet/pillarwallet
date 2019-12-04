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

import { HOME, PEOPLE } from 'constants/navigationConstants';
import { WALKTHROUGH_TYPES } from 'constants/walkthroughConstants';

export const testWalkthrough = [
  {
    id: 'home_test',
    type: WALKTHROUGH_TYPES.SHADE,
    activeScreen: HOME,
    title: 'Home.',
    body: 'View and manage all your wallet activity including transactions, social connections, ' +
      'badges and open sessions with other dApps',
    buttonText: 'Next',
  },
  {
    id: 'home',
    type: WALKTHROUGH_TYPES.TOOLTIP,
    activeScreen: HOME,
    title: '',
    body: 'New badge earned!\n' +
      'PLR tokens received from referral',
    buttonText: 'Next',
  },
  {
    id: 'people',
    type: WALKTHROUGH_TYPES.TOOLTIP,
    activeScreen: PEOPLE,
    title: 'test people',
    body: 'lorem ipsum dolor',
    buttonText: 'end',
  },
];
