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
import { FlatList, Keyboard, RefreshControl } from 'react-native';
import Swipeout from 'react-native-swipeout';
import debounce from 'lodash.debounce';
import isEqual from 'lodash.isequal';
import capitalize from 'lodash.capitalize';
import styled, { withTheme } from 'styled-components/native';
import type { NavigationEventSubscription, NavigationScreenProp } from 'react-navigation';

// actions
import {
  searchContactsAction, // done
  resetSearchContactsStateAction, // done
  disconnectContactAction, // leave
  muteContactAction,
  blockContactAction,
} from 'actions/contactsActions';
import { fetchInviteNotificationsAction,
  sendInvitationAction,
  acceptInvitationAction,
  cancelInvitationAction,
  rejectInvitationAction } from 'actions/invitationsActions';
import { logScreenViewAction } from 'actions/analyticsActions';
import { fetchReferralRewardAction, goToInvitationFlowAction } from 'actions/referralsActions';

// components
import Icon from 'components/Icon';
import { Wrapper } from 'components/Layout';
import SearchBlock from 'components/SearchBlock';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Spinner from 'components/Spinner';
import { BaseText, SubHeadingMedium } from 'components/Typography';
import Button from 'components/Button';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import ConnectionConfirmationModal from 'screens/Contact/ConnectionConfirmationModal';
import Overlay from 'components/SearchBlock/Overlay';
import IconButton from 'components/IconButton';

// constants
import { CONTACT } from 'constants/navigationConstants';
import { TYPE_INVITE, TYPE_REJECTED, TYPE_SENT } from 'constants/invitationsConstants';
import {
  DISCONNECT,
  MUTE,
  BLOCK,
  STATUS_MUTED,
  STATUS_BLOCKED,
} from 'constants/connectionsConstants';

// models/types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { SearchResults, ApiUser } from 'models/Contacts';
import type { Theme } from 'models/Theme';

// utils
import { fontSizes, spacing, fontStyles, itemSizes } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';
import { sortLocalContacts } from 'utils/contacts'; // done

import unionBy from 'lodash.unionby';
import intersectionBy from 'lodash.intersectionby';
import Separator from 'components/Separator';
import ProfileImage from 'components/ProfileImage';
import { createAlert } from 'utils/alerts';

// partials
import InviteBanner from './InviteBanner';
import ConnectionRequests from './ConnectionRequests';


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

const LocalContacts = styled.View`
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-style: solid;
  border-color: ${themedColors.border};
`;

const LocalContactsScrollView = styled.ScrollView`
  margin-bottom: ${spacing.small}px;
`;

const LocalContactsSubHeading = styled(SubHeadingMedium)`
  margin: 22px 16px 0;
`;

const ListSubHeading = styled(SubHeadingMedium)`
  margin: 6px ${spacing.mediumLarge}px 8px;
`;

const LocalContactsItem = styled.TouchableOpacity`
  align-items: center;
  width: ${itemSizes.avatarCircleMedium + 4}px;
  margin: 0 8px;
`;

const LocalContactsItemName = styled(BaseText)`
  ${fontStyles.small};
  color: ${themedColors.secondaryText};
  padding: 0 4px;
  margin-top: 3px;
`;

const MIN_QUERY_LENGTH = 2;
const OVERLAY_OFFSET = 72;
const ITEM_HEIGHT = 82;

type Props = {
  navigation: NavigationScreenProp<*>,
  searchContacts: (query: string) => void,
  searchResults: SearchResults,
  isSearching: boolean,
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
  goToInvitationFlow: () => void,
  sendInvitation: (user: ApiUser) => void,
  acceptInvitation: (invitation: Object) => void,
  cancelInvitation: (invitation: Object) => void,
  rejectInvitation: (invitation: Object) => void,
  fetchReferralReward: (invitation: Object) => void,
  isPillarRewardCampaignActive: boolean,
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
  isSearchFocused: boolean,
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
  flatListRef: FlatList;
  searchBarRef: Object;

  forceRender = false;
  state = {
    query: '',
    showConfirmationModal: false,
    manageContactType: '',
    manageContactId: '',
    forceHideRemoval: false,
    isSearchFocused: false,
  };

  constructor(props: Props) {
    super(props);
    this.handleSearchChange = debounce(this.handleSearchChange, 500);
    this.searchBarRef = React.createRef();
    this.flatListRef = React.createRef();
  }

  componentDidMount() {
    const { logScreenView, navigation, fetchReferralReward } = this.props;
    logScreenView('View people', 'People');

    this.willFocus = navigation.addListener(
      'willFocus',
      () => this.setState({ forceHideRemoval: false }),
    );

    this.didBlur = navigation.addListener(
      'didBlur',
      () => this.setState({ forceHideRemoval: true }),
    );
    fetchReferralReward();
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
      ref.current.setNativeProps({ scrollEnabled: shouldAllowScroll });
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

  renderSearchModeContact = ({ item: user }) => {
    const { invitations, navigation } = this.props;
    const invitation = invitations.find(({ id }) => id === user.id);
    let status = TYPE_INVITE;
    if (invitation) {
      status = invitation.type;
    }

    return (
      <ListItemWithImage
        label={user.username}
        avatarUrl={user.profileImage}
        navigateToProfile={() => navigation.navigate(CONTACT, { contact: user })}
        rejectInvitation={this.handleRejectInvitationPress(user)}
        acceptInvitation={this.handleAcceptInvitationPress(user)}
        buttonAction={status === TYPE_SENT
          ? this.handleCancelInvitationPress(user)
          : this.handleSendInvitationPress(user)}
        buttonActionLabel={status === TYPE_SENT ? 'Requested' : 'Connect'}
        secondaryButton={status === TYPE_SENT}
      />
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

  renderEmptyState = (inviteTitle) => {
    const { goToInvitationFlow, isPillarRewardCampaignActive } = this.props;

    return (
      <Wrapper fullScreen style={{ marginTop: 8, marginBottom: spacing.large }}>
        <InviteBanner
          title={inviteTitle}
          onInvitePress={goToInvitationFlow}
          isReferralActive={isPillarRewardCampaignActive}
        />
      </Wrapper>
    );
  };

  renderSearchBlock = () => {
    const {
      isSearching,
    } = this.props;
    return (
      <SearchBlock
        headerProps={{ title: 'people' }}
        searchInputPlaceholder="ENS or username"
        onSearchChange={(q) => this.handleSearchChange(q)}
        onSearchFocus={() => {
          this.setState({ isSearchFocused: true });
          this.flatListRef.current.scrollToOffset({ offset: 0 });
        }}
        onSearchBlur={() => this.setState({ isSearchFocused: false })}
        itemSearchState={isSearching}
        wrapperStyle={{ paddingHorizontal: spacing.layoutSides, paddingVertical: spacing.mediumLarge }}
        hideOverlay
        ref={this.searchBarRef}
      />
    );
  }

  handleSendInvitationPress = (user: ApiUser) => () => {
    Keyboard.dismiss();
    this.props.sendInvitation(user);
  };

  handleAcceptInvitationPress = (user: ApiUser) => () => {
    const { acceptInvitation, invitations } = this.props;
    const invitation = invitations.find(({ id }) => id === user.id);
    Keyboard.dismiss();
    acceptInvitation(invitation);
  };

  handleCancelInvitationPress = (user: ApiUser) => () => {
    const { cancelInvitation, invitations } = this.props;
    const invitation = invitations.find(({ id }) => id === user.id);
    Keyboard.dismiss();
    cancelInvitation(invitation);
  };

  handleRejectInvitationPress = (user: ApiUser) => () => {
    const { rejectInvitation, invitations } = this.props;
    const invitation = invitations.find(({ id }) => id === user.id);
    Keyboard.dismiss();
    if (invitation && Object.keys(invitation).length > 0) {
      createAlert(TYPE_REJECTED, invitation, () => rejectInvitation(invitation));
    }
  };

  renderLocalContactsList = () => {
    const {
      searchResults: { apiUsers, localContacts: resultsLocalContacts },
      localContacts,
    } = this.props;

    const updatedLocalContact = intersectionBy(localContacts, apiUsers, 'id');
    const filteredLocalContacts = unionBy(resultsLocalContacts, updatedLocalContact, 'id');

    if (filteredLocalContacts.length) {
      return (
        <LocalContacts>
          <LocalContactsSubHeading>MY CONTACTS</LocalContactsSubHeading>
          <LocalContactsScrollView
            keyboardShouldPersistTaps="always"
            horizontal
            contentContainerStyle={{ paddingHorizontal: spacing.large / 2, paddingVertical: spacing.medium }}
          >
            {this.renderLocalContacts(filteredLocalContacts)}
          </LocalContactsScrollView>
        </LocalContacts>
      );
    }
    return null;
  };

  renderLocalContacts = (filteredLocalContacts) => {
    const { navigation } = this.props;
    return filteredLocalContacts
      .map(contact => (
        <LocalContactsItem
          key={contact.username}
          onPress={() => navigation.navigate(CONTACT, { contact })}
        >
          <ProfileImage
            uri={contact.profileImage}
            userName={contact.username}
            diameter={itemSizes.avatarCircleMedium}
            textStyle={{ fontSize: fontSizes.big }}
            noShadow
            borderWidth={0}
          />
          <LocalContactsItemName numberOfLines={1}>{contact.username}</LocalContactsItemName>
        </LocalContactsItem>
      ));
  };

  getItemLayout = (data, index) => {
    const { query } = this.state;
    const inSearchMode = query.length >= MIN_QUERY_LENGTH;
    return ({ length: ITEM_HEIGHT, offset: (ITEM_HEIGHT * index) + (inSearchMode ? index : 0), index });
  }

  renderContent = (onScroll, sortedLocalContacts) => {
    const {
      query,
    } = this.state;
    const {
      chats,
      fetchInviteNotifications,
      fetchReferralReward,
      searchResults: { apiUsers },
      isSearching,
    } = this.props;
    const inSearchMode = query.length >= MIN_QUERY_LENGTH;
    const localContactsIds = sortedLocalContacts.map(({ id }) => id);
    const filteredApiUsers = apiUsers.filter((user) => !localContactsIds.includes(user.id));

    return (
      <FlatList
        ref={this.flatListRef}
        data={inSearchMode ? filteredApiUsers : sortedLocalContacts}
        renderItem={inSearchMode ? this.renderSearchModeContact : this.renderContact}
        keyExtractor={({ username }) => username}
        onScroll={(e) => {
          Keyboard.dismiss();
          onScroll(e);
        }}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={{
          flexGrow: 1,
        }}
        extraData={chats}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              fetchInviteNotifications();
              fetchReferralReward();
            }}
          />
          }
        ListEmptyComponent={
          <>
            {inSearchMode && !isSearching && this.renderEmptyState('Pillar is social')}
            {!inSearchMode && !isSearching && this.renderEmptyState('Invite friends')}
            {isSearching && <Wrapper center style={{ flex: 1 }}><Spinner /></Wrapper>}
          </>
          }
        ListHeaderComponent={
          <>
            {this.renderSearchBlock()}
            {!inSearchMode && <ConnectionRequests />}
            {inSearchMode && this.renderLocalContactsList()}
            {inSearchMode && !!filteredApiUsers.length && <ListSubHeading>ALL USERS</ListSubHeading>}
          </>
          }
        ItemSeparatorComponent={() => inSearchMode ? <Separator spaceOnLeft={82} /> : null}
        getItemLayout={this.getItemLayout}
      />
    );
  }

  handleOverlayClick = () => {
    this.handleSearchChange('');
    this.setState({ isSearchFocused: false });
    this.searchBarRef.current.handleSearchBlur();
  }

  render() {
    const {
      query,
      showConfirmationModal,
      manageContactType,
      manageContactId,
      isSearchFocused,
    } = this.state;
    const {
      localContacts,
      chats,
      theme,
      goToInvitationFlow,
    } = this.props;
    const inSearchMode = query.length >= MIN_QUERY_LENGTH;

    const sortedLocalContacts = sortLocalContacts(localContacts, chats);
    const contact = sortedLocalContacts.find(({ id }) => id === manageContactId);

    const colors = getThemeColors(theme);

    return (
      <ContainerWithHeader
        headerProps={{
          noBack: true,
          leftItems: [{ title: 'People' }],
          rightItems: [{
            custom: (
              <IconButton
                icon="present"
                color={colors.positive}
                iconText="Invite friends"
                style={{ flexDirection: 'row' }}
                iconTextStyle={{ color: colors.positive, ...fontStyles.regular }}
                iconStyle={{ marginRight: 4 }}
                onPress={goToInvitationFlow}
              />
            ),
            itemStyle: { alignItems: 'center' },
          }],
         }}
        inset={{ bottom: 0 }}
        tab
      >
        {onScroll => (
          <InnerWrapper>
            {this.renderContent(onScroll, sortedLocalContacts)}
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
            <Overlay
              active={isSearchFocused && !inSearchMode}
              topOffset={OVERLAY_OFFSET}
              handleClick={this.handleOverlayClick}
            />
          </InnerWrapper>
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
  referrals: { isPillarRewardCampaignActive },
}: RootReducerState): $Shape<Props> => ({
  searchResults,
  isSearching,
  localContacts,
  invitations,
  chats,
  isPillarRewardCampaignActive,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  searchContacts: (query: string) => dispatch(searchContactsAction(query)),
  resetSearchContactsState: () => dispatch(resetSearchContactsStateAction()),
  fetchInviteNotifications: () => dispatch(fetchInviteNotificationsAction()),
  disconnectContact: (contactId: string) => dispatch(disconnectContactAction(contactId)),
  muteContact: (contactId: string, mute: boolean) => dispatch(muteContactAction(contactId, mute)),
  blockContact: (contactId: string, block: boolean) => dispatch(blockContactAction(contactId, block)),
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
  goToInvitationFlow: () => dispatch(goToInvitationFlowAction()),
  sendInvitation: (user: ApiUser) => dispatch(sendInvitationAction(user)),
  acceptInvitation: (invitation: Object) => dispatch(acceptInvitationAction(invitation)),
  cancelInvitation: (invitation: Object) => dispatch(cancelInvitationAction(invitation)),
  rejectInvitation: (invitation: Object) => dispatch(rejectInvitationAction(invitation)),
  fetchReferralReward: () => dispatch(fetchReferralRewardAction()),
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(PeopleScreen));
