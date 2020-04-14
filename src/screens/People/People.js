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
import { FlatList, Keyboard, RefreshControl, View, ScrollView } from 'react-native';
import Swipeout from 'react-native-swipeout';
import debounce from 'lodash.debounce';
import isEqual from 'lodash.isequal';
import capitalize from 'lodash.capitalize';
import styled, { withTheme } from 'styled-components/native';
import type { NavigationEventSubscription, NavigationScreenProp } from 'react-navigation';

// actions
import {
  searchContactsAction,
  resetSearchContactsStateAction,
  disconnectContactAction,
  muteContactAction,
  blockContactAction,
} from 'actions/contactsActions';
import { fetchInviteNotificationsAction } from 'actions/invitationsActions';
import { logScreenViewAction } from 'actions/analyticsActions';

// components
import Icon from 'components/Icon';
import { Wrapper } from 'components/Layout';
import SearchBlock from 'components/SearchBlock';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Spinner from 'components/Spinner';
import { BaseText } from 'components/Typography';
import NotificationCircle from 'components/NotificationCircle';
import Button from 'components/Button';
import PeopleSearchResults from 'components/PeopleSearchResults';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import ConnectionConfirmationModal from 'screens/Contact/ConnectionConfirmationModal';

// constants
import { CONTACT, CONNECTION_REQUESTS, REFER_FLOW } from 'constants/navigationConstants';
import { TYPE_RECEIVED } from 'constants/invitationsConstants';
import {
  DISCONNECT,
  MUTE,
  BLOCK,
  STATUS_MUTED,
  STATUS_BLOCKED,
} from 'constants/connectionsConstants';

// models/types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { SearchResults } from 'models/Contacts';
import type { Theme } from 'models/Theme';
import type { User } from 'models/User';

// utils
import { fontSizes, spacing, fontStyles } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';
import { sortLocalContacts } from 'utils/contacts';
import { toastReferral } from 'utils/toasts';

// partials
import InviteBanner from './InviteBanner';


const ConnectionRequestBanner = styled.TouchableHighlight`
  height: 60px;
  padding-left: 30px;
  border-bottom-width: 1px;
  border-top-width: 1px;
  border-color: ${themedColors.border};
  align-items: center;
  flex-direction: row;
`;

const ConnectionRequestBannerText = styled(BaseText)`
  ${fontStyles.big};
`;

const ConnectionRequestBannerIcon = styled(Icon)`
  font-size: ${fontSizes.small}px;
  color: ${themedColors.secondaryText};
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
  background-color: ${themedColors.secondaryText}
  padding: 3px;
  margin-right: 1px;
  align-items: center;
  justify-content: center;
`;

const BadgeIcon = styled(Icon)`
  font-size: 10px;
  line-height: 10px;
  color: ${themedColors.control};
`;

const InnerWrapper = styled.View`
  flex: 1;
`;

const EmptyStateWrapper = styled.View`
  flex: 1;
  flex-grow: 1;
  align-items: center;
  justify-content: center;
`;

const MIN_QUERY_LENGTH = 2;

type Props = {
  navigation: NavigationScreenProp<*>,
  searchContacts: (query: string) => void,
  searchResults: SearchResults,
  isSearching: boolean,
  user: Object,
  fetchInviteNotifications: () => void,
  disconnectContact: (contactId: string) => void,
  muteContact: (contactId: string, mute: boolean) => void,
  blockContact: (contactId: string, block: boolean) => void,
  resetSearchContactsState: () => void,
  invitations: Object[],
  localContacts: Object[],
  chats: Object[],
  logScreenView: (view: string, screen: string) => void,
  theme: Theme,
  user: User,
  referralsFeatureEnabled: boolean,
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
    <ItemBadge>
      <BadgeIcon name={iconName} />
    </ItemBadge>
  );
};

class PeopleScreen extends React.Component<Props, State> {
  didBlur: NavigationEventSubscription;
  willFocus: NavigationEventSubscription;
  scrollViewRef: ScrollView;
  flatListRef: FlatList;
  forceRender = false;
  state = {
    query: '',
    showConfirmationModal: false,
    manageContactType: '',
    manageContactId: '',
    forceHideRemoval: false,
  };

  constructor(props: Props) {
    super(props);
    this.handleSearchChange = debounce(this.handleSearchChange, 500);
    this.scrollViewRef = React.createRef();
  }

  componentDidMount() {
    const { logScreenView, navigation } = this.props;
    logScreenView('View people', 'People');

    this.willFocus = navigation.addListener(
      'willFocus',
      () => this.setState({ forceHideRemoval: false }),
    );

    this.didBlur = navigation.addListener(
      'didBlur',
      () => this.setState({ forceHideRemoval: true }),
    );
  }

  componentWillUnmount() {
    this.didBlur.remove();
    this.willFocus.remove();
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    const isFocused = this.props.navigation.isFocused();

    if (!isFocused) {
      if (!isEq) this.forceRender = true;
      return false;
    }

    if (this.forceRender) {
      this.forceRender = false;
      return true;
    }

    return !isEq;
  }

  handleSearchChange = (query: any) => {
    this.setState({ query });

    if (!query || query.trim().length < MIN_QUERY_LENGTH) {
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

  toggleScroll = (ref: Object, shouldAllowScroll: boolean) => {
    if (ref && Object.keys(ref).length) {
      ref.setNativeProps({ scrollEnabled: shouldAllowScroll });
    }
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
      if (actionType === MUTE && data.status === STATUS_MUTED) {
        title = 'unmute';
      } else if (actionType === BLOCK && data.status === STATUS_BLOCKED) {
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
            leftIconName={icon}
            leftIconStyle={{ fontSize: fontSizes.small, marginLeft: 6 }}
            {...btnProps}
            style={{ marginTop: 2 }}
            textStyle={{ marginTop: 6, fontSize: fontSizes.small }}
          />
        ),
        backgroundColor: 'transparent',
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
          this.toggleScroll(this.scrollViewRef, shouldAllowScroll);
          this.toggleScroll(this.flatListRef, shouldAllowScroll);
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
          customAddon={([STATUS_MUTED, STATUS_BLOCKED].includes(status)) ? <ConnectionStatus status={status} /> : null}
          rightColumnInnerStyle={{ flexDirection: 'row-reverse' }}
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
      const mute = status !== STATUS_MUTED; // toggle
      this.props.muteContact(manageContactId, mute);
    } else if (manageContactType === BLOCK) {
      const block = status !== STATUS_BLOCKED; // toggle
      this.props.blockContact(manageContactId, block);
    }

    setTimeout(() => {
      this.setState({
        showConfirmationModal: false,
        forceHideRemoval: true,
      });
    }, 1000);
  };

  handleInvitePress = () => {
    const { navigation, user } = this.props;
    const { isEmailVerified, isPhoneVerified } = user;
    if (isEmailVerified || isPhoneVerified) {
      navigation.navigate(REFER_FLOW);
    } else {
      toastReferral(navigation);
    }
  };

  renderEmptyState = ({ inviteTitle, esTitle, esBody }) => {
    const { referralsFeatureEnabled } = this.props;

    return (
      <Wrapper fullScreen style={{ marginTop: 8, marginBottom: spacing.large }}>
        {!referralsFeatureEnabled
          ? (
            <EmptyStateWrapper>
              <EmptyStateParagraph
                title={esTitle}
                bodyText={esBody}
              />
            </EmptyStateWrapper>
          )
          : (
            <InviteBanner
              title={inviteTitle}
              onInvitePress={this.handleInvitePress}
            />
          )
        }
      </Wrapper>
    );
  };

  renderContent = (sortedLocalContacts: Object[], inSearchMode: boolean) => {
    const {
      searchResults,
      searchResults: { apiUsers, localContacts },
      isSearching,
      navigation,
      invitations,
      chats,
      theme,
    } = this.props;

    const usersFound = (apiUsers.length + localContacts.length) > 0;
    const pendingConnectionRequests = invitations.filter(({ type }) => type === TYPE_RECEIVED).length;
    const colors = getThemeColors(theme);

    return (
      <React.Fragment>
        <SearchBlock
          headerProps={{ title: 'people' }}
          searchInputPlaceholder="Search or add people"
          onSearchChange={(q) => this.handleSearchChange(q)}
          itemSearchState={isSearching}
          wrapperStyle={{ paddingHorizontal: spacing.layoutSides, paddingVertical: spacing.mediumLarge }}
        />
        {!inSearchMode && !!pendingConnectionRequests &&
        <ConnectionRequestBanner
          onPress={this.handleConnectionsRequestBannerPress}
          underlayColor={colors.secondaryAccent}
        >
          <React.Fragment>
            <ConnectionRequestBannerText>
              Connection requests
            </ConnectionRequestBannerText>
            <ConnectionRequestNotificationCircle>
              {pendingConnectionRequests}
            </ConnectionRequestNotificationCircle>
            <ConnectionRequestBannerIcon name="chevron-right" />
          </React.Fragment>
        </ConnectionRequestBanner>
        }
        <InnerWrapper>
          {inSearchMode && usersFound &&
          <PeopleSearchResults
            searchResults={searchResults}
            navigation={navigation}
            invitations={invitations}
            localContacts={sortedLocalContacts}
          />
          }
          {!inSearchMode && !!sortedLocalContacts.length &&
          <FlatList
            ref={(ref) => { this.flatListRef = ref; }}
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
          {(!inSearchMode || !apiUsers.length) &&
          <View
            style={{ flex: 1 }}
          >
            {isSearching && <Wrapper center style={{ flex: 1 }}><Spinner /></Wrapper>}

            {inSearchMode && !isSearching && !usersFound && this.renderEmptyState({
              inviteTitle: 'Pillar is social',
              esTitle: 'Nobody found',
              esBody: 'Make sure you entered the name correctly',
            })}
            {!inSearchMode && !sortedLocalContacts.length && this.renderEmptyState({
              inviteTitle: 'Invite friends',
              esTitle: 'Start making friends',
              esBody: 'Build your connection list by searching for someone',
            })}
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
      localContacts,
      chats,
      fetchInviteNotifications,
    } = this.props;
    const inSearchMode = query.length >= MIN_QUERY_LENGTH;

    const sortedLocalContacts = sortLocalContacts(localContacts, chats);
    const contact = sortedLocalContacts.find(({ id }) => id === manageContactId);

    return (
      <ContainerWithHeader
        headerProps={{ noBack: true, leftItems: [{ title: 'People' }] }}
        inset={{ bottom: 0 }}
        tab
      >
        {onScroll => (
          <ScrollView
            keyboardShouldPersistTaps="always"
            contentContainerStyle={{ flexGrow: 1 }}
            ref={(ref) => { this.scrollViewRef = ref; }}
            onScroll={(ev) => {
              if (inSearchMode) {
                Keyboard.dismiss();
              }
              onScroll(ev);
            }}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={() => { fetchInviteNotifications(); }}
              />
          }
          >
            {this.renderContent(sortedLocalContacts, inSearchMode)}
            {contact && <ConnectionConfirmationModal
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
            />}
          </ScrollView>
        )}
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  contacts: {
    searchResults,
    isSearching,
    data: localContacts,
  },
  invitations: { data: invitations },
  chat: { data: { chats } },
  user: { data: user },
  featureFlags: {
    data: { REFERRALS_ENABLED: referralsFeatureEnabled },
  },
}: RootReducerState): $Shape<Props> => ({
  searchResults,
  isSearching,
  localContacts,
  invitations,
  chats,
  user,
  referralsFeatureEnabled,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  searchContacts: (query: string) => dispatch(searchContactsAction(query)),
  resetSearchContactsState: () => dispatch(resetSearchContactsStateAction()),
  fetchInviteNotifications: () => dispatch(fetchInviteNotificationsAction()),
  disconnectContact: (contactId: string) => dispatch(disconnectContactAction(contactId)),
  muteContact: (contactId: string, mute: boolean) => dispatch(muteContactAction(contactId, mute)),
  blockContact: (contactId: string, block: boolean) => dispatch(blockContactAction(contactId, block)),
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(PeopleScreen));
