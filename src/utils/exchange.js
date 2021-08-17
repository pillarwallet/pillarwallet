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

import { useTranslation } from 'translations/translate';

// Constants
import { EXCHANGE_PROVIDER as PROVIDER } from 'constants/exchangeConstants';

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
const synthetixLightVertical = require('assets/images/exchangeProviders/synthetixLightVertical.png');
const synthetixLightHorizontal = require('assets/images/exchangeProviders/synthetixLightHorizontal.png');
const synthetixLightMonochrome = require('assets/images/exchangeProviders/synthetixLightMonochrome.png');
const synthetixDarkVertical = require('assets/images/exchangeProviders/synthetixDarkVertical.png');
const synthetixDarkHorizontal = require('assets/images/exchangeProviders/synthetixDarkHorizontal.png');
const synthetixDarkMonochrome = require('assets/images/exchangeProviders/synthetixDarkMonochrome.png');
const sushiswapLightVertical = require('assets/images/exchangeProviders/sushiswapLightVertical.png');
const sushiswapLightHorizontal = require('assets/images/exchangeProviders/sushiswapLightHorizontal.png');
const sushiswapLightMonochrome = require('assets/images/exchangeProviders/sushiswapLightMonochrome.png');
const sushiswapDarkVertical = require('assets/images/exchangeProviders/sushiswapDarkVertical.png');
const sushiswapDarkHorizontal = require('assets/images/exchangeProviders/sushiswapDarkHorizontal.png');
const sushiswapDarkMonochrome = require('assets/images/exchangeProviders/sushiswapDarkMonochrome.png');

export type ExchangeOptions = {
  fromOptions: AssetOption[],
  toOptions: AssetOption[],
};

type ProviderConfig = {|
  title: string,
  iconVertical: ImageSource,
  iconHorizontal: ImageSource,
  iconMonochrome: ImageSource,
|};

/**
 * Returns common UI aspects (texts, icons, color) for displaying main Ethereum chain and side chains.
 */
export function useProvidersConfig(): { [key: ExchangeProvider]: ProviderConfig } {
  const { t } = useTranslation();
  const isDarkTheme = useIsDarkTheme();

  return {
    [PROVIDER.UNISWAP]: {
      title: t('exchangeContent.providers.uniswap'),
      iconVertical: isDarkTheme ? uniswapDarkVertical : uniswapLightVertical,
      iconHorizontal: isDarkTheme ? uniswapDarkHorizontal : uniswapLightHorizontal,
      iconMonochrome: isDarkTheme ? uniswapDarkMonochrome : uniswapLightMonochrome,
    },
    [PROVIDER.ONE_INCH]: {
      title: t('exchangeContent.providers.oneInch'),
      iconVertical: isDarkTheme ? oneInchDarkVertical : oneInchLightVertical,
      iconHorizontal: isDarkTheme ? oneInchDarkHorizontal : oneInchLightHorizontal,
      iconMonochrome: isDarkTheme ? oneInchDarkMonochrome : oneInchLightMonochrome,
    },
    [PROVIDER.SYNTHETIX]: {
      title: t('exchangeContent.providers.synthetix'),
      iconVertical: isDarkTheme ? synthetixDarkVertical : synthetixLightVertical,
      iconHorizontal: isDarkTheme ? synthetixDarkHorizontal : synthetixLightHorizontal,
      iconMonochrome: isDarkTheme ? synthetixDarkMonochrome : synthetixLightMonochrome,
    },
    [PROVIDER.SUSHISWAP]: {
      title: t('exchangeContent.providers.sushiswap'),
      iconVertical: isDarkTheme ? sushiswapDarkVertical : sushiswapLightVertical,
      iconHorizontal: isDarkTheme ? sushiswapDarkHorizontal : sushiswapLightHorizontal,
      iconMonochrome: isDarkTheme ? sushiswapDarkMonochrome : sushiswapLightMonochrome,
    },
  };
}

export function useProviderConfig(provider: ?ExchangeProvider): ?ProviderConfig {
  const configs = useProvidersConfig();
  return provider ? configs[provider] : undefined;
}
