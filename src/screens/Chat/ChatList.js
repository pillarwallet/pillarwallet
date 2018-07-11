// @flow
import * as React from 'react';
import { FlatList, View, Button } from 'react-native';
import { Container } from 'components/Layout';
import type { NavigationScreenProp } from 'react-navigation';
import { CHAT } from 'constants/navigationConstants';
import ChatListItem from './ChatListItem';
import { baseColors } from '../../utils/variables';
import ChatService from 'services/chat';
import ChatScreen from "./Chat";

type Props = {
  navigation: NavigationScreenProp<*>,
  userName: string,
  item: Object,
  chatList: Array<Object>,
}

type State = {
  showChat: boolean,
  receiver: string,
  receiverAvatar: string,
  chatList: Array<Object>
}

const chat = new ChatService();

export default class ChatListScreen extends React.Component<Props, State> {
  state = {
    showChat: false,
    receiver: '',
    receiverAvatar: '',
    chatList: [],
  };

  componentWillMount = () => {
    const contacts = ['deimantas8', 'deimantas6'];
    const chatList = [];
    contacts.forEach((value, key) => {
      chatList.push({
        _id: key,
        userName: value,
        avatar: 'https://placeimg.com/140/140/people',
        timeSent: '13:37',
        message: 'INITIATE TEST CHAT',
        unreadCount: 0
      });
    });
    chat.client.getExistingChats().then((list) => {
      const chats = JSON.parse(list);
      chats.forEach((obj, key) => {
        const contact = {
          _id: obj.username,
          userName: obj.username,
          avatar: 'https://placeimg.com/140/140/people',
          unreadCount: obj.unread
        };
        if (typeof obj.lastMessage !== 'undefined'){
            const dt = new Date(obj.lastMessage.savedTimestamp*1000);
            contact.timeSent = dt.getHours() + ':' + dt.getMinutes();
            contact.message = obj.lastMessage.content;
        }
        chatList.push(contact);
      });
      this.setState({
          chatList
      });
    }).catch(() => {});
  };
  closeChat = () => {
    this.setState({
      showChat: false,
      receiver: '',
    });
  };

  openChat = (receiver: string, receiverAvatar: string) => {
    this.setState({
      showChat: true,
      receiver,
      receiverAvatar,
    });
  };

  keyExtractor = (item: Object) => item._id.toString();

  renderItem = ({ item }: Object) => (
    <ChatListItem
      keyExtractor={this.keyExtractor}
      userName={item.userName}
      avatar={item.avatar}
      message={item.message}
      timeSent={item.timeSent}
      unreadCount={item.unreadCount}
      onPress={this.openChat}
    />
  );

  renderSeparator = () => {
    return (
      <View style={{ paddingLeft: 76, paddingRight: 18 }}>
        <View style={{ height: 1, width: '100%', backgroundColor: baseColors.lightGray }} />
      </View>
    );
  }

  connectWithUser = () => {
    chat.client.addContact('deimantas8').then((resp) => {console.log(resp)}).catch((err) => {console.log(err)});
  }

  render() {
    const { showChat, receiver, receiverAvatar } = this.state;
    return (
      <Container>
        <ChatScreen
          isVisible={showChat}
          modalHide={this.closeChat}
          receiver={receiver}
          receiverAvatar={receiverAvatar}
        />
        <View style={{
          paddingTop: 18,
          paddingBottom: 18,
          flex: 1,
        }}
        >

        <FlatList
          data={this.state.chatList}
          extraData={this.state}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
          ItemSeparatorComponent={this.renderSeparator}
          style={{ flex: 1 }}
        />

          <Button title={'Connect with deimantas8'} onPress={this.connectWithUser}></Button>
        </View>
      </Container>
    );
  }
}
