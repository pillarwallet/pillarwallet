// @flow
import * as React from 'react';
import orderBy from 'lodash.orderby';
import isEqual from 'lodash.isequal';
import { FlatList, RefreshControl, View } from 'react-native';
import { Container, ScrollWrapper } from 'components/Layout';
import { connect } from 'react-redux';
import { isToday, isYesterday, isThisYear, format as formatDate } from 'date-fns';
import type { NavigationScreenProp, NavigationEventSubscription } from 'react-navigation';
import { CHAT, NEW_CHAT, CONTACT } from 'constants/navigationConstants';
import EmptyChat from 'components/EmptyState/EmptyChat';
import Header from 'components/Header';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Separator from 'components/Separator';
import SearchBar from 'components/SearchBar';
import { getExistingChatsAction, resetUnreadAction } from 'actions/chatActions';
import { setUnreadChatNotificationsStatusAction } from 'actions/notificationsActions';
import styled from 'styled-components/native';
import { spacing } from 'utils/variables';

const SearchBarWrapper = styled.View`
  padding: 15px ${spacing.rhythm}px 0;
`;

type Props = {
  navigation: NavigationScreenProp<*>,
  setUnreadChatNotificationsStatus: Function,
  contacts: Object[],
  chats: Object[],
  notifications: Object[],
  getExistingChats: Function,
  resetUnread: Function,
}

type State = {
  showChat: boolean,
  receiver: string,
  receiverAvatar: string,
  chatList: Array<Object>,
  query: string,
  filteredChats: ?Object[],
}

class ChatListScreen extends React.Component<Props, State> {
  _willFocus: NavigationEventSubscription;

  state = {
    showChat: false,
    receiver: '',
    receiverAvatar: '',
    chatList: [],
    query: '',
    filteredChats: null,
  };

  componentDidMount() {
    this.props.getExistingChats();
    this._willFocus = this.props.navigation.addListener(
      'willFocus',
      () => {
        this.props.setUnreadChatNotificationsStatus(false);
      },
    );
  }

  componentWillUnmount() {
    this._willFocus.remove();
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    return !isEq;
  }

  handleChatItemClick = (contact) => {
    const { navigation, resetUnread } = this.props;
    navigation.navigate(CHAT, { username: contact.username });
    resetUnread(contact.username);
  };

  goToNewChatList = () => {
    this.props.navigation.navigate(NEW_CHAT);
  };

  handleUserSearch = (query: string, sortedChats: Object) => {
    if (!query || query.trim() === '' || query.length < 2) {
      this.setState({ filteredChats: null, query });
      return;
    }

    const filteredChats = sortedChats
      .filter((chat) => chat.username.toUpperCase().indexOf(query.toUpperCase()) !== -1);

    this.setState({ filteredChats, query });
  };

  renderItem = ({ item: contact }: Object) => {
    const { chats, contacts, navigation } = this.props;

    const chatWithContact = chats.find(({ username }) => contact.username === username) || {};
    const { lastMessage, unread } = chatWithContact;
    const contactInfo = contacts.find(({ username }) => contact.username === username) || {};

    let timeSent = '';

    if (lastMessage.serverTimestamp) {
      const lastMessageDate = new Date(lastMessage.serverTimestamp);
      if (isToday(lastMessageDate)) {
        timeSent = formatDate(lastMessageDate, 'HH:mm');
      } else if (isYesterday(lastMessageDate)) {
        timeSent = 'yesterday';
      } else if (isThisYear(lastMessageDate)) {
        timeSent = formatDate(lastMessageDate, 'D MMM');
      } else {
        timeSent = formatDate(lastMessageDate, 'D MMM YYYY');
      }
    }
    const newMessageCopy = unread > 1 ? 'New Messages' : 'New Message';

    if (!contact.username) return null;

    return (
      <ListItemWithImage
        label={contactInfo.username}
        avatarUrl={contactInfo.profileImage}
        navigateToProfile={() => navigation.navigate(CONTACT, { contact: contactInfo })}
        paragraph={unread ? newMessageCopy : lastMessage.content}
        timeSent={timeSent}
        unreadCount={unread}
        onPress={() => this.handleChatItemClick(contactInfo)}
      />
    );
  };

  render() {
    const { chats, getExistingChats } = this.props;
    const { query, filteredChats } = this.state;
    const ChatWrapper = chats.length ? ScrollWrapper : View;
    const sortedChats = orderBy(chats, ['lastMessage.serverTimestamp', 'username'], 'desc');
    return (
      <Container>
        <Header
          title="chat"
          nextText="New chat"
          onNextPress={this.goToNewChatList}
        />
        <SearchBarWrapper>
          <SearchBar
            inputProps={{
              onChange: this.handleUserSearch,
              value: query,
              sortedChats,
              autoCapitalize: 'none',
            }}
            placeholder="Search chat"
          />
        </SearchBarWrapper>
        <ChatWrapper
          style={{
            paddingBottom: sortedChats.length ? 18 : 0,
          }}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={getExistingChats}
            />
          }
        >
          <FlatList
            data={filteredChats || sortedChats}
            extraData={chats}
            keyExtractor={(item) => item.username}
            renderItem={this.renderItem}
            ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
            style={{ height: '100%' }}
            contentContainerStyle={{ height: '100%' }}
            ListEmptyComponent={
              <EmptyChat
                title="Break the ice"
                bodyText="Start chatting with someone. Recent chats will appear here."
              />}
          />
        </ChatWrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts },
  chat: { data: { chats } },
  notifications: { data: notifications },
}) => ({
  contacts,
  chats,
  notifications,
  query: '',
  filteredChats: null,
});

const mapDispatchToProps = (dispatch) => ({
  getExistingChats: () => dispatch(getExistingChatsAction()),
  resetUnread: (contactUsername) => dispatch(resetUnreadAction(contactUsername)),
  setUnreadChatNotificationsStatus: (status) => dispatch(setUnreadChatNotificationsStatusAction(status)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ChatListScreen);
