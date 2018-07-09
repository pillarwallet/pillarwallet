// @flow
import * as React from 'react';
import { View, Platform, ActivityIndicator } from 'react-native';
import { Container } from 'components/Layout';
import { LinearGradient } from 'expo';
import type { NavigationScreenProp } from 'react-navigation';
import { Icon } from 'native-base';
import {
  GiftedChat,
  Bubble,
  Avatar,
  Composer,
  InputToolbar,
  Send,
  Day,
  Time,
} from 'react-native-gifted-chat';
import ChatService from 'services/chat';
import { baseColors } from 'utils/variables';
import ButtonIcon from 'components/ButtonIcon';
import styled from 'styled-components/native/index';

const CloseButton = styled(ButtonIcon)`
  position: absolute;
  right: 0;
  top: -10px;
  z-index: 14;
`;

const chat = new ChatService();

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
            color: baseColors.darkGray,
            fontSize: 14,
          },
          right: {
            color: '#ffffff',
            fontSize: 14,
          },
        }}
        wrapperStyle={{
          left: {
            backgroundColor: baseColors.lightGray,
            borderRadius: 5,
            padding: 20,
            paddingTop: 2,
            paddingLeft: 6,
            paddingBottom: 6,
            paddingRight: 2,
          },
          right: {
            backgroundColor: baseColors.electricBlue,
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

  renderDay = (props: Props) => {
    return (
      <Day
        {...props}
        containerStyle={{
          marginTop: 30,
          marginBottom: 36,
        }}
        textStyle={{
          color: baseColors.darkGray,
          fontWeight: '300',
          fontSize: 14,
        }}
        dateFormat='LL'
      />
    );
  };

  renderTime = (props: Props) => {
    return (
      <Time
        {...props}
        textStyle={{
          color: baseColors.darkGray,
        }}
      />
    );
  };

  renderLoading = () => {
    return (
      <Container center>
        <ActivityIndicator
          animating
          color="#111"
          size="large"
        />
      </Container>
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
          text: 'Hello developer iewdi iodjwiwejd miwdmiewm micmweicmeiw mpmcpewmcviw mopcmidwcmiw mpcmpmewpmc',
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
      <View style={{ flex: 1, backgroundColor: '#ffffff', paddingTop: 20 }}>
        <LinearGradient
          colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0)']}
          locations={[0.2, 0.6, 1.0]}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 20,
            height: 80,
            zIndex: 11,
          }}
        />
        <CloseButton
          icon="close"
          onPress={this.goBackToChatListScreen}
          fontSize={Platform.OS === 'ios' ? 36 : 30}
          color={baseColors.darkGray}
        />
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
          renderDay={this.renderDay}
          renderTime={this.renderTime}
          renderLoading={this.renderLoading}
        />
      </View>
    );
  }
}
