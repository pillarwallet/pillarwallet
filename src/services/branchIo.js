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
import branch, { BranchEvent } from 'react-native-branch';

type LinkMetadata = {|
  email?: string,
  phone?: string,
  token: string,
|};

export const getUserReferralLink = async (
  inviterWalletId: string,
  data: LinkMetadata,
): Promise<string> => {
  const branchIoUniversalObject = await branch.createBranchUniversalObject(
    `${inviterWalletId}-referral-link-${+new Date()}`,
    { contentMetadata: { customMetadata: { ...data, inviterWalletId } } },
  );

  const result = await branchIoUniversalObject.generateShortUrl({
    feature: 'referral',
    channel: 'app',
  });

  return result.url;
};

export const logEvent = async (eventName: string, customData?: Object): Promise<any> => {
  const event = new BranchEvent(eventName, null, { customData });
  return event.logEvent();
};
