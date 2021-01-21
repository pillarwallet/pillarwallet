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

// Feature flags for Services screen items and other constants fetched from
// Firebase Remote Config
export const REMOTE_CONFIG = {
  FEATURE_OFFERS_ENGINE: 'feature_services_offers_engine',
  FEATURE_AAVE: 'feature_services_aave',
  FEATURE_POOL_TOGETHER: 'feature_services_pool_together',
  FEATURE_RAMP: 'feature_services_ramp',
  FEATURE_WYRE: 'feature_services_wyre',
  FEATURE_ALTALIX: 'feature_services_altalix',
  FEATURE_SABLIER: 'feature_services_sablier',
  FEATURE_RARI: 'feature_services_rari',
  FEATURE_LIQUIDITY_POOLS: 'feature_services_liquidity_pools',
  KEY_BASED_ASSETS_MIGRATION: 'app_assets_show_kw_migration',
  SABLIER_TIME_START_TOLERANCE: 'feature_services_sablier_time_start_tolerance',
  ALTALIX: 'feature_services_altalix',
  WBTC_CAFE: 'feature_services_wbtc_cafe',
  SMART_WALLET_ACTIVATION_PAID_BY_PILLAR: 'app_smart_wallet_paid_for_by_pillar',
  APP_FEES_PAID_WITH_PLR: 'app_fees_paid_with_plr',
  USE_LEGACY_CRYPTOCOMPARE_TOKEN_PRICES: 'use_legacy_cryptocompare_token_prices',
  APP_LOCALES_URL: 'app_locales_url',
  APP_LOCALES_LATEST_TIMESTAMP: 'app_locales_latest_timestamp',
  LEGAL_HTML_ENDPOINT_PREFIX: 'app_legal_html_endpoint_prefix',
  RECOVERY_PORTAL_DISABLED: 'recovery_portal_disabled',
};

// These are used as a fallback in case firebase fails to fetch actual values
export const INITIAL_REMOTE_CONFIG = {
  [REMOTE_CONFIG.FEATURE_OFFERS_ENGINE]: true,
  [REMOTE_CONFIG.FEATURE_RAMP]: true,
  [REMOTE_CONFIG.FEATURE_WYRE]: true,
  [REMOTE_CONFIG.FEATURE_AAVE]: true,
  [REMOTE_CONFIG.FEATURE_POOL_TOGETHER]: true,
  [REMOTE_CONFIG.FEATURE_ALTALIX]: true,
  [REMOTE_CONFIG.WBTC_CAFE]: true,
  [REMOTE_CONFIG.FEATURE_SABLIER]: true,
  [REMOTE_CONFIG.FEATURE_RARI]: true,
  [REMOTE_CONFIG.FEATURE_LIQUIDITY_POOLS]: true,
  [REMOTE_CONFIG.KEY_BASED_ASSETS_MIGRATION]: true,
  [REMOTE_CONFIG.SABLIER_TIME_START_TOLERANCE]: 5,
  [REMOTE_CONFIG.APP_FEES_PAID_WITH_PLR]: false,
  [REMOTE_CONFIG.USE_LEGACY_CRYPTOCOMPARE_TOKEN_PRICES]: false,
  [REMOTE_CONFIG.APP_LOCALES_URL]: 'test',
  [REMOTE_CONFIG.APP_LOCALES_LATEST_TIMESTAMP]: '1',
  [REMOTE_CONFIG.LEGAL_HTML_ENDPOINT_PREFIX]: 'https://s3.eu-west-2.amazonaws.com/pillar-prod-core-profile-images/legal/',
  [REMOTE_CONFIG.RECOVERY_PORTAL_DISABLED]: false,
};
