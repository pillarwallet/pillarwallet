// @flow
import * as React from 'react';
import { View, StatusBar, Image, ActivityIndicator } from 'react-native';
import { connect } from 'react-redux';
import { Container } from 'components/Layout';
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
import { baseColors } from 'utils/variables';
import ModalScreenHeader from 'components/ModalScreenHeader';
import ProfileImage from 'components/ProfileImage';
import { sendMessageByContactAction, getChatByContactAction } from 'actions/chatActions';
import { getUserName } from 'utils/contacts';

const iconSend = require('assets/icons/icon_sendMessage.png');

type Props = {
  navigation: NavigationScreenProp<*>,
  user: Object,
  sendMessageByContact: Function,
  getChatByContact: Function,
  messages: Object,
  notifications: Object,
  isFetching: boolean,
}

type State = {
  contact: Object,
  showLoadEarlierButton: boolean,
}

class ChatScreen extends React.Component<Props, State> {
  handleChatDismissal = () => {
    const { navigation } = this.props;
    navigation.goBack(null);
  };

  constructor(props) {
    super(props);
    const contact = props.navigation.getParam('contact', {});
    this.state = {
      contact,
      showLoadEarlierButton: false, // make dynamic depending on number of messages in memory?
    };
  }

  componentDidMount() {
    StatusBar.setBarStyle('dark-content');
    const { contact } = this.state;
    const { getChatByContact } = this.props;
    getChatByContact(contact.username, contact.profileImage);
  }

  componentDidUpdate(prevProps: Props) {
    const { notifications, getChatByContact } = this.props;
    const { contact } = this.state;
    const { notifications: prevNotifications } = prevProps;
    if (notifications.length !== prevNotifications.length) {
      getChatByContact(contact.username, contact.profileImage);
    }
  }

  handleLoadEarlier = () => {
    const { getChatByContact } = this.props;
    const { contact } = this.state;
    getChatByContact(contact.username, contact.profileImage, true);
    this.setState({
      showLoadEarlierButton: false,
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
    const { contact } = this.state;
    return (
      <ProfileImage
        uri={contact.avatar}
        userName={contact.username}
        diameter={34}
        textStyle={{
          fontSize: 16,
        }}
      />
    );
  };

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
      <View style={{
        flex: 1,
        borderWidth: 1,
        borderColor: '#e6e8eb',
        borderRadius: 26,
        marginRight: 10,
        marginTop: 3,
        marginBottom: 3,
        alignItems: 'flex-start',
        justifyContent: 'center',
        minHeight: 40,
        paddingTop: 4,
        paddingLeft: 2,
        paddingBottom: 2,
        paddingRight: 20,
      }}
      >
        <Composer
          {...props}
          textInputStyle={{
            borderWidth: 0,
            width: '100%',
            margin: 0,
          }}
        />
      </View>
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
          paddingLeft: 10,
          borderTopWidth: 0,
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
        timeFormat="HH:mm"
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
  };

  onSend = (messages: Object[] = []) => {
    const { sendMessageByContact } = this.props;
    const { contact } = this.state;
    sendMessageByContact(contact.username, messages[0]);
  };

  render() {
    const { messages, isFetching } = this.props;
    const { contact, showLoadEarlierButton } = this.state;
    const title = `chat with ${getUserName(contact).toLowerCase()}`;

    return (
      <React.Fragment>
        <Container>
          <ModalScreenHeader title={title} center onClose={this.handleChatDismissal} />
          <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
            {!!isFetching &&
            <View style={{ flex: 1, alignItems: 'center' }}>
              <ActivityIndicator
                animating
                color="#111"
                size="large"
              />
            </View>}
            {!isFetching &&
            <GiftedChat
              messages={messages[contact.username]}
              onSend={msgs => this.onSend(msgs)}
              user={{
                _id: this.props.user.username,
              }}
              renderBubble={this.renderBubble}
              renderAvatar={this.renderAvatar}
              renderComposer={this.renderComposer}
              renderInputToolbar={this.renderInputToolbar}
              renderDay={this.renderDay}
              renderTime={this.renderTime}
              loadEarlier={showLoadEarlierButton}
              onLoadEarlier={this.handleLoadEarlier}
              renderLoadEarlier={this.renderLoadEarlier}
              renderMessage={this.renderMessage}
              minInputToolbarHeight={52}
            />}
          </View>
        </Container>
      </React.Fragment>
    );
  }
}

const mapStateToProps = ({
  user: { data: user },
  chat: { data: { messages, isFetching } },
  notifications: { data: notifications },
}) => ({
  user,
  messages,
  isFetching,
  notifications,
});

const mapDispatchToProps = (dispatch) => ({
  sendMessageByContact: (username, message) => dispatch(sendMessageByContactAction(username, message)),
  getChatByContact: (username, avatar, loadEarlier) => dispatch(getChatByContactAction(username, avatar, loadEarlier)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ChatScreen);
