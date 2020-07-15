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

export const SET_FEATURE_FLAGS = 'SET_FEATURE_FLAGS';
export const ENABLE_FEATURE_FLAG = 'ENABLE_FEATURE_FLAG';
export const DISABLE_FEATURE_FLAG = 'DISABLE_FEATURE_FLAG';
export const INITIAL_FEATURE_FLAGS = {};
export const DEVELOPMENT_FEATURE_FLAGS = {};

// Services screen features
export const OFFERS_ENGINE = 'feature_services_offers_engine';
export const AAVE = 'feature_services_aave';
export const POOL_TOGETHER = 'feature_services_pool_together';
export const BUY_WITH_FIAT = 'feature_services_buy_with_fiat';
export const PEER_TO_PEER = 'feature_services_peer_to_peer';
