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
import WalletConnect from '@walletconnect/react-native';
import type { IWalletConnectOptions } from '@walletconnect/react-native';

/* eslint-disable i18next/no-literal-string */
const getNativeOptions = () => {
  const nativeOptions = {
    clientMeta: {
      name: 'Pillar Wallet',
      description: 'Social. Secure. Intuitive.',
      url: 'https://pillarproject.io/wallet',
      icons: [
        'https://is3-ssl.mzstatic.com/image/thumb/Purple113/v4/8c/36/c7/8c36c7d5-0698-97b5-13b2-a51564706cf5/AppIcon-1x_U007emarketing-85-220-0-6.png/460x0w.jpg',
      ],
    },
  };

  return nativeOptions;
};
/* eslint-enable i18next/no-literal-string */

export const createConnector = (options: IWalletConnectOptions): WalletConnect => {
  const nativeOptions = getNativeOptions();

  const connector = new WalletConnect(options, nativeOptions);

  return connector;
};
