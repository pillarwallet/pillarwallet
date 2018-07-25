// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { FlatList, View } from 'react-native';
import { Container, ScrollWrapper } from 'components/Layout';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { CHAT } from 'constants/navigationConstants';
import Title from 'components/Title';
import EmptyChat from 'components/EmptyState/EmptyChat';
import { baseColors } from 'utils/variables';
import { getExistingChatsAction, resetUnreadAction } from 'actions/chatActions';
import ChatListItem from './ChatListItem';

type Props = {
  navigation: NavigationScreenProp<*>,
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

const ChatListHeader = styled.View`
  flex-direction: row;
  height: 97px;
  background-color: ${baseColors.white};
  padding: 0 16px;
  align-items: center;
  justify-content: space-between;
`;

class ChatListScreen extends React.Component<Props, State> {
  componentDidMount() {
    const { getExistingChats } = this.props;
    getExistingChats();
  }

  componentDidUpdate(prevProps: Props) {
    const { notifications, getExistingChats } = this.props;
    const { notifications: prevNotifications } = prevProps;
    if (notifications.length !== prevNotifications.length) {
      getExistingChats();
    }
  }

  handleChatItemClick = (contact) => {
    const { navigation, resetUnread } = this.props;
    navigation.navigate(CHAT, { contact });
    resetUnread(contact.userName);
  }

  renderItem = ({ item: contact }: Object) => {
    const { chats } = this.props;
    const existingChat = chats.find(({ username }) => contact.username === username) || {};
    const lastMessage = existingChat.lastMessage || { content: 'Start New Conversation', username: contact.username };

    let timeSent = '';
    if (lastMessage.serverTimestamp) {
      const dateSent = new Date(lastMessage.serverTimestamp);
      const minutes = (`0${dateSent.getMinutes()}`).slice(-2);
      const hours = (`0${dateSent.getHours()}`).slice(-2);
      timeSent = `${hours}:${minutes}`; // HH:mm
    }
    const newMessageCopy = existingChat.unread > 1 ? 'New Messages' : 'New Message'
    return (
      <ChatListItem
        userName={contact.username}
        avatar={contact.avatar}
        message={existingChat.unread ? newMessageCopy : lastMessage.content}
        timeSent={timeSent}
        unreadCount={existingChat.unread}
        onPress={() => this.handleChatItemClick(contact)}
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
    const { contacts, chats } = this.props;
    const ChatWrapper = contacts.length ? ScrollWrapper : View;
    return (
      <Container>
        <ChatListHeader>
          <Title center noMargin title="chat" />
        </ChatListHeader>
        <ChatWrapper style={{
          paddingBottom: contacts.length ? 18 : 0,
        }}
        >
          <FlatList
            data={contacts}
            extraData={chats}
            keyExtractor={(item) => item.username}
            renderItem={this.renderItem}
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
});

export default connect(mapStateToProps, mapDispatchToProps)(ChatListScreen);
