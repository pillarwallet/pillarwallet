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
import { Icon as NIcon } from 'native-base';
import Icon from 'components/Icon';
import {
  searchContactsAction,
  resetSearchContactsStateAction,
  disconnectContactAction,
  muteContactAction,
  blockContactAction,
} from 'actions/contactsActions';
import { fetchInviteNotificationsAction } from 'actions/invitationsActions';
import { logScreenViewAction } from 'actions/analyticsActions';
import { CONTACT, CONNECTION_REQUESTS } from 'constants/navigationConstants';
import { TYPE_RECEIVED } from 'constants/invitationsConstants';
import { FETCHING, FETCHED } from 'constants/contactsConstants';
import { DISCONNECT, MUTE, BLOCK } from 'constants/connectionsConstants';
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

const ConnectionRequestBannerIcon = styled(NIcon)`
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

const ItemBadge = styled.View`
  height: 20px;
  width: 20px;
  border-radius: 10px;
  background-color: ${baseColors.electricBlue}
  padding: 3px 0;
  margin-top: 2px;
  margin-right: 1px;
  align-items: center;
  justify-content: center;
`;

const BadgeIcon = styled(Icon)`
  font-size: ${fontSizes.extraExtraSmall};
  line-height: ${fontSizes.extraExtraSmall};
  color: ${baseColors.white};
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
  muteContact: Function,
  blockContact: Function,
  resetSearchContactsState: Function,
  invitations: Object[],
  localContacts: Object[],
  chats: Object[],
  logScreenView: (view: string, screen: string) => void,
}

type ConnectionStatusProps = {
  status: string,
}

type State = {
  query: string,
  showConfirmationModal: boolean,
  manageContactType: string,
  manageContactId: string,
  forceHideRemoval: boolean,
}

const ConnectionStatus = (props: ConnectionStatusProps) => {
  let iconName = '';
  switch (props.status) {
    case 'blocked':
      iconName = 'warning';
      break;
    case 'muted':
      iconName = 'mute';
      break;
    default:
      break;
  }
  return (
    <ItemBadge>
      <BadgeIcon name={iconName} />
    </ItemBadge>
  );
};

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
    const { logScreenView, navigation } = this.props;
    logScreenView('people', 'People');

    this.willFocus = navigation.addListener(
      'willFocus',
      () => { this.setState({ forceHideRemoval: false }); },
    );

    this.didBlur = navigation.addListener(
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
      { actionType: MUTE, icon: 'mute' },
      { actionType: DISCONNECT, icon: 'remove' },
      { actionType: BLOCK, icon: 'warning' },
    ];

    return swipeButtons.map((buttonDefinition) => {
      const { actionType, icon, ...btnProps } = buttonDefinition;
      let title = actionType;
      if (actionType === MUTE && data.status === 'muted') {
        title = 'unmute';
      } else if (actionType === BLOCK && data.status === 'blocked') {
        title = 'unblock';
      }

      return {
        component: (
          <Button
            square
            extraSmall
            height={80}
            onPress={() => this.manageConnection(actionType, data)}
            title={capitalize(title)}
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

  renderContact = ({ item }) => {
    const { unread = 0, status = '' } = item;
    const unreadCount = unread > 9 ? '9+' : unread;
    return (
      <Swipeout
        right={this.renderSwipeoutBtns(item)}
        backgroundColor="transparent"
        sensitivity={10}
        close={this.state.forceHideRemoval}
        buttonWidth={80}
      >
        <ListItemWithImage
          label={item.username}
          onPress={this.handleContactCardPress(item)}
          avatarUrl={item.profileImage}
          navigateToProfile={this.handleContactCardPress(item)}
          imageUpdateTimeStamp={item.lastUpdateTime}
          unreadCount={unreadCount}
          customAddon={(status === 'muted' || status === 'blocked') ? <ConnectionStatus status={status} /> : null}
          rightColumnInnerStyle={{ flexDirection: 'row' }}
        />
      </Swipeout>
    );
  };

  confirmManageAction = (status: ?string = '') => {
    // here will be called the action to manageContactType (block, disconnect, mute)
    const {
      manageContactType,
      manageContactId,
    } = this.state;

    if (manageContactType === DISCONNECT) {
      this.props.disconnectContact(manageContactId);
    } else if (manageContactType === MUTE) {
      const mute = !(status === 'muted');
      this.props.muteContact(manageContactId, mute);
    } else if (manageContactType === BLOCK) {
      const block = !(status === 'blocked');
      this.props.blockContact(manageContactId, block);
    }

    setTimeout(() => {
      this.setState({
        showConfirmationModal: false,
        forceHideRemoval: true,
      });
    }, 1000);
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
      chats,
    } = this.props;
    const inSearchMode = (query.length >= MIN_QUERY_LENGTH && !!contactState);
    const usersFound = !!searchResults.apiUsers.length || !!searchResults.localContacts.length;
    const pendingConnectionRequests = invitations.filter(({ type }) => type === TYPE_RECEIVED).length;
    const localContactsWithUnreads = localContacts.map((contact) => {
      const chatWithUserInfo = chats.find((chat) => chat.username === contact.username) || {};
      if (Object.keys(chatWithUserInfo).length) {
        if (chatWithUserInfo.unread) {
          return {
            ...contact,
            unread: chatWithUserInfo.unread,
            serverTimestamp: chatWithUserInfo.lastMessage ? chatWithUserInfo.lastMessage.serverTimestamp : null,
          };
        }
        return {
          ...contact,
          serverTimestamp: chatWithUserInfo.lastMessage ? chatWithUserInfo.lastMessage.serverTimestamp : null,
        };
      }
      return {
        ...contact,
        serverTimestamp: null,
      };
    });
    const sortedLocalContacts = orderBy(
      localContactsWithUnreads,
      [(user) => {
        if (user.serverTimestamp) {
          return user.serverTimestamp;
        }
        return user.createdAt * 1000;
      }],
      'desc');
    const contact = sortedLocalContacts.find((localContact) => localContact.id === manageContactId) || {};

    return (
      <Container inset={{ bottom: 0 }}>
        <SearchBlock
          headerProps={{ title: 'people' }}
          searchInputPlaceholder="Search or add new contact"
          onSearchChange={(q) => this.handleSearchChange(q)}
          itemSearchState={!!contactState}
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

export default connect(mapStateToProps, mapDispatchToProps)(PeopleScreen);
