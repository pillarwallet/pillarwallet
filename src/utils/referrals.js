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
import { ALLOWED_DAILY_INVITES } from 'constants/referralsConstants';
import type { SentInvitationsCount, ReferralContact, ReferralReward } from 'reducers/referralsReducer';


export const searchContacts = (contacts: ReferralContact[], _query: string): ReferralContact[] => {
  const query = _query.toUpperCase();

  return contacts.filter(({ name, email = '', phone = '' }) => {
    return phone.includes(query)
      || name.toUpperCase().includes(query)
      || email.toUpperCase().includes(query);
  });
};

export const filterAllowedContacts = (
  contacts: ReferralContact[],
  isPhoneVerified: boolean,
  isEmailVerified: boolean,
): ReferralContact[] => {
  return contacts.filter((contact) => {
    if (!isPhoneVerified) {
      return !contact.phone;
    }

    if (!isEmailVerified) {
      return !contact.email;
    }

    return true;
  });
};

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


const getAssetRewardText = (awardInfo: ReferralReward = {}) => {
  const { asset, amount } = awardInfo;
  if (asset && amount) return `${amount} ${asset}`;
  return null;
};

export const getCampaignRewardText = (campaignRewards: ReferralReward[] = []) => {
  const rewards = campaignRewards.reduce((reducedRewards, reward) => {
    const rewardText = getAssetRewardText(reward);
    if (rewardText) return [...reducedRewards, rewardText];
    return reducedRewards;
  }, []);
  return rewards.length ? t('referralsContent.referralRewardText', { rewardsList: rewards.join(', ') }) : '';
};
