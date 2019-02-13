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
import { connect } from 'react-redux';
import {
  FlatList,
  Keyboard,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import Swipeout from 'react-native-swipeout';
import type { NavigationEventSubscription, NavigationScreenProp } from 'react-navigation';
import debounce from 'lodash.debounce';
import orderBy from 'lodash.orderby';
import isEqual from 'lodash.isequal';
import capitalize from 'lodash.capitalize';
import styled from 'styled-components/native';
import { Icon } from 'native-base';
import { searchContactsAction, resetSearchContactsStateAction, disconnectContactAction } from 'actions/contactsActions';
import { fetchInviteNotificationsAction } from 'actions/invitationsActions';
import { CONTACT, CONNECTION_REQUESTS } from 'constants/navigationConstants';
import { TYPE_RECEIVED } from 'constants/invitationsConstants';
import { FETCHING, FETCHED } from 'constants/contactsConstants';
import { DISCONNECT } from 'constants/connectionsConstants';
import { baseColors, UIColors, fontSizes, spacing } from 'utils/variables';
import { Container, Wrapper } from 'components/Layout';
import SearchBlock from 'components/SearchBlock';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Separator from 'components/Separator';
import Spinner from 'components/Spinner';
import { BaseText } from 'components/Typography';
import NotificationCircle from 'components/NotificationCircle';
import Button from 'components/Button/Button';
import PeopleSearchResults from 'components/PeopleSearchResults';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import type { SearchResults } from 'models/Contacts';
import ConnectionConfirmationModal from 'screens/Contact/ConnectionConfirmationModal';

const ConnectionRequestBanner = styled.TouchableHighlight`
  height: 60px;
  padding-left: 30px;
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${UIColors.defaultBorderColor};
  align-items: center;
  margin-bottom: 9px;
  flex-direction: row;
`;

const ConnectionRequestBannerText = styled(BaseText)`
  font-size: ${fontSizes.medium};
`;

const ConnectionRequestBannerIcon = styled(Icon)`
  font-size: ${fontSizes.medium};
  color: ${baseColors.darkGray};
  margin-left: auto;
  margin-right: ${spacing.rhythm}px;
`;

const ConnectionRequestNotificationCircle = styled(NotificationCircle)`
  margin-left: 10px;
`;

const EmptyStateBGWrapper = styled.View`
  flex-direction: row;
  justify-content: flex-start;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 0 20px 20px;
`;

const MIN_QUERY_LENGTH = 2;

const esBackground = require('assets/images/esLeftLong.png');

type Props = {
  navigation: NavigationScreenProp<*>,
  searchContacts: (query: string) => Function,
  searchResults: SearchResults,
  contactState: ?string,
  user: Object,
  fetchInviteNotifications: Function,
  disconnectContact: Function,
  resetSearchContactsState: Function,
  invitations: Object[],
  localContacts: Object[],
}

type State = {
  query: string,
  showConfirmationModal: boolean,
  manageContactType: string,
  manageContactId: string,
  forceHideRemoval: boolean,
}

class PeopleScreen extends React.Component<Props, State> {
  didBlur: NavigationEventSubscription;
  willFocus: NavigationEventSubscription;

  state = {
    query: '',
    showConfirmationModal: false,
    manageContactType: '',
    manageContactId: '',
    forceHideRemoval: false,
  };

  constructor(props: Props) {
    super(props);
    this.handleContactsSearch = debounce(this.handleContactsSearch, 500);
  }

  componentDidMount() {
    this.willFocus = this.props.navigation.addListener(
      'willFocus',
      () => { this.setState({ forceHideRemoval: false }); },
    );

    this.didBlur = this.props.navigation.addListener(
      'didBlur',
      () => { this.setState({ forceHideRemoval: true }); },
    );
  }

  componentWillUnmount() {
    this.didBlur.remove();
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

  handleContactCardPress = (contact: Object) => () => {
    this.props.navigation.navigate(CONTACT, { contact });
  };

  handleConnectionsRequestBannerPress = () => {
    this.props.navigation.navigate(CONNECTION_REQUESTS);
  };

  manageConnection = (manageContactType: string, contactData: Object) => {
    // condition to avoid confirmation if MUTE should be considered here
    this.setState({
      showConfirmationModal: true,
      forceHideRemoval: false,
      manageContactType,
      manageContactId: contactData.id,
    });
  };

  renderSwipeoutBtns = (data) => {
    const swipeButtons = [
      // { actionType: MUTE, icon: 'mute'},
      { actionType: DISCONNECT, icon: 'remove' },
      // { actionType: BLOCK, icon: 'warning'},
    ];

    return swipeButtons.map((buttonDefinition) => {
      const { actionType, icon, ...btnProps } = buttonDefinition;

      return {
        component: (
          <Button
            square
            extraSmall
            height={80}
            onPress={() => this.manageConnection(actionType, data)}
            title={capitalize(actionType)}
            icon={icon}
            iconSize="small"
            {...btnProps}
            style={{
              marginTop: 2,
            }}
            textStyle={{
              marginTop: 9,
            }}
          />
        ),
        backgroundColor: baseColors.lighterGray,
      };
    });
  };

  renderContact = ({ item }) => (
    // please refer to https://www.pivotaltracker.com/story/show/163147492
    // to understand the reason for the temporary disabling of swipeout feature
    <Swipeout
      disabled
      right={this.renderSwipeoutBtns(item)}
      backgroundColor="transparent"
      sensitivity={10}
      close={this.state.forceHideRemoval}
      style={{
        paddingRight: 14,
      }}
      buttonWidth={80}
    >
      <ListItemWithImage
        label={item.username}
        onPress={this.handleContactCardPress(item)}
        avatarUrl={item.profileLargeImage}
        navigateToProfile={this.handleContactCardPress(item)}
        imageUpdateTimeStamp={item.lastUpdateTime}
      />
    </Swipeout>
  );

  confirmManageAction = () => {
    // here will be called the action to manageContactType (block, disconnect, mute)
    const {
      manageContactType,
      manageContactId,
    } = this.state;

    if (manageContactType === DISCONNECT) {
      this.props.disconnectContact(manageContactId);
    }

    this.setState({
      showConfirmationModal: false,
      forceHideRemoval: true,
    });
  };

  render() {
    const {
      query,
      showConfirmationModal,
      manageContactType,
      manageContactId,
    } = this.state;
    const {
      searchResults,
      contactState,
      navigation,
      invitations,
      localContacts,
    } = this.props;
    const inSearchMode = (query.length >= MIN_QUERY_LENGTH && !!contactState);
    const usersFound = !!searchResults.apiUsers.length || !!searchResults.localContacts.length;
    const pendingConnectionRequests = invitations.filter(({ type }) => type === TYPE_RECEIVED).length;
    const sortedLocalContacts = orderBy(localContacts, [user => user.username.toLowerCase()], 'asc');
    const contact = sortedLocalContacts.find((localContact) => localContact.id === manageContactId) || {};

    return (
      <Container inset={{ bottom: 0 }}>
        <SearchBlock
          headerProps={{ title: 'people' }}
          searchInputPlaceholder="Search or add new contact"
          onSearchChange={(q) => this.handleSearchChange(q)}
          itemSearchState={contactState}
          navigation={navigation}
        />
        {!inSearchMode && !!pendingConnectionRequests &&
          <ConnectionRequestBanner
            onPress={this.handleConnectionsRequestBannerPress}
            underlayColor={baseColors.lightGray}
          >
            <React.Fragment>
              <ConnectionRequestBannerText>
                Connection requests
              </ConnectionRequestBannerText>
              <ConnectionRequestNotificationCircle>
                {pendingConnectionRequests}
              </ConnectionRequestNotificationCircle>
              <ConnectionRequestBannerIcon type="Entypo" name="chevron-thin-right" />
            </React.Fragment>
          </ConnectionRequestBanner>
        }

        {inSearchMode && contactState === FETCHED && usersFound &&
          <PeopleSearchResults
            searchResults={searchResults}
            navigation={navigation}
            invitations={invitations}
            localContacts={sortedLocalContacts}
          />
        }

        {!inSearchMode && !!sortedLocalContacts.length &&
          <FlatList
            data={sortedLocalContacts}
            keyExtractor={(item) => item.id}
            renderItem={this.renderContact}
            initialNumToRender={8}
            ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
            onScroll={() => Keyboard.dismiss()}
            contentContainerStyle={{
              paddingVertical: spacing.rhythm,
              paddingTop: 0,
            }}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={() => {
                  const { fetchInviteNotifications } = this.props;
                  fetchInviteNotifications();
                }}
              />
            }
          />
        }

        {(!inSearchMode || !this.props.searchResults.apiUsers.length) &&
          <KeyboardAvoidingView behavior="padding" enabled={Platform.OS === 'ios'}>
            {!!query && contactState === FETCHING &&
              <Wrapper center><Spinner /></Wrapper>
            }

            {inSearchMode && contactState === FETCHED && !usersFound &&
              <Wrapper center fullScreen style={{ paddingBottom: 100 }}>
                <EmptyStateParagraph title="Nobody found" bodyText="Make sure you entered the name correctly" />
              </Wrapper>
            }

            {!inSearchMode && !sortedLocalContacts.length &&
              <Wrapper center fullScreen style={{ paddingBottom: 100 }}>
                <EmptyStateBGWrapper>
                  <Image source={esBackground} />
                </EmptyStateBGWrapper>
                <EmptyStateParagraph
                  title="Nobody is here"
                  bodyText="Start building your connection list by inviting friends or by searching for someone"
                />
              </Wrapper>
            }
          </KeyboardAvoidingView>
        }
        <ConnectionConfirmationModal
          showConfirmationModal={showConfirmationModal}
          manageContactType={manageContactType}
          contact={contact}
          onConfirm={this.confirmManageAction}
          onModalHide={() => {
            this.setState({
              showConfirmationModal: false,
              forceHideRemoval: true,
            });
          }}
        />
      </Container>
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
}) => ({
  searchResults,
  contactState,
  localContacts,
  invitations,
});

const mapDispatchToProps = (dispatch: Function) => ({
  searchContacts: (query) => dispatch(searchContactsAction(query)),
  resetSearchContactsState: () => dispatch(resetSearchContactsStateAction()),
  fetchInviteNotifications: () => dispatch(fetchInviteNotificationsAction()),
  disconnectContact: (contactId: string) => dispatch(disconnectContactAction(contactId)),
});

export default connect(mapStateToProps, mapDispatchToProps)(PeopleScreen);
