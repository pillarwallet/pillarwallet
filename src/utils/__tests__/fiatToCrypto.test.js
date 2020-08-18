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

import { rampWidgetUrl } from '../fiatToCrypto';

describe('The fiatToCrypto.js utility module', () => {
  describe('The rampWidgetUrl function', () => {
    const rampStagingUrl = 'https://ri-widget-staging-ropsten.firebaseapp.com/';

    it('successfully returns a RAMP url', () => {
      const fakeEthAddress = '0x123';
      const fakeUserEmail = 'support@pillarproject.io';

      const generatedUrl = rampWidgetUrl(fakeEthAddress, fakeUserEmail);

      const expectedParams = {
        swapAsset: 'PLR',
        hostApiKey: null,
        userAddress: fakeEthAddress,
        userEmailAddress: fakeUserEmail,
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
