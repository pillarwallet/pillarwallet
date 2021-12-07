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

import querystring from 'querystring';
import WertWidget from '@wert-io/widget-initializer';

// Config
import { getEnv } from 'configs/envConfig';
import { ARCHANOVA_RAMP_CURRENCY_TOKENS, ETHERSPOT_RAMP_CURRENCY_TOKENS } from 'configs/rampConfig';
import {
  CONTAINER_ID,
  ORIGIN, CRYPTO_CURRENCIES,
  DEFAULT_FIAT_CURRENCY,
  DEFAULT_CRYPTO_CURRENCY,
} from 'configs/wertConfig';

const PILLAR = 'Pillar';

export function rampWidgetUrl(
  address: string,
  fiatCurrency: string,
  fiatValue: string,
  isEtherspotAccount: boolean,
) {
  const params = {
    hostAppName: PILLAR,
    fiatCurrency,
    fiatValue,
    hostApiKey: getEnv().RAMPNETWORK_API_KEY,
    userAddress: address,
    swapAsset: isEtherspotAccount ? ETHERSPOT_RAMP_CURRENCY_TOKENS.join(',') : ARCHANOVA_RAMP_CURRENCY_TOKENS,
  };

  return `${getEnv().RAMPNETWORK_WIDGET_URL}?${querystring.stringify(params)}`;
}

export function wertWidgetUrl(
  address: string,
  fiatValue: string,
) {
  const wertWidget = new WertWidget({
    partner_id: getEnv().WERT_ID,
    container_id: CONTAINER_ID,
    origin: ORIGIN,
    commodities: CRYPTO_CURRENCIES,
    currency: DEFAULT_FIAT_CURRENCY,
    currency_amount: fiatValue,
    commodity: DEFAULT_CRYPTO_CURRENCY,
    address,
  });

  return wertWidget.getEmbedUrl();
}
