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
import styled from 'styled-components/native';
import { connect } from 'react-redux';

// components
import { MediumText } from 'components/Typography';

// actions
import { sendReferralInvitationsAction } from 'actions/referralsActions';
import { fetchPhoneContactsAction } from 'actions/phoneContactsActions';

// utils
import { spacing } from 'utils/variables';
import { individualContacts } from 'utils/phoneContacts';

// types
import type { PhoneContact, PhoneContactSimple } from 'models/PhoneContact';
import type { ReferralInvitation } from 'actions/referralsActions';
import type {
  Dispatch,
  RootReducerState,
} from 'reducers/rootReducer';

type Props = {
  phoneContacts: PhoneContact[],
  isFetchingPhoneContacts: boolean,
  isFetchingPhoneContactsComplete: boolean,
  fetchPhoneContacts: () => void,
  sendInvitation: (invitations: ReferralInvitation[]) => void,
};

const Wrapper = styled.View`
  padding: 30px ${spacing.layoutSides}px ${spacing.layoutSides}px;
`;

const Contact = styled.TouchableOpacity`
  padding: 20px 20px;
`;

class FriendsList extends React.Component<Props> {
  componentDidMount() {
    const {
      isFetchingPhoneContactsComplete,
      isFetchingPhoneContacts,
      fetchPhoneContacts,
    } = this.props;

    if (!isFetchingPhoneContacts && !isFetchingPhoneContactsComplete) {
      fetchPhoneContacts();
    }
  }

  handlePressContact(contact: PhoneContactSimple) {
    console.log('press contact', contact);

    this.props.sendInvitation([{
      email: contact.emailAddress,
      phone: contact.phoneNumber,
    }]);
  }

  render() {
    const { phoneContacts } = this.props;
    const contacts = individualContacts(phoneContacts);

    return (
      <Wrapper>
        {contacts.map((contact, index) => {
          const { emailAddress, phoneNumber } = contact;

          return (
            <Contact
              key={index}
              onPress={() => this.handlePressContact(contact)}
            >
              <MediumText>{contact.givenName} {emailAddress}{phoneNumber}</MediumText>
            </Contact>
          );
        })}
      </Wrapper>
    );
  }
}

const mapStateToProps = ({
  phoneContacts: {
    data: phoneContacts,
    isFetching: isFetchingPhoneContacts,
    isFetchComplete: isFetchingPhoneContactsComplete,
  },
}: RootReducerState): $Shape<Props> => ({
  isFetchingPhoneContacts,
  isFetchingPhoneContactsComplete,
  phoneContacts,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  sendInvitation: (invitations: ReferralInvitation[]) => dispatch(
    sendReferralInvitationsAction(invitations),
  ),
  fetchPhoneContacts: () => dispatch(fetchPhoneContactsAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(FriendsList);
