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

import {
  AAVE,
  RAMP,
  WYRE,
  POOL_TOGETHER,
  PEER_TO_PEER,
  OFFERS_ENGINE,
} from 'constants/featureFlagsConstants';

type ResponseFeatureFlags = {[key: string]: { value: string, source: string }}

export const parseFeatureFlags = (featureFlags: ResponseFeatureFlags) => {
  // note: boolean flags are fetched as 0/1, hence the !!s
  return {
    aave: !!featureFlags[AAVE].value,
    poolTogether: !!featureFlags[POOL_TOGETHER].value,
    ramp: !!featureFlags[RAMP].value,
    peerToPeer: !!featureFlags[PEER_TO_PEER].value,
    offersEngine: !!featureFlags[OFFERS_ENGINE].value,
    wyre: !!featureFlags[WYRE].value,
  };
};

