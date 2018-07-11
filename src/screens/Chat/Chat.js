// @flow
import * as React from 'react';
import { View, Platform, ActivityIndicator, StatusBar, Image } from 'react-native';
import { Container } from 'components/Layout';
import { LinearGradient } from 'expo';
import type { NavigationScreenProp } from 'react-navigation';
import {
  GiftedChat,
  Bubble,
  Avatar,
  Composer,
  InputToolbar,
  Send,
  Day,
  Time,
  LoadEarlier,
  Message,
} from 'react-native-gifted-chat';
import ChatService from 'services/chat';
import { baseColors } from 'utils/variables';
import ButtonIcon from 'components/ButtonIcon';
import styled from 'styled-components/native/index';
import Modal from 'react-native-modal';
import { connect } from 'react-redux';
import ProfileImage from 'screens/Profile/ProfileImage';
import { isIphoneX } from 'utils/common';

const CloseButton = Platform.OS === 'ios' ?
  styled(ButtonIcon)`
  position: absolute;
  right: 0;
  top: ${isIphoneX ? 20 : 10}px;
  z-index: 14;
` :
  styled(ButtonIcon)`
  position: absolute;
  right: 6px;
  top: 0;
  z-index: 14;
`;

const iconSend = require('assets/icons/icon_sendMessage.png');

const chat = new ChatService();

type Props = {
  navigation: NavigationScreenProp<*>,
  receiver: string,
  receiverAvatar: string,
  user: Object,
  isVisible: boolean,
  modalHide: Function,
}

type State = {
  messages: Array<mixed>,
  isLoadingMore: boolean,
  showLoadEarlierButton: boolean,
}

class ChatScreen extends React.Component<Props, State> {
  state = {
    messages: [],
    isLoadingMore: false,
    showLoadEarlierButton: false,
  };

  handleChatClose = () => {
    this.setState({
      messages: [],
      showLoadEarlierButton: false,
      isLoadingMore: false,
    });
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

  renderCustomAvatar = () => {
    return (
      <ProfileImage
        uri={this.props.receiverAvatar}
        userName={this.props.receiver}
        containerStyle={{
          height: 34,
          width: 34,
          borderRadius: 17,
        }}
        imageStyle={{
          height: 34,
          width: 34,
          borderRadius: 17,
        }}
        textStyle={{
          fontSize: 16,
        }}
      />
    );
  }

  renderAvatar = (props: Props) => {
    return (
      <Avatar
        {...props}
        renderAvatar={this.renderCustomAvatar}
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
          height: 54,
        }}
      >
        <Image
          style={{
            width: 24,
            height: 24,
          }}
          source={iconSend}
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
        containerStyle={{
          bottom: 2,
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
        dateFormat="LL"
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

  renderLoadEarlier = (props: Props) => {
    return (
      <LoadEarlier
        {...props}
        containerStyle={{
          marginTop: 70,
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

  renderMessage = (props: Props) => {
    return (
      <Message
        {...props}
        containerStyle={{
          left: {
            paddingLeft: 10,
          },
          right: {
            paddingRight: 10,
          },
        }}
      />
    );
  }

  handleChatOpen = () => {
    StatusBar.setBarStyle('dark-content');
    // TODO: append user avatar to each message from chat receiver (this.props.receiverAvatar).
    chat.client.receiveNewMessagesByContact(this.props.receiver).then(() => {
      chat.client.getChatByContact(this.props.receiver).then((receivedMessagesString) => {
        const messages = [];
        const receivedMessages = JSON.parse(receivedMessagesString);
          receivedMessages.forEach((obj, key) => {
            messages.push({
              _id: key,
              text: obj.content,
              createdAt: new Date(obj.savedTimestamp*1000),
              user: {
                _id: obj.username,
                name: obj.username,
                avatar: obj.username === this.props.receiver ? this.props.receiverAvatar : this.props.receiverAvatar,
              },
            });
          });
          this.setState({
            showLoadEarlierButton: false, // if not all previous messages are shown
            messages,
          });
      }).catch(() => {});
    }).catch(() => {});
  };

  loadEarlier = () => {
    // TODO: get more messages of conversation with this.props.receiver
  };

  onSend = (messages: Array<mixed> = []) => {
    chat.client.sendMessageByContact(this.props.receiver, messages[0].text);
    this.setState(previousState => ({
      messages: GiftedChat.append(previousState.messages, messages),
    }));
  };

  render() {
    const {
      isVisible,
      modalHide,
    } = this.props;

    const animationInTiming = 300;
    const animationOutTiming = 300;

    const animateIn = Platform.OS === 'ios' ? 'slideInRight' : 'slideInUp';
    const animateOut = Platform.OS === 'ios' ? 'slideOutRight' : 'slideOutDown';

    return (
      <Modal
        isVisible={isVisible}
        animationInTiming={animationInTiming}
        animationOutTiming={animationOutTiming}
        animationIn={animateIn}
        animationOut={animateOut}
        onBackButtonPress={modalHide}
        onModalShow={this.handleChatOpen}
        onModalHide={this.handleChatClose}
        style={{
          margin: 0,
          justifyContent: 'flex-start',
        }}
      >
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
            onPress={modalHide}
            fontSize={Platform.OS === 'ios' ? 36 : 30}
            color={baseColors.darkGray}
          />
          <GiftedChat
            messages={this.state.messages}
            onSend={messages => this.onSend(messages)}
            user={{
              _id: this.props.user.username,
            }}
            style={{ backgroundColor: 'red' }}
            renderBubble={this.renderBubble}
            renderAvatar={this.renderAvatar}
            renderComposer={this.renderComposer}
            renderInputToolbar={this.renderInputToolbar}
            renderDay={this.renderDay}
            renderTime={this.renderTime}
            renderLoading={this.renderLoading}
            loadEarlier={this.state.showLoadEarlierButton}
            isLoadingEarlier={this.state.isLoadingMore}
            onLoadEarlier={this.loadEarlier}
            renderLoadEarlier={this.renderLoadEarlier}
            renderMessage={this.renderMessage}
            minInputToolbarHeight={52}
          />
        </View>
      </Modal>
    );
  }
}

const mapStateToProps = ({ user: { data: user } }) => ({ user });

export default connect(mapStateToProps)(ChatScreen);
