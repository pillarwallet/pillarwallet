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

import isEmpty from 'lodash.isempty';
import {
  AAVE,
  RAMP,
  WYRE,
  POOL_TOGETHER,
  PEER_TO_PEER,
  OFFERS_ENGINE,
} from 'constants/featureFlagsConstants';

type ResponseFeatureFlags = {[key: string]: { value: string, source: string }}

const getBooleanValue = (featureFlags: ResponseFeatureFlags, key: string) => {
  const value = featureFlags[key]?.value;
  // note: boolean flags are fetched as 0/1, hence the !!
  return !!value;
};

export const parseFeatureFlags = (featureFlags: ResponseFeatureFlags) => {
  if (isEmpty(featureFlags)) return {};
  return {
    aave: getBooleanValue(featureFlags, AAVE),
    poolTogether: getBooleanValue(featureFlags, POOL_TOGETHER),
    ramp: getBooleanValue(featureFlags, RAMP),
    peerToPeer: getBooleanValue(featureFlags, PEER_TO_PEER),
    offersEngine: getBooleanValue(featureFlags, OFFERS_ENGINE),
    wyre: getBooleanValue(featureFlags, WYRE),
  };
};

