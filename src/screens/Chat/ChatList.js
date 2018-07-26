// @flow
import * as React from 'react';
import { FlatList, View } from 'react-native';
import { Container, ScrollWrapper } from 'components/Layout';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { CHAT } from 'constants/navigationConstants';
import EmptyChat from 'components/EmptyState/EmptyChat';
import Header from 'components/Header';
import { baseColors } from 'utils/variables';
import { getExistingChatsAction } from 'actions/chatActions';
import ChatListItem from './ChatListItem';

type Props = {
  navigation: NavigationScreenProp<*>,
  contacts: Object[],
  chats: Object[],
  getExistingChats: Function,
}

type State = {
  showChat: boolean,
  receiver: string,
  receiverAvatar: string,
  chatList: Array<Object>,
}

class ChatListScreen extends React.Component<Props, State> {
  componentDidMount() {
    const { getExistingChats } = this.props;
    getExistingChats();
  }

  renderItem = ({ item: contact }: Object) => {
    const { chats, navigation } = this.props;
    const existingChat = chats.find(({ username }) => contact.username === username) || {};
    const lastMessage = existingChat.lastMessage || {};
    let timeSent = '';
    if (lastMessage.serverTimestamp) {
      const dateSent = new Date(lastMessage.serverTimestamp);
      timeSent = `${dateSent.getHours()}:${dateSent.getMinutes()}`; // HH:mm
    }
    return (
      <ChatListItem
        userName={contact.username}
        avatar={contact.avatar}
        message={lastMessage.content}
        timeSent={timeSent}
        unreadCount={existingChat.unread}
        onPress={() => navigation.navigate(CHAT, { contact })}
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
        <Header title="chat" />
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
}) => ({
  contacts,
  chats,
});

const mapDispatchToProps = (dispatch) => ({
  getExistingChats: () => dispatch(getExistingChatsAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(ChatListScreen);
