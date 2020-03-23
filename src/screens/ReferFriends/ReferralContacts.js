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
import { connect } from 'react-redux';

import { Wrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import SearchBlock from 'components/SearchBlock';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Checkbox from 'components/Checkbox';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Spinner from 'components/Spinner';

import { spacing } from 'utils/variables';

import type { NavigationScreenProp } from 'react-navigation';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { ReferralContact } from 'reducers/referralsReducer';

import { setContactsForReferralAction } from 'actions/referralsActions';

import { REFER_MAIN_SCREEN } from 'constants/navigationConstants';
import { fetchPhoneContactsAction } from 'actions/phoneContactsActions';


type Props = {
  navigation: NavigationScreenProp<*>,
  setContactsForReferral: (contacts: ReferralContact[]) => void,
  addedContactsToInvite: ReferralContact[],
  phoneContacts: ReferralContact[],
  isFetchingPhoneContacts: boolean,
  isFetchingPhoneContactsComplete: boolean,
  phoneContactsFetchError: boolean,
  fetchPhoneContacts: () => void,
};

type State = {
  query: string,
  selectedContacts: ReferralContact[],
};


const EmptyStateWrapper = styled.View`
  width: 100%;
  align-items: center;
  margin: 20px 0 30px;
`;

const ButtonWrapper = styled.View`
  justify-content: center;
  padding: ${spacing.layoutSides}px;
`;

const MIN_QUERY_LENGTH = 3;

const getFilteredContacts = (contacts, _query: string) => {
  if (!_query || _query.length < MIN_QUERY_LENGTH) return contacts;
  const query = _query.toUpperCase();
  return contacts.filter(({ name, email = '', phone = '' }) => {
    return name.toUpperCase().indexOf(query) > -1
      || email.toUpperCase().indexOf(query) > -1
      || phone.indexOf(query) > -1;
  });
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
    } = this.props;

    if (!isFetchingPhoneContacts && !isFetchingPhoneContactsComplete) {
      fetchPhoneContacts();
    }
  }


  handleSearch = (query: any) => {
    this.setState({ query });
  };

  renderContact = ({ item }: { item: ReferralContact }) => {
    const { selectedContacts } = this.state;
    const isPreviouslyInvited = [] // TODO: previously invited
      .some(({ email, phone }) => (!!email && email === item.email) || (!!phone && phone === item.phone));
    const isSelected = selectedContacts.some(({ id }) => id === item.id) || isPreviouslyInvited;
    return (
      <ListItemWithImage
        label={item.name}
        subtext={item.email || item.phone}
        itemImageUrl={item.photo}
        onPress={!isPreviouslyInvited ? () => this.toggleContact(item) : null}
        wrapperOpacity={!isPreviouslyInvited ? 1 : 0.7}
        customAddon={(
          <Checkbox
            checked={isSelected}
            onPress={() => this.toggleContact(item)}
            disabled={isPreviouslyInvited}
            rounded
            wrapperStyle={{ width: 24, marginRight: 4, marginLeft: 12 }}
          />
        )}
        noSeparator
      />
    );
  };

  toggleContact = (contact: ReferralContact) => {
    const { selectedContacts } = this.state;
    const { id: relatedContactId } = contact;

    const updatedSelectedContacts = selectedContacts.filter(({ id }) => id !== relatedContactId);
    if (!selectedContacts.find(({ id }) => id === relatedContactId)) {
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
    } = this.props;

    const filteredContacts = getFilteredContacts(phoneContacts, query);
    const showConfirmButton = !!(selectedContacts.length || addedContactsToInvite.length);
    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Select email contacts' }] }}
      >
        {!!isFetchingPhoneContacts &&
        <Wrapper flex={1} center>
          <Spinner />
        </Wrapper>}

        {!isFetchingPhoneContacts &&
          <React.Fragment>
            <SearchBlock
              searchInputPlaceholder="Search for contact"
              onSearchChange={(q) => this.handleSearch(q)}
              itemSearchState={query.length >= MIN_QUERY_LENGTH}
              wrapperStyle={{ paddingHorizontal: spacing.layoutSides, paddingVertical: spacing.layoutSides }}
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
                      ? 'Make sure you have entered name, e-mail address or phone number correctly'
                    : ''}
                  >
                    <Button title="Try again" onPress={fetchPhoneContacts} marginTop={spacing.large} />
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
  referrals: { addedContactsToInvite },
  phoneContacts: {
    data: phoneContacts,
    isFetching: isFetchingPhoneContacts,
    isFetchComplete: isFetchingPhoneContactsComplete,
    fetchError: phoneContactsFetchError,
  },
}: RootReducerState): $Shape<Props> => ({
  addedContactsToInvite,
  isFetchingPhoneContacts,
  isFetchingPhoneContactsComplete,
  phoneContacts,
  phoneContactsFetchError,
});


const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  setContactsForReferral: (contacts: ReferralContact[]) => dispatch(setContactsForReferralAction(contacts)),
  fetchPhoneContacts: () => dispatch(fetchPhoneContactsAction()),
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(ReferralContacts));
