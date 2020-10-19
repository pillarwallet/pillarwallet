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

import * as React from 'react';
import { ScrollView } from 'react-native';
import Intercom from 'react-native-intercom';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// actions
import { sendReferralInvitationsAction } from 'actions/referralsActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Insight from 'components/Insight';

// utils
import { spacing } from 'utils/variables';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { ReferralContact } from 'reducers/referralsReducer';

// constants
import { ADDRESS_BOOK_PERMISSION, REFERRAL_CONTACTS } from 'constants/navigationConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
  inviteByEmail: (email: string) => void,
  removeContactForReferral: (id: string) => void,
  sendInvitation: (invitations: ReferralContact[]) => void,
  hasAllowedToAccessContacts: boolean,
  isPillarRewardCampaignActive: boolean,
};

class ReferFriends extends React.PureComponent<Props> {
  proceedToSelectContacts = () => {
    const { navigation, hasAllowedToAccessContacts } = this.props;
    if (hasAllowedToAccessContacts) {
      navigation.navigate(REFERRAL_CONTACTS);
    } else {
      navigation.navigate(ADDRESS_BOOK_PERMISSION);
    }
  };

  render() {
    const {
      isPillarRewardCampaignActive,
    } = this.props;

    const commonSteps = [
      {
        title: t('referralsContent.instruction.shareLink.title'),
        body: t('referralsContent.instruction.shareLink.paragraph'),
      },
      {
        title: t('referralsContent.instruction.giveSmartWallet.title'),
        body: t('referralsContent.instruction.giveSmartWallet.paragraph'),
      },
    ];

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{
            title: isPillarRewardCampaignActive
              ? t('referralsContent.title.referMain')
              : t('referralsContent.title.inviteMain'),
          }],
          rightItems: [
            {
              link: t('button.support'),
              onPress: () => Intercom.displayMessenger(),
            },
          ],
          sideFlex: 2,
        }}
      >
        <ScrollView contentContainerStyle={{ paddingTop: 24, paddingHorizontal: spacing.layoutSides }}>
          <Insight
            isVisible
            insightNumberedList={isPillarRewardCampaignActive
              ? [
                  ...commonSteps,
                  {
                    title: t('referralsContent.instruction.getTokens.title'),
                    body: t('referralsContent.instruction.getTokens.paragraph'),
                  },
                ]
              : commonSteps
            }
            wrapperPadding={0}
          />
        </ScrollView>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  referrals: {
    hasAllowedToAccessContacts,
    isPillarRewardCampaignActive,
  },
}: RootReducerState): $Shape<Props> => ({
  hasAllowedToAccessContacts,
  isPillarRewardCampaignActive,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  sendInvitation: (invitations: ReferralContact[]) => dispatch(
    sendReferralInvitationsAction(invitations),
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(ReferFriends);
