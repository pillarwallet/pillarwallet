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

import { onRamperWidgetUrl } from 'utils/fiatToCrypto';
import { mockEtherspotAccount, mockSupportedAssets } from 'src/testUtils/jestSetup';

describe('The fiatToCrypto.js utility module', () => {
  describe('The onRamperWidgetUrl function', () => {
    const rampStagingUrl = 'https://ri-widget-staging-kovan.firebaseapp.com/';
    const PILLAR = 'Pillar';

    it('successfully returns a ONRAMPER url for Etherspot account', () => {
      const generatedUrl = onRamperWidgetUrl(mockEtherspotAccount, { ethereum: mockSupportedAssets });

      const expectedParams = {
        hostAppName: PILLAR,
        apiKey: null,
        defaultCrypto: 'ETH_ARBITRUM',
        onlyCryptos: [
          'ETH',
          'DAI_ARBITRUM',
          'DAI_ETHEREUM',
          'DAI_GNOSIS',
          'DAI_POLYGON',
          'DAI_BSC',
          'USDC_ARBITRUM',
          'USDC_BSC',
          'USDC_ETHEREUM',
          'USDC_GNOSIS',
          'USDC_POLYGON',
          'USDT_ARBITRUM',
          'USDT_ETHEREUM',
          'USDT_GNOSIS',
          'USDT_BSC',
          'USDT_GNOSIS',
          'MATIC_POLYGON',
          'XDAI_GNOSIS',
          'BNB_BSC',
          'ETH_ARBITRUM',
        ].join(','),
        themeName: 'dark',
        primaryColor: 'ffffffff',
        secondaryColor: '3f3f43',
        primaryTextColor: 'ffffff',
        secondaryTextColor: 'ffffff',
        containerColor: '141416',
        cardColor: '272727',
        borderRadius: '0.5rem',
        widgetBorderRadius: '1rem',
      };
      const expectedUrl = `${rampStagingUrl}?${querystring.stringify(expectedParams)}`;

      expect(generatedUrl).toBe(expectedUrl);
    });

    it('successfully returns a RAMP url for Archanova account', () => {
      const generatedUrl = onRamperWidgetUrl(mockEtherspotAccount, { ethereum: mockSupportedAssets });

      const expectedParams = {
        hostAppName: PILLAR,
        apiKey: null,
        defaultCrypto: 'ETH',
        onlyCryptos: 'ETH',
        themeName: 'dark',
        primaryColor: 'ffffffff',
        secondaryColor: '3f3f43',
        primaryTextColor: 'ffffff',
        secondaryTextColor: 'ffffff',
        containerColor: '141416',
        cardColor: '272727',
        borderRadius: '0.5rem',
        widgetBorderRadius: '1rem',
      };
      const expectedUrl = `${rampStagingUrl}?${querystring.stringify(expectedParams)}`;

      expect(generatedUrl).toBe(expectedUrl);
    });

    it('throws when calling with no parameters given', () => {
      /**
       * TODO: add flow types to Jest
       * @url https://stackoverflow.com/questions/35898251/whats-the-right-way-to-write-jest-tests-verified-with-flow
       */
    });
  });
});
