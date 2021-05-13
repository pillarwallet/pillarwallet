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

import { isArray } from 'lodash';
import { getAccountId, isArchanovaAccount } from 'utils/accounts';

export default function (storageData: Object) {
  const accounts = storageData?.accounts?.accounts ?? [];
  const { allowances: currentAllowances } = storageData?.exchangeAllowances ?? {};

  if (!isArray(currentAllowances)) return currentAllowances || {};

  // migrate from single account allowances (array of allowances) to multiple account based (array per account)
  return accounts.reduce((updated, account) => {
    const accountId = getAccountId(account);

    // migration happened after Etherspot account is added so existing allowances can be moved to Archanova
    const allowances = isArchanovaAccount(account) ? currentAllowances : [];

    return { ...updated, [accountId]: allowances };
  }, {});
}
