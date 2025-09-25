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
import { BigNumber } from 'bignumber.js';
import { useTranslation } from 'translations/translate';

// services
import { firebaseRemoteConfig } from 'services/firebase';

// Constants
import { EXCHANGE_PROVIDER as PROVIDER } from 'constants/exchangeConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// Utils
import { useIsDarkTheme } from 'utils/themes';

// Types
import type { ImageSource } from 'utils/types/react-native';
import type { AssetOption } from 'models/Asset';
import type { ExchangeProvider } from 'models/Exchange';

// Images
const uniswapLightVertical = require('assets/images/exchangeProviders/uniswapLightVertical.png');
const uniswapLightHorizontal = require('assets/images/exchangeProviders/uniswapLightHorizontal.png');
const uniswapLightMonochrome = require('assets/images/exchangeProviders/uniswapLightMonochrome.png');
const uniswapDarkVertical = require('assets/images/exchangeProviders/uniswapDarkVertical.png');
const uniswapDarkHorizontal = require('assets/images/exchangeProviders/uniswapDarkHorizontal.png');
const uniswapDarkMonochrome = require('assets/images/exchangeProviders/uniswapDarkMonochrome.png');
const oneInchLightVertical = require('assets/images/exchangeProviders/oneinchLightVertical.png');
const oneInchLightHorizontal = require('assets/images/exchangeProviders/oneinchLightHorizontal.png');
const oneInchLightMonochrome = require('assets/images/exchangeProviders/oneinchLightMonochrome.png');
const oneInchDarkVertical = require('assets/images/exchangeProviders/oneinchDarkVertical.png');
const oneInchDarkHorizontal = require('assets/images/exchangeProviders/oneinchDarkHorizontal.png');
const oneInchDarkMonochrome = require('assets/images/exchangeProviders/oneinchDarkMonochrome.png');
const sushiswapLightHorizontal = require('assets/images/exchangeProviders/sushiswapLightHorizontal.png');
const sushiswapLightVertical = require('assets/images/exchangeProviders/sushiswapLightVertical.png');
const sushiswapLightMonochrome = require('assets/images/exchangeProviders/sushiswapLightMonochrome.png');
const sushiswapDarkVertical = require('assets/images/exchangeProviders/sushiswapDarkVertical.png');
const sushiswapDarkHorizontal = require('assets/images/exchangeProviders/sushiswapDarkHorizontal.png');
const sushiswapDarkMonochrome = require('assets/images/exchangeProviders/sushiswapDarkMonochrome.png');
const honeyswapLightHorizontal = require('assets/images/exchangeProviders/honeyswapLightHorizontal.png');
const honeyswapLightVertical = require('assets/images/exchangeProviders/honeyswapLightVertical.png');
const honeyswapLightMonochrome = require('assets/images/exchangeProviders/honeyswapLightMonochrome.png');
const honeyswapDarkVertical = require('assets/images/exchangeProviders/honeyswapDarkVertical.png');
const honeyswapDarkHorizontal = require('assets/images/exchangeProviders/honeyswapDarkHorizontal.png');
const honeyswapDarkMonochrome = require('assets/images/exchangeProviders/honeyswapDarkMonochrome.png');
const paraswapLightHorizontal = require('assets/images/exchangeProviders/paraswapLightHorizontal.png');
const paraswapLightVertical = require('assets/images/exchangeProviders/paraswapLightVertical.png');
const paraswapLightMonochrome = require('assets/images/exchangeProviders/paraswapLightMonochrome.png');
const paraswapDarkVertical = require('assets/images/exchangeProviders/paraswapDarkVertical.png');
const paraswapDarkHorizontal = require('assets/images/exchangeProviders/paraswapDarkHorizontal.png');
const paraswapDarkMonochrome = require('assets/images/exchangeProviders/paraswapDarkMonochrome.png');
const lifiLightHorizontal = require('assets/images/exchangeProviders/lifi_light.png');
const lifiLightVertical = require('assets/images/exchangeProviders/lifi_light.png');
const lifiLightMonochrome = require('assets/images/exchangeProviders/lifi_light.png');
const lifiDarkVertical = require('assets/images/exchangeProviders/lifi_dark.png');
const lifiDarkHorizontal = require('assets/images/exchangeProviders/lifi_dark.png');
const lifiDarkMonochrome = require('assets/images/exchangeProviders/lifi_dark.png');

export type ExchangeOptions = {
  fromOptions: AssetOption[],
  toOptions: AssetOption[],
};

type ProviderConfig = {|
  title: string,
  iconVertical: ImageSource,
  iconHorizontal: ImageSource,
  iconMonochrome: ImageSource,
  iconUrl: string,
|};

/**
 * Returns common UI aspects (texts, icons, color) for displaying main Ethereum chain and side chains.
 */
export function useProvidersConfig(): { [key: ExchangeProvider]: ProviderConfig } {
  const { t } = useTranslation();
  const isDarkTheme = useIsDarkTheme();

  // iconUrl should ideally be directed to our CMS
  return {
    [PROVIDER.UNISWAP]: {
      title: t('exchangeContent.providers.uniswap'),
      iconVertical: isDarkTheme ? uniswapDarkVertical : uniswapLightVertical,
      iconHorizontal: isDarkTheme ? uniswapDarkHorizontal : uniswapLightHorizontal,
      iconMonochrome: isDarkTheme ? uniswapDarkMonochrome : uniswapLightMonochrome,
      iconUrl:
        'https://firebasestorage.googleapis.com/v0/b/pillar-project-1506420699556.appspot.com/o/app%2Fdefi%2Funiswap.png?alt=media&token=f10234af-de36-4448-9333-f303f56978ae',
    },
    [PROVIDER.ONE_INCH]: {
      title: t('exchangeContent.providers.oneInch'),
      iconVertical: isDarkTheme ? oneInchDarkVertical : oneInchLightVertical,
      iconHorizontal: isDarkTheme ? oneInchDarkHorizontal : oneInchLightHorizontal,
      iconMonochrome: isDarkTheme ? oneInchDarkMonochrome : oneInchLightMonochrome,
      iconUrl:
        'https://firebasestorage.googleapis.com/v0/b/pillar-project-1506420699556.appspot.com/o/app%2Fdefi%2F1inch.png?alt=media&token=04ce9d14-6261-4738-bcf7-dc1382281abf',
    },
    [PROVIDER.SUSHISWAP]: {
      title: t('exchangeContent.providers.sushiswap'),
      iconVertical: isDarkTheme ? sushiswapDarkVertical : sushiswapLightVertical,
      iconHorizontal: isDarkTheme ? sushiswapDarkHorizontal : sushiswapLightHorizontal,
      iconMonochrome: isDarkTheme ? sushiswapDarkMonochrome : sushiswapLightMonochrome,
      iconUrl:
        'https://firebasestorage.googleapis.com/v0/b/pillar-project-1506420699556.appspot.com/o/app%2Fdefi%2Fsushiswap.png?alt=media&token=6a34ad5a-c277-401c-9870-d941d8187f88',
    },
    [PROVIDER.HONEYSWAP]: {
      title: t('exchangeContent.providers.honeyswap'),
      iconVertical: isDarkTheme ? honeyswapDarkVertical : honeyswapLightVertical,
      iconHorizontal: isDarkTheme ? honeyswapDarkHorizontal : honeyswapLightHorizontal,
      iconMonochrome: isDarkTheme ? honeyswapDarkMonochrome : honeyswapLightMonochrome,
      iconUrl:
        'https://firebasestorage.googleapis.com/v0/b/pillar-project-1506420699556.appspot.com/o/app%2Fdefi%2Fhoneyswap.webp?alt=media&token=efe8d311-76eb-48bb-9486-65ebffab98a0',
    },
    [PROVIDER.PARASWAP]: {
      title: t('exchangeContent.providers.paraswap'),
      iconVertical: isDarkTheme ? paraswapDarkVertical : paraswapLightVertical,
      iconHorizontal: isDarkTheme ? paraswapDarkHorizontal : paraswapLightHorizontal,
      iconMonochrome: isDarkTheme ? paraswapDarkMonochrome : paraswapLightMonochrome,
      iconUrl:
        'https://firebasestorage.googleapis.com/v0/b/pillar-project-1506420699556.appspot.com/o/app%2Fdefi%2Fparaswap.jpeg?alt=media&token=588d8826-2b8f-4603-bb44-f5e59fcfb66d',
    },
    [PROVIDER.LIFI]: {
      title: t('exchangeContent.providers.lifi'),
      iconVertical: isDarkTheme ? lifiDarkVertical : lifiLightVertical,
      iconHorizontal: isDarkTheme ? lifiDarkHorizontal : lifiLightHorizontal,
      iconMonochrome: isDarkTheme ? lifiDarkMonochrome : lifiLightMonochrome,
      iconUrl:
        'https://firebasestorage.googleapis.com/v0/b/pillar-project-1506420699556.appspot.com/o/app%2Fdefi%2Flifi.png?alt=media&token=f7a19f8e-49cf-49a7-b21a-5dcc87db72c0',
    },
  };
}

export function useProviderConfig(provider: ?ExchangeProvider): ?ProviderConfig {
  const configs = useProvidersConfig();
  return provider ? configs[provider] : undefined;
}

export const getCaptureFee = (fromAmount: BigNumber): BigNumber => {
  if (firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.FEATURE_EXCHANGE_FEE_CAPTURE)) {
    const feePercentage = firebaseRemoteConfig.getNumber(REMOTE_CONFIG.EXCHANGE_FEE_CAPTURE_PERCENTAGE);
    return fromAmount.times(feePercentage / 100);
  }

  return new BigNumber(0);
};

