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
    console.log('will mount');
    this.setState({
      contacts: [
        {
          _id: 1,
          userName: 'userName',
          avatar: 'https://placeimg.com/140/140/people',
          timeSent: '14:24',
          message: 'If you have never experienced cruising before, ' +
          'a chartered experience is a great way to get your feet wet',
          unreadCount: 2,
        },
        {
          _id: 2,
          userName: 'otherUser',
          avatar: '',
          timeSent: '14:24',
          message: 'You can also fly to a destination',
          unreadCount: 0,
        },
        {
          _id: 3,
          userName: 'userNumberThree',
          avatar: 'https://placeimg.com/140/140/people',
          timeSent: '14:24',
          message: 'Your yacht is your hotel that travels with you',
          unreadCount: 10,
        },
        {
          _id: 4,
          userName: 'someOtherUser',
          avatar: 'https://placeimg.com/140/140/people',
          timeSent: '14:24',
          message: 'Find out how many people are affected',
          unreadCount: 0,
        },
        {
          _id: 5,
          userName: 'sameHere',
          avatar: '',
          timeSent: '14:24',
          message: 'There are charters that can be rented for as few as two people',
          unreadCount: 0,
        },
        {
          _id: 6,
          userName: 'andHere',
          avatar: 'https://placeimg.com/140/140/people',
          timeSent: '14:24',
          message: 'This could be a place close to home and sail in one area or start and finish at two different ports',
          unreadCount: 3,
        },
        {
          _id: 7,
          userName: 'justAnotheruser',
          avatar: 'https://placeimg.com/140/140/people',
          timeSent: '14:24',
          message: 'Determining the type of cruise is another aspect of planning a chartered yachting trip',
          unreadCount: 0,
        },
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
      <View style={{ paddingLeft: 64 }}>
        <View style={{ height: 1, width: '100%', backgroundColor: baseColors.lightGray }} />
      </View>
    );
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
        </View>
      </Container>
    );
  }
}
