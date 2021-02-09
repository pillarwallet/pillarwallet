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
import t from 'translations/translate';

// components
import Toast from 'components/Toast';

// types
import type { Contact } from 'models/Contact';

// services
import etherspot from 'services/etherspot';

// utils
import { reportLog } from './common';
import { isEnsName } from './validators';


export const getReceiverWithEnsName = async (
  ethAddressOrEnsName: ?string,
  showNotification: boolean = true,
): Promise<?{ receiverEnsName?: string, receiver: ?string}> => {
  if (!ethAddressOrEnsName) return null;

  if (isEnsName(ethAddressOrEnsName)) {
    const resolved = await etherspot.getENSNode(ethAddressOrEnsName).catch((error) => {
      reportLog('getReceiverWithEnsName failed', { error });
      return null;
    });

    if (!resolved?.address && showNotification) {
      Toast.show({
        message: t('toast.ensNameNotFound'),
        emoji: 'woman-shrugging',
      });
      return null;
    }

    return {
      receiverEnsName: ethAddressOrEnsName,
      receiver: resolved.address,
    };
  }

  return { receiver: ethAddressOrEnsName };
};

export const getContactWithEnsName = async (contact: Contact, ensName: string): Promise<Contact> => {
  const resolved = await getReceiverWithEnsName(ensName);

  return {
    ...contact,
    name: contact?.name || resolved?.receiverEnsName || '',
    ensName: resolved?.receiverEnsName,
    ethAddress: resolved?.receiver || contact?.ethAddress,
  };
};
