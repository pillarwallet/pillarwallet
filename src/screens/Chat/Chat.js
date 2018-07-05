// @flow
import * as React from 'react';
import { View, Platform, TouchableOpacity, Text } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { Icon } from 'native-base';
import {
  GiftedChat,
  Bubble,
  Avatar,
  Composer,
  InputToolbar,
  Send,
} from 'react-native-gifted-chat';

type Props = {
  navigation: NavigationScreenProp<*>,
}

type State = {
  messages: Array<mixed>
}

export default class ChatScreen extends React.Component<Props, State> {
  state = {
    messages: [],
  };

  goBackToChatListScreen = () => {
    this.props.navigation.goBack();
  };

  // chat elements
  renderBubble = (props: Props) => {
    return (
      <Bubble
        {...props}
        textStyle={{
          left: {
            color: '#ffffff',
          },
          right: {
            color: '#ffffff',
          },
        }}
        wrapperStyle={{
          left: {
            backgroundColor: '#49729f',
            borderRadius: 5,
            padding: 20,
            paddingTop: 2,
            paddingLeft: 6,
            paddingBottom: 6,
            paddingRight: 2,
          },
          right: {
            backgroundColor: '#212a35',
            borderRadius: 5,
            paddingTop: 2,
            paddingRight: 6,
            paddingBottom: 6,
            paddingLeft: 2,
          },
        }}
      />
    );
  };

  renderAvatar = (props: Props) => {
    return (
      <Avatar
        {...props}
        imageStyle={{
          left: {
            borderWidth: 0.8,
            borderColor: '#d6d7da',
            height: 34,
            width: 34,
            borderRadius: 17,
          },
        }}
        containerStyle={{
          left: {
            marginRight: 2,
          },
        }}
      />
    );
  };

  renderComposer = (props: Props) => {
    return (
      <Composer
        {...props}
        textInputStyle={{
          borderWidth: 1,
          borderColor: '#e6e8eb',
          borderRadius: 20,
          paddingTop: 11,
          paddingBottom: 11,
          paddingLeft: 14,
          paddingRight: 14,
          marginTop: 6,
          marginBottom: 6,
          marginRight: 10,
        }}
        composerHeight={40}
      />
    );
  };

  renderSend = (props: Props) => {
    return (
      <Send
        {...props}
        containerStyle={{
          paddingRight: 12,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          height: 52,
        }}
      >
        <Icon
          ios="ios-send-outline"
          android="md-send"
          style={{
            fontSize: Platform.OS === 'ios' ? 36 : 30,
            color: '#1a9fff',
          }}
        />
      </Send>
    );
  };

  renderInputToolbar = (props: Props) => {
    return (
      <InputToolbar
        {...props}
        renderSend={this.renderSend}
        primaryStyle={{
          justifyContent: 'center',
        }}
      />
    );
  };

  componentWillMount() {
    this.setState({
      messages: [
        {
          _id: 1,
          text: 'Hello developer',
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'React Native',
            avatar: 'https://placeimg.com/140/140/any',
          },
        },
        {
          _id: 2,
          text: 'Hello developer',
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'React Native',
            avatar: 'https://placeimg.com/140/140/any',
          },
        },
        {
          _id: 3,
          text: 'Hello developer',
          user: {
            _id: 2,
            name: 'React Native',
            avatar: 'https://placeimg.com/140/140/any',
          },
        },
        {
          _id: 4,
          text: 'Hello developer',
          user: {
            _id: 1,
            name: 'React Native',
            avatar: 'https://placeimg.com/140/140/any',
          },
        },
        {
          _id: 5,
          text: 'Hello developer',
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'React Native',
            avatar: 'https://placeimg.com/140/140/any',
          },
        },
        {
          _id: 6,
          text: 'Hello developer',
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'React Native',
            avatar: 'https://placeimg.com/140/140/any',
          },
        },
        {
          _id: 7,
          text: 'Hello developer',
          createdAt: new Date(),
          user: {
            _id: 1,
            name: 'React Native',
            avatar: 'https://placeimg.com/140/140/any',
          },
        },
        {
          _id: 8,
          text: 'Hello developer',
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'React Native',
            avatar: 'https://placeimg.com/140/140/any',
          },
        },
        {
          _id: 9,
          text: 'Hello developer',
          createdAt: new Date(),
          user: {
            _id: 1,
            name: 'React Native',
            avatar: 'https://placeimg.com/140/140/any',
          },
        },
        {
          _id: 10,
          text: 'Hello developer',
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'React Native',
            avatar: 'https://placeimg.com/140/140/any',
          },
        },
        {
          _id: 11,
          text: 'Hello developer',
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'React Native',
            avatar: 'https://placeimg.com/140/140/any',
          },
        },
        {
          _id: 12,
          text: 'Hello developer',
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'React Native',
            avatar: 'https://placeimg.com/140/140/any',
          },
        },
        {
          _id: 13,
          text: 'Hello developer',
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'React Native',
            avatar: 'https://placeimg.com/140/140/any',
          },
        },
      ],
    });
  }

  onSend(messages: Array<mixed> = []) {
    this.setState(previousState => ({
      messages: GiftedChat.append(previousState.messages, messages),
    }));
  }

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: '#2b3744', paddingTop: 30 }}>
        <TouchableOpacity onPress={this.goBackToChatListScreen}>
          <Text>To chat</Text>
        </TouchableOpacity>
        <GiftedChat
          messages={this.state.messages}
          onSend={messages => this.onSend(messages)}
          user={{
            _id: 1,
          }}
          style={{ backgroundColor: 'red' }}
          renderBubble={this.renderBubble}
          renderAvatar={this.renderAvatar}
          renderComposer={this.renderComposer}
          renderInputToolbar={this.renderInputToolbar}
        />
      </View>
    );
  }
}
