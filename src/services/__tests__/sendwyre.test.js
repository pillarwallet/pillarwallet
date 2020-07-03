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
import { SENDWYRE_ENVIRONMENT } from 'react-native-dotenv';
import { wyreWidgetUrl } from 'services/sendwyre';

const expectedUrl = SENDWYRE_ENVIRONMENT === 'prod' ?
  'https://pay.sendwyre.com/purchase' +
  '?destCurrency=0.1' +
  '&dest=ethereum:0x000' +
  '&sourceAmount=1.0' +
  '&sourceCurrency=0x111' +
  '&accountId=AC_ERP9DMNTAMB' +
  '&redirectUrl=https%3A//offers-webapp-prod.prod.pillarproject.io/sendwyre' :
  'https://pay.sendwyre.com/purchase' +
  '?destCurrency=0.1' +
  '&dest=ethereum:0x000' +
  '&sourceAmount=1.0' +
  '&sourceCurrency=0x111' +
  '&accountId=AC_ERP9DMNTAMB' +
  '&redirectUrl=https%3A//ecs-offers-qa.nonprod.pillarproject.io/sendwyre';

describe('sendwyre service', () => {
  describe('wyreWidgetUrl', () => {
    it('returns the txid', async () => {
      const url = wyreWidgetUrl('0x000', '0.1', '0x111', '1.0');
      expect(url).toEqual(expectedUrl);
    });
  });
});
