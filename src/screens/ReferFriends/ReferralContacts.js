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
import { FlatList, Keyboard } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import debounce from 'lodash.debounce';
import isEmpty from 'lodash.isempty';
import { connect } from 'react-redux';

import { Wrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import SearchBlock from 'components/SearchBlock';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Checkbox from 'components/Checkbox';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Spinner from 'components/Spinner';
import Toast from 'components/Toast';
import MissingInfoNote from 'screens/ReferFriends/MissingInfoNote';

import { spacing } from 'utils/variables';
import {
  getRemainingDailyInvitations,
  isSameContact,
  isSameContactData,
  filterAllowedContacts,
  searchContacts,
} from 'utils/referrals';
import { isValidPhone, isValidEmail } from 'utils/validators';

import type { NavigationScreenProp } from 'react-navigation';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { ReferralContact, SentInvitationsCount } from 'reducers/referralsReducer';

import { setContactsForReferralAction, fetchSentReferralInvitationsAction } from 'actions/referralsActions';
import { fetchPhoneContactsAction } from 'actions/phoneContactsActions';

import { ADD_EDIT_USER, REFER_MAIN_SCREEN } from 'constants/navigationConstants';
import { ALLOWED_DAILY_INVITES } from 'constants/referralsConstants';


type Props = {
  navigation: NavigationScreenProp<*>,
  setContactsForReferral: (contacts: ReferralContact[]) => void,
  addedContactsToInvite: ReferralContact[],
  phoneContacts: ReferralContact[],
  isFetchingPhoneContacts: boolean,
  isFetchingPhoneContactsComplete: boolean,
  phoneContactsFetchError: boolean,
  fetchPhoneContacts: () => void,
  isEmailVerified: boolean,
  isPhoneVerified: boolean,
  alreadyInvitedContacts: ReferralContact[],
  sentInvitationsCount: SentInvitationsCount,
  userPhone: string,
  userEmail: string,
  fetchSentReferralInvitations: () => void,
};

type State = {
  query: string,
  selectedContacts: ReferralContact[],
};

const EmptyStateWrapper = styled.View`
  width: 100%;
  align-items: center;
  padding: 20px 30px 30px;
`;

const ButtonWrapper = styled.View`
  justify-content: center;
  padding: ${spacing.layoutSides}px;
`;

const MIN_QUERY_LENGTH = 3;

const createCustomContact = (
  query: string,
  isPhoneVerified: boolean,
  isEmailVerified: boolean,
): ?ReferralContact => {
  const contact = {
    id: 'custom-contact',
    name: query,
  };

  if (isPhoneVerified && isValidPhone(query)) {
    return { ...contact, phone: query };
  }

  if (isEmailVerified && isValidEmail(query)) {
    return { ...contact, email: query };
  }

  return null;
};

class ReferralContacts extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.handleSearch = debounce(this.handleSearch, 500);
    this.state = {
      query: '',
      selectedContacts: props.addedContactsToInvite || [],
    };
  }

  componentDidMount() {
    const {
      isFetchingPhoneContactsComplete,
      isFetchingPhoneContacts,
      fetchPhoneContacts,
      fetchSentReferralInvitations,
    } = this.props;

    fetchSentReferralInvitations();

    if (!isFetchingPhoneContacts && !isFetchingPhoneContactsComplete) {
      fetchPhoneContacts();
    }
  }

  handleSearch = (query: string) => {
    this.setState({ query });
  };

  renderContact = ({ item }: { item: ReferralContact }) => {
    const { selectedContacts } = this.state;
    const { alreadyInvitedContacts } = this.props;

    const isPreviouslyInvited = alreadyInvitedContacts
      .some(contact => isSameContact(item, contact));

    const isSelected = selectedContacts.some(({ id }) => id === item.id) || isPreviouslyInvited;

    return (
      <ListItemWithImage
        label={item.name}
        subtext={item.email || item.phone}
        itemImageUrl={item.photo}
        onPress={!isPreviouslyInvited ? () => this.toggleContact(item) : null}
        wrapperOpacity={!isPreviouslyInvited ? 1 : 0.5}
        customAddon={(
          <Checkbox
            checked={isSelected}
            onPress={() => this.toggleContact(item)}
            disabled={isPreviouslyInvited}
            rounded
            wrapperStyle={{ width: 24, marginRight: 4, marginLeft: 12 }}
            positive
          />
        )}
        noSeparator
      />
    );
  };

  toggleContact = (contact: ReferralContact) => {
    const { selectedContacts } = this.state;
    const { sentInvitationsCount, userEmail, userPhone } = this.props;
    const { id: relatedContactId, phone } = contact;
    const updatedSelectedContacts = selectedContacts.filter(({ id }) => id !== relatedContactId);

    if (!selectedContacts.find(({ id }) => id === relatedContactId)) {
      const availableInvites = getRemainingDailyInvitations(sentInvitationsCount) - selectedContacts.length;

      if (isSameContactData(contact, userEmail, userPhone)) {
        Toast.show({
          message: 'You can not send invitation to yourself',
          type: 'warning',
          title: 'Can not add this contact',
        });
        return;
      }

      if (!!phone && !isValidPhone(phone)) {
        Toast.show({
          message: 'Phone number should have country code',
          type: 'warning',
          title: 'Invalid phone number',
        });
        return;
      }

      if (!availableInvites) {
        Toast.show({
          message: `You can only invite ${getRemainingDailyInvitations(sentInvitationsCount)} people today ` +
          `(${ALLOWED_DAILY_INVITES} people per day).`,
          type: 'warning',
          title: 'Daily invitations limit reached',
        });
        return;
      }
      updatedSelectedContacts.push(contact);
    }
    this.setState({ selectedContacts: updatedSelectedContacts });
  };

  setContactsForReferral = () => {
    const { setContactsForReferral, navigation } = this.props;
    const { selectedContacts } = this.state;

    setContactsForReferral(selectedContacts);
    navigation.navigate(REFER_MAIN_SCREEN);
  };

  render() {
    const { query, selectedContacts } = this.state;
    const {
      addedContactsToInvite,
      phoneContacts,
      isFetchingPhoneContacts,
      phoneContactsFetchError,
      fetchPhoneContacts,
      isEmailVerified,
      isPhoneVerified,
      navigation,
    } = this.props;

    const showConfirmButton = !!(selectedContacts.length || addedContactsToInvite.length);
    const allowedContacts = filterAllowedContacts(phoneContacts, isPhoneVerified, isEmailVerified);
    const isSearching = query && query.length >= MIN_QUERY_LENGTH;
    const filteredContacts = isSearching ? searchContacts(allowedContacts, query) : allowedContacts;

    if (isSearching && isEmpty(filteredContacts)) {
      const customContact = createCustomContact(query, isPhoneVerified, isEmailVerified);

      if (customContact) {
        filteredContacts.push(customContact);
      }
    }

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Invite friends' }] }}
      >
        {!!isFetchingPhoneContacts &&
        <Wrapper flex={1} center>
          <Spinner />
        </Wrapper>}

        {!isFetchingPhoneContacts &&
          <React.Fragment>
            <SearchBlock
              searchInputPlaceholder="Email or phone"
              onSearchChange={(q) => this.handleSearch(q)}
              itemSearchState={query.length >= MIN_QUERY_LENGTH}
              wrapperStyle={{ paddingHorizontal: spacing.layoutSides, paddingVertical: spacing.layoutSides }}
            />
            <MissingInfoNote
              isEmailVerified={isEmailVerified}
              isPhoneVerified={isPhoneVerified}
              onPressAdd={() => navigation.navigate(ADD_EDIT_USER)}
            />
            <FlatList
              data={filteredContacts}
              extraData={selectedContacts}
              keyExtractor={(item) => item.id}
              renderItem={this.renderContact}
              initialNumToRender={8}
              onScroll={() => Keyboard.dismiss()}
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingVertical: spacing.rhythm,
                paddingTop: 0,
                flexGrow: 1,
              }}
              ListEmptyComponent={(
                <EmptyStateWrapper>
                  <EmptyStateParagraph
                    title={!phoneContactsFetchError ? 'Nobody found' : 'Could not fetch contacts'}
                    bodyText={!phoneContactsFetchError
                      ? 'Make sure you entered phone or email address correctly'
                    : ''}
                    wide
                    large
                  >
                    {phoneContactsFetchError &&
                    <Button title="Try again" onPress={fetchPhoneContacts} marginTop={spacing.large} />}
                  </EmptyStateParagraph>
                </EmptyStateWrapper>
              )}
            />
          </React.Fragment>
        }
        {showConfirmButton && (
          <ButtonWrapper>
            <Button title="Confirm" onPress={this.setContactsForReferral} block />
          </ButtonWrapper>)}
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  user: {
    data: {
      isEmailVerified,
      isPhoneVerified,
      phone: userPhone,
      email: userEmail,
    },
  },
  referrals: { addedContactsToInvite, alreadyInvitedContacts, sentInvitationsCount },
  phoneContacts: {
    data: phoneContacts,
    isFetching: isFetchingPhoneContacts,
    isFetchComplete: isFetchingPhoneContactsComplete,
    fetchError: phoneContactsFetchError,
  },
}: RootReducerState): $Shape<Props> => ({
  addedContactsToInvite,
  alreadyInvitedContacts,
  sentInvitationsCount,
  isFetchingPhoneContacts,
  isFetchingPhoneContactsComplete,
  phoneContacts,
  phoneContactsFetchError,
  isEmailVerified,
  isPhoneVerified,
  userPhone,
  userEmail,
});


const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  setContactsForReferral: (contacts: ReferralContact[]) => dispatch(setContactsForReferralAction(contacts)),
  fetchPhoneContacts: () => dispatch(fetchPhoneContactsAction()),
  fetchSentReferralInvitations: () => dispatch(fetchSentReferralInvitationsAction()),
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(ReferralContacts));
