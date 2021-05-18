// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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

import { Linking } from 'react-native';
import t from 'translations/translate';

// Components,
import Toast from 'components/Toast';

// Services
import smartWalletService from 'services/smartWallet';

export function viewOnBlockchain(hash: ?string) {
  if (!hash) {
    Toast.show({
      message: t('toast.cannotFindTransactionHash'),
      emoji: 'woman-shrugging',
      supportLink: true,
      autoClose: false,
    });
    return;
  }

  const explorerLink = smartWalletService.getConnectedAccountTransactionExplorerLink(hash);
  if (!explorerLink) {
    Toast.show({
      message: t('toast.cannotGetBlockchainExplorerLink'),
      emoji: 'woman-shrugging',
      supportLink: true,
      autoClose: false,
    });
    return;
  }

  Linking.openURL(explorerLink);
}
