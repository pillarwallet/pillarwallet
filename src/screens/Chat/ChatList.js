// @flow
import * as React from 'react';
import { FlatList, View } from 'react-native';
import { Container } from 'components/Layout';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { CHAT } from 'constants/navigationConstants';
import ScreenHeader from 'components/ScreenHeader';
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
  chatList: Array<Object>
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
    const timeSent = lastMessage.savedTimestamp
      ? new Date(lastMessage.savedTimestamp * 1000).toISOString().slice(11, 16) // HH:mm
      : '';

    return (
      <ChatListItem
        userName={contact.username}
        avatar={contact.avatar}
        message={lastMessage.content}
        timeSent={timeSent}
        unreadCount={existingChat.unreadCount}
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
  }
  render() {
    const { contacts, chats } = this.props;
    return (
      <Container>
        <ScreenHeader title="chat" />
        <View style={{
          paddingTop: 18,
          paddingBottom: 18,
          flex: 1,
        }}
        >
          <FlatList
            data={contacts}
            extraData={chats}
            keyExtractor={(item) => item.username}
            renderItem={this.renderItem}
            ItemSeparatorComponent={this.renderSeparator}
            style={{ flex: 1 }}
          />
        </View>
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
