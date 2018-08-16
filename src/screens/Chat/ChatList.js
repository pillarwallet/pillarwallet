// @flow
import * as React from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { Container, ScrollWrapper } from 'components/Layout';
import { connect } from 'react-redux';
import type { NavigationScreenProp, NavigationEventSubscription } from 'react-navigation';
import { CHAT } from 'constants/navigationConstants';
import EmptyChat from 'components/EmptyState/EmptyChat';
import Header from 'components/Header';
import { baseColors } from 'utils/variables';
import { getExistingChatsAction, resetUnreadAction } from 'actions/chatActions';
import { setUnreadChatNotificationsStatusAction } from 'actions/notificationsActions';
import ChatListItem from './ChatListItem';

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
}

class ChatListScreen extends React.Component<Props, State> {
  _willFocus: NavigationEventSubscription;

  componentDidMount() {
    const { getExistingChats } = this.props;
    getExistingChats();
    this._willFocus = this.props.navigation.addListener(
      'willFocus',
      () => { this.props.setUnreadChatNotificationsStatus(false); },
    );
  }

  componentWillUnmount() {
    this._willFocus.remove();
  }

  handleChatItemClick = (contact) => {
    const { navigation, resetUnread } = this.props;
    navigation.navigate(CHAT, { contact });
    resetUnread(contact.username);
  };

  renderItem = (contacts: Object[]) => ({ item: contact }: Object) => {
    const { chats } = this.props;

    const chatWithContact = chats.find(({ username }) => contact.username === username) || {};
    const { lastMessage, unread } = chatWithContact;
    const contactInfo = contacts.find(({ username }) => contact.username === username) || {};

    let timeSent = '';
    if (lastMessage.serverTimestamp) {
      const dateSent = new Date(lastMessage.serverTimestamp);
      const minutes = (`0${dateSent.getMinutes()}`).slice(-2);
      const hours = (`0${dateSent.getHours()}`).slice(-2);
      timeSent = `${hours}:${minutes}`; // HH:mm
    }
    const newMessageCopy = chatWithContact.unread > 1 ? 'New Messages' : 'New Message';

    return (
      <ChatListItem
        userName={contactInfo.username}
        avatar={contactInfo.profileImage}
        message={unread ? newMessageCopy : lastMessage.content}
        timeSent={timeSent}
        unreadCount={unread}
        onPress={() => this.handleChatItemClick(contactInfo)}
      />
    );
  };

  renderSeparator = () => {
    return (
      <View style={{ paddingLeft: 76, paddingRight: 18 }}>
        <View style={{ height: 1, width: '100%', backgroundColor: baseColors.lightGray }} />
      </View>
    );
  };

  render() {
    const { chats, getExistingChats, contacts } = this.props;
    const ChatWrapper = chats.length ? ScrollWrapper : View;
    return (
      <Container>
        <Header title="chat" />
        <ChatWrapper
          style={{
            paddingBottom: chats.length ? 18 : 0,
          }}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => { getExistingChats(); }}
            />
          }
        >
          <FlatList
            data={chats}
            extraData={chats}
            keyExtractor={(item) => item.username}
            renderItem={this.renderItem(contacts)}
            ItemSeparatorComponent={this.renderSeparator}
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
});

const mapDispatchToProps = (dispatch) => ({
  getExistingChats: () => dispatch(getExistingChatsAction()),
  resetUnread: (contactUsername) => dispatch(resetUnreadAction(contactUsername)),
  setUnreadChatNotificationsStatus: (status) => dispatch(setUnreadChatNotificationsStatusAction(status)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ChatListScreen);
