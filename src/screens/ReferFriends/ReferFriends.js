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
import styled, { withTheme } from 'styled-components/native';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// actions
import {
  removeContactForReferralAction,
  sendReferralInvitationsAction,
} from 'actions/referralsActions';

// components
import { MediumText, BaseText } from 'components/Typography';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Insight from 'components/Insight';
import Button from 'components/Button';
import ClosablePillList from 'components/ClosablePillList';

// utils
import { spacing } from 'utils/variables';
import { getRemainingDailyInvitations } from 'utils/referrals';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { ReferralContact, SentInvitationsCount } from 'reducers/referralsReducer';

// constants
import { ADDRESS_BOOK_PERMISSION, REFERRAL_CONTACTS } from 'constants/navigationConstants';


type Props = {
  navigation: NavigationScreenProp<*>,
  inviteByEmail: (email: string) => void,
  removeContactForReferral: (id: string) => void,
  addedContactsToInvite: ReferralContact[],
  sendInvitation: (invitations: ReferralContact[]) => void,
  isSendingInvite: boolean,
  hasAllowedToAccessContacts: boolean,
  sentInvitationsCount: SentInvitationsCount,
  isPillarRewardCampaignActive: boolean,
};

const ButtonWrapper = styled.View`
  flex: 1;
  justify-content: ${({ justifyCenter }) => justifyCenter ? 'center' : 'flex-start'};
  padding: ${spacing.large}px 0;
`;


class ReferFriends extends React.PureComponent<Props> {
  sendInvites = () => {
    const { addedContactsToInvite, sendInvitation } = this.props;
    sendInvitation(addedContactsToInvite);
  };

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
      navigation,
      addedContactsToInvite,
      removeContactForReferral,
      isSendingInvite,
      sentInvitationsCount,
      isPillarRewardCampaignActive,
    } = this.props;

    const mappedContactsToInvite = addedContactsToInvite.map((contact) => ({ ...contact, label: contact.name }));
    const hasAddedContacts = !!mappedContactsToInvite.length;
    const availableInvites = getRemainingDailyInvitations(sentInvitationsCount) - mappedContactsToInvite.length;
    const availableInvitesText = !availableInvites
      ? 0
      : t('referralsContent.label.remainingCount', { amount: availableInvites });
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
            wrapperStyle={{ marginBottom: hasAddedContacts ? 34 : 40 }}
          />
          {hasAddedContacts && !isSendingInvite &&
            <React.Fragment>
              <MediumText accent>
                {isPillarRewardCampaignActive
                  ? t('referralsContent.label.referralsCount', { amountText: availableInvitesText })
                  : t('referralsContent.label.invitesCount', { amountText: availableInvitesText })
                }
              </MediumText>
              <ClosablePillList
                listItems={mappedContactsToInvite}
                onItemClose={(id) => removeContactForReferral(id)}
              >
                <Button
                  title={t('button.addContacts')}
                  horizontalPaddings={8}
                  small
                  card
                  onPress={() => navigation.navigate(REFERRAL_CONTACTS)}
                  marginTop={4}
                  marginBottom={4}
                />
              </ClosablePillList>
              {!!isPillarRewardCampaignActive &&
              <BaseText style={{ marginTop: spacing.large }} secondary small>
                {t('referralsContent.paragraph.rewardMechanics')}
              </BaseText>}
            </React.Fragment>}
          <ButtonWrapper justifyCenter={hasAddedContacts}>
            <Button
              isLoading={isSendingInvite}
              title={addedContactsToInvite.length ? t('button.sendInvites') : t('button.selectContacts')}
              onPress={addedContactsToInvite.length
                ? this.sendInvites
                : this.proceedToSelectContacts}
              block
            />
          </ButtonWrapper>
        </ScrollView>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  referrals: {
    addedContactsToInvite,
    isSendingInvite,
    hasAllowedToAccessContacts,
    sentInvitationsCount,
    isPillarRewardCampaignActive,
  },
}: RootReducerState): $Shape<Props> => ({
  addedContactsToInvite,
  isSendingInvite,
  hasAllowedToAccessContacts,
  sentInvitationsCount,
  isPillarRewardCampaignActive,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  removeContactForReferral: (id: string) => dispatch(removeContactForReferralAction(id)),
  sendInvitation: (invitations: ReferralContact[]) => dispatch(
    sendReferralInvitationsAction(invitations),
  ),
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(ReferFriends));
