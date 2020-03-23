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

// actions
import { removeContactForReferralAction, sendReferralInvitationsAction } from 'actions/referralsActions';

// components
import { MediumText, BaseText } from 'components/Typography';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Insight from 'components/Insight';
import Button from 'components/Button';
import ClosablePillList from 'components/ClosablePillList';

// utils
import { spacing } from 'utils/variables';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { ReferralContact } from 'reducers/referralsReducer';
import type { ReferralInvitation } from 'actions/referralsActions';

// constants
import { ADDRESS_BOOK_PERMISSION, REFERRAL_CONTACTS } from 'constants/navigationConstants';


type Props = {
  navigation: NavigationScreenProp<*>,
  inviteByEmail: (email: string) => void,
  removeContactForReferral: (id: string) => void,
  addedContactsToInvite: ReferralContact[],
  sendInvitation: (invitations: ReferralInvitation[]) => void,
};


const INSIGHT_ITEMS = [
  {
    title: 'Share your link',
    body: 'Invite your friends to join Pillar',
  },
  {
    title: 'Give Smart Wallet for free',
    body: 'Friends who install Pillar with your link will get free Smart Wallet activation.',
  },
  {
    title: 'Get free PLR',
    body: 'Earn meta-tokens for referring friends.',
  },
];

const ButtonWrapper = styled.View`
  flex: 1;
  justify-content: ${({ justifyCenter }) => justifyCenter ? 'center' : 'flex-start'};
  padding: ${spacing.large}px 0;
`;


class ReferFriends extends React.PureComponent<Props> {
  sendInvites = () => {
    const { addedContactsToInvite, sendInvitation } = this.props;
    const referralContacts = addedContactsToInvite.map(({ email, phone }) => ({ email, phone }));
    sendInvitation(referralContacts);
  };

  render() {
    const { navigation, addedContactsToInvite, removeContactForReferral } = this.props;
    const mappedContactsToInvite = addedContactsToInvite.map((contact) => ({ ...contact, label: contact.name }));
    const hasAddedContacts = !!mappedContactsToInvite.length;
    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: 'Refer friends' }],
          rightItems: [
            {
              link: 'Support',
              onPress: () => Intercom.displayMessenger(),
            },
          ],
          sideFlex: 2,
        }}
      >
        <ScrollView contentContainerStyle={{ paddingTop: 24, paddingHorizontal: spacing.layoutSides }}>
          <Insight
            isVisible
            insightNumberedList={INSIGHT_ITEMS}
            wrapperPadding={0}
            wrapperStyle={{ marginBottom: hasAddedContacts ? 34 : 40 }}
          />
          {hasAddedContacts &&
            <React.Fragment>
              <MediumText accent>Your referrals</MediumText>
              <ClosablePillList
                listItems={mappedContactsToInvite}
                onItemClose={(id) => removeContactForReferral(id)}
              >
                <Button
                  title="Add contacts..."
                  horizontalPaddings={8}
                  height={32}
                  small
                  card
                  onPress={() => navigation.navigate(REFERRAL_CONTACTS)}
                  marginTop={4}
                  marginBottom={4}
                />
              </ClosablePillList>
              <BaseText style={{ marginTop: spacing.large }} secondary small>
                Your contacts will receive an invitation link. They will get rewarded with PLR tokens and a badge after
                confirming their phone number/email address. You will receive your reward after your contact has been
                rewarded.
              </BaseText>
            </React.Fragment>}
          <ButtonWrapper justifyCenter={hasAddedContacts}>
            <Button
              title={addedContactsToInvite.length ? 'Send invites' : 'Select contacts...'}
              onPress={addedContactsToInvite.length
                ? this.sendInvites
                : () => navigation.navigate(ADDRESS_BOOK_PERMISSION)}
              block
            />
          </ButtonWrapper>
        </ScrollView>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  referrals: { addedContactsToInvite },
}: RootReducerState): $Shape<Props> => ({
  addedContactsToInvite,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  removeContactForReferral: (id: string) => dispatch(removeContactForReferralAction(id)),
  sendInvitation: (invitations: ReferralInvitation[]) => dispatch(
    sendReferralInvitationsAction(invitations),
  ),
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(ReferFriends));

