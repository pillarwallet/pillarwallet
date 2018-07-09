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
  contacts: Array<Object>,
}

type State = {
  showChat: boolean,
  receiver: string,
  contacts: Array<Object>
}

const chat = new ChatService();

export default class ChatListScreen extends React.Component<Props, State> {
  state = {
    showChat: false,
    receiver: '',
    contacts: [
      {
        _id: 1,
        userName: 'userName',
        avatar: 'https://placeimg.com/140/140/any',
        timeSent: '14:24',
        message: 'If you have never experienced cruising before, ' +
        'a chartered experience is a great way to get your feet wet',
        unreadCount: 2,
      },
      {
        _id: 2,
        userName: 'otherUser',
        avatar: 'https://placeimg.com/140/140/any',
        timeSent: '14:24',
        message: 'You can also fly to a destination',
        unreadCount: 0,
      },
    ],
  };

  closeChat = () => {
    this.setState({
      showChat: false,
      receiver: '',
    });
  };

  openChat = (receiver) => {
    this.setState({
      showChat: true,
      receiver
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
      <View style={{ paddingLeft: 64 }}>
        <View style={{ height: 1, width: '100%', backgroundColor: baseColors.lightGray }} />
      </View>
    );
  }

  render() {
    const { showChat, receiver } = this.state;
    return (
      <Container>
        <ChatScreen
          isVisible={showChat}
          modalHide={this.closeChat}
          receiver={receiver}
        />
        <View style={{
          paddingLeft: 12,
          paddingTop: 18,
          paddingRight: 18,
          paddingBottom: 18,
        }}
        >
          <FlatList
            data={this.state.contacts}
            extraData={this.state}
            keyExtractor={this.keyExtractor}
            renderItem={this.renderItem}
            ItemSeparatorComponent={this.renderSeparator}
          />
        </View>
      </Container>
    );
  }
}
