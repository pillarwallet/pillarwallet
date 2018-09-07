// @flow
import * as React from 'react';
import { View, Image, Platform } from 'react-native';
import { connect } from 'react-redux';
import { Container, Wrapper } from 'components/Layout';
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
import Header from 'components/Header';
import ProfileImage from 'components/ProfileImage';
import {
  sendMessageByContactAction,
  getChatByContactAction,
  getExistingChatsAction,
  resetUnreadAction,
} from 'actions/chatActions';
import Spinner from 'components/Spinner';
import { getUserName } from 'utils/contacts';
import { CHAT_LIST } from 'constants/navigationConstants';

const iconSend = require('assets/icons/icon_sendMessage.png');

type Props = {
  navigation: NavigationScreenProp<*>,
  user: Object,
  sendMessageByContact: Function,
  getChatByContact: Function,
  messages: Object,
  isFetching: boolean,
  getExistingChats: Function,
  resetUnread: Function,
  contact: Object,
  chats: any,
  contacts: Object,
}

type State = {
  contact: Object,
  showLoadEarlierButton: boolean,
  isFetching: boolean,
}

// chat elements
const renderBubble = (props: Props) => (
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

const renderCustomAvatar = (contact) => () => (
  <ProfileImage
    uri={contact.profileImage}
    userName={contact.username}
    diameter={34}
    textStyle={{
      fontSize: 16,
    }}
  />
);

const renderAvatar = (contact) => (props: Props) => (
  <Avatar
    {...props}
    renderAvatar={renderCustomAvatar(contact)}
    containerStyle={{
      left: {
        marginRight: 2,
      },
    }}
  />
);

const renderComposer = (props: Props) => {
  if (Platform.OS === 'ios') {
    return (
      <Composer
        {...props}
        textInputStyle={{
          alignItems: 'flex-start',
          justifyContent: 'center',

          marginLeft: 0,
          paddingTop: 4,
        }}
      />
    );
  }

  return (
    <View style={{
      flex: 1,
      borderWidth: 1,
      borderColor: '#e6e8eb',
      borderRadius: 26,
      marginRight: 10,
      marginTop: 3,
      marginBottom: 6,
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
        multiline
      />
    </View>
  );
};

const renderSend = (props: Props) => (
  <Send
    {...props}
    containerStyle={{
      paddingRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      height: Platform.OS === 'ios' ? 44 : 54,
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

const renderInputToolbar = (props: Props) => {
  if (Platform.OS === 'ios') {
    return (
      <InputToolbar
        {...props}
        renderSend={renderSend}
        primaryStyle={{
          justifyContent: 'center',
        }}
        containerStyle={{
          bottom: 2,
          borderWidth: 1,
          borderTopWidth: 1,
          borderTopColor: '#e6e8eb',
          borderColor: '#e6e8eb',
          borderRadius: 20,
          paddingLeft: 10,
          marginRight: 10,
          marginLeft: 10,
        }}
        // renderAccessory={this.renderSend()}
      />
    );
  }

  return (
    <InputToolbar
      {...props}
      renderSend={renderSend}
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

const renderDay = (props: Props) => (
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

const renderTime = (props: Props) => (
  <Time
    {...props}
    textStyle={{
      color: baseColors.darkGray,
    }}
    timeFormat="HH:mm"
  />
);

const renderLoadEarlier = (props: Props) => (
  <LoadEarlier
    {...props}
    containerStyle={{
      marginTop: 70,
    }}
  />
);

const renderMessage = (props: Props) => (
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


class ChatScreen extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    const contact = props.navigation.getParam('contact', {});
    this.state = {
      contact,
      showLoadEarlierButton: false, // make dynamic depending on number of messages in memory?
      isFetching: true,
    };
  }

  componentDidMount() {
    const { contact } = this.state;
    const { getChatByContact } = this.props;
    getChatByContact(contact.username, contact.profileImage);
  }

  componentDidUpdate(prevProps: Props) {
    const { chats, getChatByContact, isFetching } = this.props;
    const { contact } = this.state;
    const { chats: prevChats } = prevProps;
    const chatWithContact = chats.find(({ username }) => contact.username === username) || {};
    const prevChatWithContact = prevChats.find(({ username }) => contact.username === username) || {};
    if (chatWithContact.unread !== prevChatWithContact.unread) {
      getChatByContact(contact.username, contact.profileImage);
    }

    if (this.state.isFetching && !isFetching) {
      this.setState({ isFetching: false }); // eslint-disable-line
    }
  }

  handleChatDismissal = () => {
    const {
      navigation,
      getExistingChats,
      resetUnread,
      contacts,
      chats,
    } = this.props;
    getExistingChats();
    resetUnread(this.state.contact.username);

    if (navigation.getParam('fromNewChatList', false) && (contacts.length - 1 > chats.length)) {
      navigation.goBack(null);
      navigation.setParams({ fromNewChatList: false });
    } else {
      navigation.navigate(CHAT_LIST);
    }
  };

  handleLoadEarlier = () => {
    const { getChatByContact } = this.props;
    const { contact } = this.state;
    getChatByContact(contact.username, contact.profileImage, true);
    this.setState({
      showLoadEarlierButton: false,
    });
  };

  onSend = (messages: Object[] = []) => {
    const { sendMessageByContact } = this.props;
    const { contact } = this.state;
    sendMessageByContact(contact.username, messages[0]);
  };

  render() {
    const { messages } = this.props;
    const { contact, showLoadEarlierButton } = this.state;
    const title = getUserName(contact).toLowerCase();

    return (
      <Container>
        <Header title={title} onClose={this.handleChatDismissal} />
        <Wrapper fullScreen flex={1}>
          {!!this.state.isFetching &&
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Spinner />
          </View>}
          {!this.state.isFetching &&
          <GiftedChat
            messages={messages[contact.username]}
            onSend={msgs => this.onSend(msgs)}
            user={{
              _id: this.props.user.username,
            }}
            renderBubble={renderBubble}
            renderAvatar={renderAvatar(contact)}
            renderComposer={renderComposer}
            renderInputToolbar={renderInputToolbar}
            renderDay={renderDay}
            renderTime={renderTime}
            loadEarlier={showLoadEarlierButton}
            onLoadEarlier={this.handleLoadEarlier}
            renderLoadEarlier={renderLoadEarlier}
            renderMessage={renderMessage}
            minInputToolbarHeight={52}
          />}
        </Wrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({
  user: { data: user },
  chat: { data: { messages, isFetching, chats } },
  contacts: { data: contacts },
}) => ({
  user,
  messages,
  isFetching,
  chats,
  contacts,
});

const mapDispatchToProps = (dispatch) => ({
  sendMessageByContact: (username, message) => dispatch(sendMessageByContactAction(username, message)),
  getChatByContact: (username, avatar, loadEarlier) => dispatch(getChatByContactAction(username, avatar, loadEarlier)),
  getExistingChats: () => dispatch(getExistingChatsAction()),
  resetUnread: (contactUsername) => dispatch(resetUnreadAction(contactUsername)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ChatScreen);
