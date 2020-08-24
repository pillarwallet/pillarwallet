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

// utils
import { reportLog, resolveEnsName } from './common';
import { isEnsName } from './validators';


export const getReceiverWithEnsName = async (ethAddress: ?string, showNotification: boolean = true) => {
  let receiverEnsName = '';
  let receiver = '';
  if (!ethAddress) return { receiverEnsName, receiver };

  if (isEnsName(ethAddress)) {
    const resolvedAddress = await resolveEnsName(ethAddress).catch((error) => {
      reportLog('getReceiverWithEnsName failed', { error });
      return null;
    });
    if (!resolvedAddress && showNotification) {
      Toast.show({
        message: t('toast.ensNameNotFound'),
        emoji: 'woman-shrugging',
      });
      return { receiverEnsName, receiver };
    }
    receiverEnsName = ethAddress;
    receiver = resolvedAddress;
  } else {
    receiver = ethAddress;
  }

  return { receiverEnsName, receiver };
};

export const getContactWithEnsName = async (contact: Contact, ensName: string): Promise<Contact> => {
  const { receiverEnsName, receiver } = await getReceiverWithEnsName(ensName);

  return {
    ...contact,
    name: contact?.name || receiverEnsName,
    ensName: receiverEnsName,
    ethAddress: receiver || contact?.ethAddress,
  };
};
