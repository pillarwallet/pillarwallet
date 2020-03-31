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

import { ALLOWED_DAILY_INVITES } from 'constants/referralsConstants';
import type { SentInvitationsCount, ReferralContact } from 'reducers/referralsReducer';

export const isSameContactData = (
  base: ReferralContact,
  otherEmail: ?string,
  otherPhone: ?string,
): boolean => {
  const { email, phone } = base;

  return (
    (!!email && email === otherEmail) ||
    (!!phone && phone === otherPhone)
  );
};

export const isSameContact = (base: ReferralContact, other: ReferralContact): boolean => {
  const { email, phone } = other;

  return isSameContactData(base, email, phone);
};

export const getRemainingDailyInvitations = (sentInvitationsCount: SentInvitationsCount) => {
  const { count, date } = sentInvitationsCount;
  const currentDate = new Date().toJSON().slice(0, 10);
  if (date !== currentDate) return ALLOWED_DAILY_INVITES;
  return ALLOWED_DAILY_INVITES - count;
};
