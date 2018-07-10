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
  receiverAvatar: string,
  contacts: Array<Object>
}

const chat = new ChatService();

export default class ChatListScreen extends React.Component<Props, State> {
  state = {
    showChat: false,
    receiver: '',
    receiverAvatar: '',
    contacts: [],
  };

  componentWillMount = () => {
    // TODO: get receivers list with the last message and unread messages. Set state.
    this.setState({
      contacts: [
        {
          _id: 1,
          userName: 'vy1',
          avatar: 'https://placeimg.com/140/140/people',
          timeSent: '14:24',
          message: 'If you have never experienced cruising before, ' +
          'a chartered experience is a great way to get your feet wet',
          unreadCount: 2,
        }
      ],
    });
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
    chat.client.addContact('vy1').then((resp) => {console.log(resp)}).catch((err) => {console.log(err)});
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
            data={this.state.contacts}
            extraData={this.state}
            keyExtractor={this.keyExtractor}
            renderItem={this.renderItem}
            ItemSeparatorComponent={this.renderSeparator}
            style={{ flex: 1 }}
          />

          <Button title={'Connect with vy1'} onPress={this.connectWithUser}></Button>
        </View>
      </Container>
    );
  }
}
