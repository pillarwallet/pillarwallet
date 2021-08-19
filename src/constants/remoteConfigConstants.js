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
  FEATURE_RAMP: 'feature_services_ramp',
  FEATURE_LIQUIDITY_POOLS: 'feature_services_liquidity_pools',
  FEATURE_STORIES: 'feature_stories',
  KEY_BASED_ASSETS_MIGRATION: 'app_assets_show_kw_migration',
  SMART_WALLET_ACTIVATION_PAID_BY_PILLAR: 'app_smart_wallet_paid_for_by_pillar',
  APP_FEES_PAID_WITH_PLR: 'app_fees_paid_with_plr',
  APP_LOCALES_URL: 'app_locales_url',
  APP_LOCALES_LATEST_TIMESTAMP: 'app_locales_latest_timestamp',
  APP_SOCIAL_DISCORD: 'app_social_discord',
  APP_SOCIAL_TWITTER: 'app_social_twitter',
  APP_SOCIAL_YOUTUBE: 'app_social_youtube',
  LEGAL_HTML_ENDPOINT_PREFIX: 'app_legal_html_endpoint_prefix',
  FEATURE_ONBOARDING: 'feature_onboarding',
  WALLET_MIGRATION_ARCHANOVA_ENABLED: 'feature_archanova_migrator_tool',
  ENS_MIGRATOR_ENABLED: 'ens_migrator_enabled',
  KNOWLEDGE_BASE_URL: 'knowlegebase_url',
  FEATURE_STORIES_ANDROID_HEIGHT: 'feature_stories_android_height',
  FEATURE_STORIES_ANDROID_WIDTH: 'feature_stories_android_width',
  FEATURE_STORIES_ANDROID_CORNER_RADIUS: 'feature_stories_android_corner_radius',
  FEATURE_STORIES_IOS_HEIGHT: 'feature_stories_ios_height',
  FEATURE_STORIES_IOS_WIDTH: 'feature_stories_ios_width',
  FEATURE_STORIES_IOS_CORNER_RADIUS: 'feature_stories_ios_corner_radius',
  FEATURE_TOKEN_LIST_ETHEREUM: 'app_tokenlist_name',
  FEATURE_TOKEN_LIST_POLYGON: 'app_polygon_tokenlist_name',
  FEATURE_TOKEN_LIST_BSC: 'app_bsc_tokenlist_name',
  PRISMIC_PRIVACY_POLICY_DOCUMENT_ID: 'prismic_privacy_policy_document_id',
  PRISMIC_TERMS_OF_POLICY_DOCUMENT_ID: 'prismic_terms_of_policy_document_id',
  PRISMIC_INTERJECTION_DOCUMENT_ID: 'prismic_interjection_document_id',
  FEATURE_WC_DASHBOARD_INAPPBROWSER: 'feature_wc_dashboard_inappbrowser',
};

// These are used as a fallback in case firebase fails to fetch actual values
export const INITIAL_REMOTE_CONFIG = {
  [REMOTE_CONFIG.FEATURE_OFFERS_ENGINE]: true,
  [REMOTE_CONFIG.FEATURE_RAMP]: true,
  [REMOTE_CONFIG.FEATURE_STORIES]: true,
  [REMOTE_CONFIG.FEATURE_LIQUIDITY_POOLS]: true,
  [REMOTE_CONFIG.KEY_BASED_ASSETS_MIGRATION]: true,
  [REMOTE_CONFIG.APP_FEES_PAID_WITH_PLR]: false,
  [REMOTE_CONFIG.APP_LOCALES_URL]: 'test',
  [REMOTE_CONFIG.APP_LOCALES_LATEST_TIMESTAMP]: '1',
  [REMOTE_CONFIG.APP_SOCIAL_DISCORD]: 'https://chat.pillar.fi',
  [REMOTE_CONFIG.APP_SOCIAL_TWITTER]: 'https://twitter.com/pillarwallet',
  [REMOTE_CONFIG.APP_SOCIAL_YOUTUBE]: 'https://www.youtube.com/channel/UCXIvBMfmYVmrV6dHIqIxEYA',
  [REMOTE_CONFIG.LEGAL_HTML_ENDPOINT_PREFIX]: 'https://s3.eu-west-2.amazonaws.com/pillar-prod-core-profile-images/legal/',
  [REMOTE_CONFIG.FEATURE_ONBOARDING]: false,
  [REMOTE_CONFIG.WALLET_MIGRATION_ARCHANOVA_ENABLED]: true,
  [REMOTE_CONFIG.ENS_MIGRATOR_ENABLED]: false,
  [REMOTE_CONFIG.KNOWLEDGE_BASE_URL]: 'https://help.pillarproject.io/',
  [REMOTE_CONFIG.FEATURE_STORIES_ANDROID_HEIGHT]: '200',
  [REMOTE_CONFIG.FEATURE_STORIES_ANDROID_WIDTH]: '200',
  [REMOTE_CONFIG.FEATURE_STORIES_ANDROID_CORNER_RADIUS]: '40',
  [REMOTE_CONFIG.FEATURE_STORIES_IOS_HEIGHT]: '100',
  [REMOTE_CONFIG.FEATURE_STORIES_IOS_WIDTH]: '100',
  [REMOTE_CONFIG.FEATURE_STORIES_IOS_CORNER_RADIUS]: '20',
  [REMOTE_CONFIG.FEATURE_TOKEN_LIST_ETHEREUM]: 'PillarTokens',
  [REMOTE_CONFIG.FEATURE_TOKEN_LIST_POLYGON]: 'PillarTokens',
  [REMOTE_CONFIG.FEATURE_TOKEN_LIST_BSC]: 'PillarTokens',
  [REMOTE_CONFIG.PRISMIC_PRIVACY_POLICY_DOCUMENT_ID]: 'YNGoWxIAACMAsjF2',
  [REMOTE_CONFIG.PRISMIC_TERMS_OF_POLICY_DOCUMENT_ID]: 'YNGo8hIAACMAsjRR',
  [REMOTE_CONFIG.PRISMIC_INTERJECTION_DOCUMENT_ID]: 'YNsHjxIAACIAw0ca',
  [REMOTE_CONFIG.FEATURE_WC_DASHBOARD_INAPPBROWSER]: false,
};
