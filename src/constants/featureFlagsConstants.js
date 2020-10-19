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

// Services screen features
export const FEATURE_FLAGS = {
  OFFERS_ENGINE: 'feature_services_offers_engine',
  AAVE: 'feature_services_aave',
  POOL_TOGETHER: 'feature_services_pool_together',
  RAMP: 'feature_services_ramp',
  WYRE: 'feature_services_wyre',
  PEER_TO_PEER: 'feature_services_peer_to_peer',
  KEY_BASED_ASSETS_MIGRATION: 'app_assets_show_kw_migration',
  SABLIER: 'feature_services_sablier',
  SABLIER_TIME_START_TOLERANCE: 'feature_services_sablier_time_start_tolerance',
  ALTALIX: 'feature_services_altalix',
  RARI: 'feature_services_rari',
  SMART_WALLET_ACTIVATION_PAID_BY_PILLAR: 'app_smart_wallet_paid_for_by_pillar',
  APP_FEES_PAID_WITH_PLR: 'app_fees_paid_with_plr',
  USE_LEGACY_CRYPTOCOMPARE_TOKEN_PRICES: 'use_legacy_cryptocompare_token_prices',
};

// These are used as a fallback in case firebase fails to fetch actual values
export const INITIAL_FEATURE_FLAGS = {
  [FEATURE_FLAGS.OFFERS_ENGINE]: true,
  [FEATURE_FLAGS.RAMP]: true,
  [FEATURE_FLAGS.WYRE]: true,
  [FEATURE_FLAGS.AAVE]: true,
  [FEATURE_FLAGS.POOL_TOGETHER]: true,
  [FEATURE_FLAGS.PEER_TO_PEER]: true,
  [FEATURE_FLAGS.KEY_BASED_ASSETS_MIGRATION]: true,
  [FEATURE_FLAGS.ALTALIX]: true,
  [FEATURE_FLAGS.SABLIER]: true,
  [FEATURE_FLAGS.SABLIER_TIME_START_TOLERANCE]: 5,
  [FEATURE_FLAGS.APP_FEES_PAID_WITH_PLR]: false,
  [FEATURE_FLAGS.USE_LEGACY_CRYPTOCOMPARE_TOKEN_PRICES]: false,
  [FEATURE_FLAGS.RARI]: true,
};
