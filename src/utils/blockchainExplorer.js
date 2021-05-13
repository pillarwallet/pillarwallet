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

// Utils
import {
  findAccountByAddress,
  isArchanovaAccount,
  isEtherspotAccount,
} from 'utils/accounts';

// Services
import archanovaService from 'services/archanova';
import etherspotService from 'services/etherspot';

// Types
import type { Accounts } from 'models/Account';
import type { Event } from 'models/History';

export async function viewTransactionOnBlockchain(event: Event, accounts: Accounts) {
  const { hash = null, batchHash = null, fromAddress = null } = event;

  if (!hash && !batchHash) {
    Toast.show({
      message: t('toast.cannotFindTransactionHash'),
      emoji: 'woman-shrugging',
      supportLink: true,
      autoClose: false,
    });
    return;
  }

  let explorerLink;
  let fromAccount;

  if (fromAddress) {
    fromAccount = findAccountByAddress(fromAddress, accounts);
  }

  if (!hash && batchHash && isEtherspotAccount(fromAccount)) {
    explorerLink = await etherspotService.getTransactionExplorerLinkByBatch(batchHash);
  } else if (hash) {
    explorerLink = isArchanovaAccount(fromAccount)
      ? archanovaService.getConnectedAccountTransactionExplorerLink(hash)
      : etherspotService.getTransactionExplorerLink(hash);
  }

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
