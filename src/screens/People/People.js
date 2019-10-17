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
  RefreshControl,
  View,
  ScrollView,
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
import { baseColors, UIColors, fontSizes, spacing, fontStyles } from 'utils/variables';
import { Wrapper } from 'components/Layout';
import SearchBlock from 'components/SearchBlock';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Spinner from 'components/Spinner';
import { BaseText } from 'components/Typography';
import NotificationCircle from 'components/NotificationCircle';
import Button from 'components/Button/Button';
import PeopleSearchResults from 'components/PeopleSearchResults';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import type { SearchResults } from 'models/Contacts';
import ConnectionConfirmationModal from 'screens/Contact/ConnectionConfirmationModal';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';

const ConnectionRequestBanner = styled.TouchableHighlight`
  height: 60px;
  padding-left: 30px;
  border-bottom-width: 1px;
  border-top-width: 1px;
  border-color: ${UIColors.defaultBorderColor};
  align-items: center;
  flex-direction: row;
`;

const ConnectionRequestBannerText = styled(BaseText)`
  ${fontStyles.big};
`;

const ConnectionRequestBannerIcon = styled(NIcon)`
  font-size: ${fontSizes.big}px;
  color: ${baseColors.darkGray};
  margin-left: auto;
  margin-right: ${spacing.rhythm}px;
`;

const ConnectionRequestNotificationCircle = styled(NotificationCircle)`
  margin-left: 10px;
`;

const ItemBadge = styled.View`
  height: 20px;
  width: 20px;
  border-radius: 10px;
  background-color: ${props => props.backgroundColor || baseColors.electricBlue}
  padding: 3px 0;
  margin-top: 2px;
  margin-right: 1px;
  align-items: center;
  justify-content: center;
`;

const BadgeIcon = styled(Icon)`
  font-size: ${props => props.fontSize || fontSizes.small}px;
  line-height: ${props => props.fontSize || fontSizes.small}px;
  color: ${baseColors.white};
`;

const InnerWrapper = styled.View`
  flex: 1;
  background-color: ${baseColors.white};
`;

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
      iconName = 'sound-off';
      break;
    default:
      break;
  }
  return (
    <ItemBadge backgroundColor={baseColors.pinkishGrey}>
      <BadgeIcon name={iconName} />
    </ItemBadge>
  );
};

class PeopleScreen extends React.Component<Props, State> {
  didBlur: NavigationEventSubscription;
  willFocus: NavigationEventSubscription;
  scrollViewRef: ScrollView;

  constructor(props: Props) {
    super(props);
    this.handleContactsSearch = debounce(this.handleContactsSearch, 500);
    this.scrollViewRef = React.createRef();
    this.state = {
      query: '',
      showConfirmationModal: false,
      manageContactType: '',
      manageContactId: '',
      forceHideRemoval: false,
    };
  }

  componentDidMount() {
    const { logScreenView, navigation } = this.props;
    logScreenView('View people', 'People');

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
      { actionType: MUTE, icon: 'mute', squarePrimary: true },
      { actionType: DISCONNECT, icon: 'remove', squarePrimary: true },
      { actionType: BLOCK, icon: 'warning', squareDanger: true },
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
        backgroundColor: baseColors.white,
      };
    });
  };

  renderContact = ({ item }) => {
    const { unread = 0, status = '' } = item;
    const unreadCount = unread > 9 ? '9+' : unread;
    const newMessageText = unread > 1 ? 'New Messages' : 'New Message';
    const lastMessage = unread
      ? newMessageText
      : (item.lastMessage && item.lastMessage.content) || '';
    return (
      <Swipeout
        right={this.renderSwipeoutBtns(item)}
        backgroundColor="transparent"
        sensitivity={10}
        close={this.state.forceHideRemoval}
        buttonWidth={80}
        scroll={(shouldAllowScroll) => {
          if (this.scrollViewRef && Object.keys(this.scrollViewRef).length) {
            this.scrollViewRef.setNativeProps({ scrollEnabled: shouldAllowScroll });
          }
        }}
      >
        <ListItemWithImage
          label={item.username}
          paragraph={lastMessage}
          onPress={this.handleContactCardPress(item)}
          avatarUrl={item.profileImage}
          navigateToProfile={this.handleContactCardPress(item)}
          imageUpdateTimeStamp={item.lastUpdateTime}
          unreadCount={unreadCount}
          customAddon={(status === 'muted' || status === 'blocked') ? <ConnectionStatus status={status} /> : null}
          rightColumnInnerStyle={{ flexDirection: 'row-reverse', paddingTop: spacing.small }}
          noSeparator
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

  renderContent = (sortedLocalContacts: Object[], inSearchMode: boolean) => {
    const { query } = this.state;
    const {
      searchResults,
      contactState,
      navigation,
      invitations,
      chats,
    } = this.props;

    const usersFound = !!searchResults.apiUsers.length || !!searchResults.localContacts.length;
    const pendingConnectionRequests = invitations.filter(({ type }) => type === TYPE_RECEIVED).length;

    return (
      <React.Fragment>
        <SearchBlock
          headerProps={{ title: 'people' }}
          searchInputPlaceholder="Search or add people"
          onSearchChange={(q) => this.handleSearchChange(q)}
          itemSearchState={!!contactState}
          wrapperStyle={{ paddingHorizontal: spacing.large, paddingVertical: spacing.mediumLarge }}
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
        <InnerWrapper>
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
            extraData={chats}
            keyExtractor={(item) => item.id}
            renderItem={this.renderContact}
            initialNumToRender={8}
            onScroll={() => Keyboard.dismiss()}
            contentContainerStyle={{
              paddingVertical: spacing.rhythm,
              paddingTop: 0,
            }}
          />
          }
          {(!inSearchMode || !this.props.searchResults.apiUsers.length) &&
          <View
            style={{ flex: 1 }}
          >
            {!!query && contactState === FETCHING &&
            <Wrapper center style={{ flex: 1 }}><Spinner /></Wrapper>
            }

            {inSearchMode && contactState === FETCHED && !usersFound &&
            <Wrapper center fullScreen>
              <EmptyStateParagraph title="Nobody found" bodyText="Make sure you entered the name correctly" />
            </Wrapper>
            }

            {!inSearchMode && !sortedLocalContacts.length &&
            <Wrapper center fullScreen style={{ paddingBottom: 100 }}>
              <EmptyStateParagraph
                title="Start making friends"
                bodyText="Build your connection list by searching for someone"
              />
            </Wrapper>
            }
          </View>
          }
        </InnerWrapper>
      </React.Fragment>
    );
  };

  render() {
    const {
      query,
      showConfirmationModal,
      manageContactType,
      manageContactId,
    } = this.state;
    const {
      contactState,
      localContacts,
      chats,
      fetchInviteNotifications,
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
    const contact = sortedLocalContacts.find((localContact) => localContact.id === manageContactId) || {};

    return (
      <ContainerWithHeader
        backgroundColor={baseColors.white}
        headerProps={{ leftItems: [{ user: true }] }}
        inset={{ bottom: 0 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="always"
          contentContainerStyle={{ flexGrow: 1 }}
          ref={(ref) => { this.scrollViewRef = ref; }}
          onScroll={() => {
            if (inSearchMode) {
              Keyboard.dismiss();
            }
          }}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => { fetchInviteNotifications(); }}
            />
          }
        >
          {this.renderContent(sortedLocalContacts, inSearchMode)}
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

export default connect(mapStateToProps, mapDispatchToProps)(PeopleScreen);
