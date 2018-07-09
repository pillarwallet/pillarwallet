// @flow
import * as React from 'react';
import { FlatList, View } from 'react-native';
import { Container } from 'components/Layout';
import type { NavigationScreenProp } from 'react-navigation';
import { CHAT } from 'constants/navigationConstants';
import ChatListItem from './ChatListItem';
import { baseColors } from '../../utils/variables';

type Props = {
  navigation: NavigationScreenProp<*>,
  userName: string,
  item: Object,
  contacts: Array<Object>,
}

type State = {
  contacts: Array<Object>
}

export default class ChatListScreen extends React.Component<Props, State> {
  state = {
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

  goToChatScreen = (userName: string) => {
    this.props.navigation.navigate(CHAT);
    console.log(userName);
  };

  keyExtractor = (item: Object) => item._id.toString();

  renderItem = ({ item }: Object) => (
    <ChatListItem
      keyExtractor={this.keyExtractor}
      onPressItem={this.goToChatScreen}
      userName={item.userName}
      avatar={item.avatar}
      message={item.message}
      timeSent={item.timeSent}
      unreadCount={item.unreadCount}
      onPress={this.goToChatScreen}
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
    return (
      <Container>
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
