// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
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
import { connect } from 'react-redux';
import { Keyboard, ScrollView } from 'react-native';
import type { NavigationEventSubscription, NavigationScreenProp } from 'react-navigation';
import debounce from 'lodash.debounce';
import orderBy from 'lodash.orderby';
import isEqual from 'lodash.isequal';
import {
  searchContactsAction,
  resetSearchContactsStateAction,
  disconnectContactAction,
  muteContactAction,
  blockContactAction,
} from 'actions/contactsActions';
import { fetchInviteNotificationsAction } from 'actions/invitationsActions';
import { logScreenViewAction } from 'actions/analyticsActions';
import { baseColors, spacing } from 'utils/variables';
import { Wrapper } from 'components/Layout';
import SearchBlock from 'components/SearchBlock';
import PeopleSearchResults from 'components/PeopleSearchResults';
import type { SearchResults } from 'models/Contacts';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Spinner from 'components/Spinner';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';

import { FETCHED, FETCHING } from 'constants/contactsConstants';

const MIN_QUERY_LENGTH = 2;

type Props = {
  navigation: NavigationScreenProp<*>,
  searchContacts: (query: string) => Function,
  searchResults: SearchResults,
  contactState: ?string,
  user: Object,
  fetchInviteNotifications: Function,
  disconnectContact: Function,
  muteContact: Function,
  blockContact: Function,
  resetSearchContactsState: Function,
  invitations: Object[],
  localContacts: Object[],
  chats: Object[],
  logScreenView: (view: string, screen: string) => void,
}

type State = {
  query: string,
  manageContactType: string,
  manageContactId: string,
}

class PeopleSearchScreen extends React.Component<Props, State> {
  searchInput: ?Object;
  willFocus: NavigationEventSubscription;

  state = {
    query: '',
    manageContactType: '',
    manageContactId: '',
  };

  constructor(props: Props) {
    super(props);
    this.handleContactsSearch = debounce(this.handleContactsSearch, 500);
    this.searchInput = React.createRef();
  }

  componentDidMount() {
    const { navigation } = this.props;
    this.willFocus = navigation.addListener(
      'willFocus',
      () => { if (this.searchInput) this.searchInput.focus(); },
    );
  }

  componentWillUnmount() {
    this.willFocus.remove();
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    return !isEq;
  }

  handleSearchChange = (query: any) => {
    this.setState({ query });
    this.handleContactsSearch(query);
  };

  handleContactsSearch = (query: string) => {
    if (!query || query.trim() === '' || query.length < MIN_QUERY_LENGTH) {
      this.props.resetSearchContactsState();
      return;
    }
    this.props.searchContacts(query);
  };

  render() {
    const { query } = this.state;
    const {
      contactState,
      localContacts,
      chats,
      navigation,
      invitations,
      searchResults,
    } = this.props;

    const inSearchMode = (query.length >= MIN_QUERY_LENGTH && !!contactState);

    const localContactsWithUnreads = localContacts.map((contact) => {
      const chatWithUserInfo = chats.find((chat) => chat.username === contact.username) || {};
      return {
        ...contact,
        unread: chatWithUserInfo.unread || 0,
        lastMessage: chatWithUserInfo.lastMessage || null,
      };
    });
    const sortedLocalContacts = orderBy(
      localContactsWithUnreads,
      [(user) => {
        if (user.lastMessage) {
          return user.lastMessage.serverTimestamp;
        }
        return user.createdAt * 1000;
      }],
      'desc');
    const usersFound = !!searchResults.apiUsers.length || !!searchResults.localContacts.length;

    return (
      <ContainerWithHeader
        backgroundColor={baseColors.white}
        headerProps={{
          centerItems: [{ title: 'Search for people' }],
        }}
      >
        <ScrollView
          keyboardShouldPersistTaps="always"
          contentContainerStyle={{ flexGrow: 1 }}
          onScroll={() => {
            if (inSearchMode) {
              Keyboard.dismiss();
            }
          }}
        >
          <SearchBlock
            headerProps={{ title: 'people' }}
            searchInputPlaceholder="Search or add people"
            onSearchChange={(q) => this.handleSearchChange(q)}
            itemSearchState={!!contactState}
            wrapperStyle={{ paddingHorizontal: spacing.large, paddingVertical: spacing.mediumLarge }}
            inputRef={ref => { this.searchInput = ref; }}
          />
          {!!query && contactState === FETCHING &&
          <Wrapper center style={{ flex: 1 }}><Spinner /></Wrapper>
          }
          {inSearchMode && contactState === FETCHED && usersFound &&
          <PeopleSearchResults
            searchResults={searchResults}
            navigation={navigation}
            invitations={invitations}
            localContacts={sortedLocalContacts}
            noLocals
          />}
          {inSearchMode && contactState === FETCHED && !usersFound &&
          <Wrapper center fullScreen>
            <EmptyStateParagraph title="Nobody found" bodyText="Make sure you entered the name correctly" />
          </Wrapper>
          }
        </ScrollView>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  contacts: {
    searchResults,
    contactState,
    data: localContacts,
  },
  invitations: { data: invitations },
  chat: { data: { chats } },
}) => ({
  searchResults,
  contactState,
  localContacts,
  invitations,
  chats,
});

const mapDispatchToProps = (dispatch: Function) => ({
  searchContacts: (query) => dispatch(searchContactsAction(query)),
  resetSearchContactsState: () => dispatch(resetSearchContactsStateAction()),
  fetchInviteNotifications: () => dispatch(fetchInviteNotificationsAction()),
  disconnectContact: (contactId: string) => dispatch(disconnectContactAction(contactId)),
  muteContact: (contactId: string, mute: boolean) => dispatch(muteContactAction(contactId, mute)),
  blockContact: (contactId: string, block: boolean) => dispatch(blockContactAction(contactId, block)),
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
});

export default connect(mapStateToProps, mapDispatchToProps)(PeopleSearchScreen);
