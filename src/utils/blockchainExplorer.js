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

import t from 'translations/translate';
import { CommonActions } from '@react-navigation/native';
import { upperFirst } from 'lodash';

// Components,
import Toast from 'components/Toast';

// Utils
import { isEtherspotAccount } from 'utils/accounts';

// Services
import etherspotService from 'services/etherspot';
import { navigate } from 'services/navigation';

// Constants
import { WALLETCONNECT_FLOW, WALLETCONNECT_BROWSER } from 'constants/navigationConstants';
import { CHAIN } from 'constants/chainConstants';

// Types
import type { Account } from 'models/Account';
import type { Chain } from 'models/Chain';

type ViewableTransaction = {
  hash: ?string,
  batchHash: ?string,
  fromAccount: ?Account,
};

export async function viewTransactionOnBlockchain(chain: Chain, transaction: ViewableTransaction) {
  const { hash, batchHash, fromAccount } = transaction;
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

  if (!hash && batchHash && isEtherspotAccount(fromAccount)) {
    explorerLink = await etherspotService.getTransactionExplorerLinkByBatch(chain, batchHash);
  } else if (hash) {
    etherspotService.getTransactionExplorerLink(chain, hash);
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

  navigate(
    CommonActions.navigate({
      name: WALLETCONNECT_FLOW,
      params: {
        screen: WALLETCONNECT_BROWSER,
        params: {
          url: explorerLink,
          title: t('title.chain_explorer', { title: chain === CHAIN.XDAI ? 'Gnosis' : upperFirst(chain) }),
          isBlockchainExplorer: true,
        },
      },
    }),
  );
}
