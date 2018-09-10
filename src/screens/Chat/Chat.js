// @flow
import * as React from 'react';
import { View, Platform } from 'react-native';
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
import { baseColors, fontSizes, spacing } from 'utils/variables';
import Header from 'components/Header';
import ProfileImage from 'components/ProfileImage';
import Icon from 'components/Icon';
import {
  sendMessageByContactAction,
  getChatByContactAction,
  getExistingChatsAction,
  resetUnreadAction,
} from 'actions/chatActions';
import Spinner from 'components/Spinner';
import { getUserName } from 'utils/contacts';
import { CHAT_LIST } from 'constants/navigationConstants';

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
        color: baseColors.slateBlack,
        fontSize: fontSizes.extraSmall,
        fontFamily: Platform.select({
          ios: 'Aktiv Grotesk App',
          android: 'AktivGrotesk-Regular',
        }),
        fontWeight: '400',
      },
      right: {
        color: baseColors.slateBlack,
        fontSize: fontSizes.extraSmall,
        fontFamily: Platform.select({
          ios: 'Aktiv Grotesk App',
          android: 'AktivGrotesk-Regular',
        }),
        fontWeight: '400',
      },
    }}
    wrapperStyle={{
      left: {
        backgroundColor: baseColors.white,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: baseColors.whiterSmoke,
        maxWidth: 262,
        marginTop: 5,
        marginBottom: 5,
      },
      right: {
        backgroundColor: baseColors.lightYellow,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: baseColors.whiterSmoke,
        maxWidth: 262,
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
  return (
    <Composer
      {...props}
      textInputStyle={{
        width: '100%',
        marginTop: Platform.select({
          ios: 12,
          android: 8,
        }),
        marginBottom: 5,
        fontSize: fontSizes.extraSmall,
        lineHeight: fontSizes.extraSmall,
      }}
      placeholder="Type your message here"
    />
  );
};

const renderSend = (props: Props) => (
  <Send
    {...props}
    containerStyle={{
      paddingRight: spacing.rhythm,
      paddingLeft: spacing.rhythm,
      marginTop: Platform.select({
        ios: 4,
        android: 6,
      }),
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
    }}
  >
    <Icon
      name="send-message"
      style={{
        color: baseColors.brightBlue,
        fontSize: fontSizes.extraLarge,
      }}
    />
  </Send>
);

const renderInputToolbar = (props: Props) => {
  return (
    <InputToolbar
      {...props}
      renderSend={renderSend}
      primaryStyle={{
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
      containerStyle={{
        bottom: 2,
        paddingLeft: 8,
        borderColor: baseColors.lightGray,
        margin: 0,
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
      fontWeight: '400',
      fontSize: fontSizes.extraSmall,
      fontFamily: Platform.select({
        ios: 'Aktiv Grotesk App',
        android: 'AktivGrotesk-Regular',
      }),
    }}
    dateFormat="LL"
  />
);

const renderTime = (props: Props) => {
  return (
    <Time
      {...props}
      textStyle={{
        right: {
          color: baseColors.darkGray,
          fontFamily: Platform.select({
            ios: 'Aktiv Grotesk App',
            android: 'AktivGrotesk-Regular',
          }),
          fontWeight: '400',
          fontSize: fontSizes.extraExtraSmall,
        },
        left: {
          color: baseColors.darkGray,
          fontFamily: Platform.select({
            ios: 'Aktiv Grotesk App',
            android: 'AktivGrotesk-Regular',
          }),
          fontWeight: '400',
          fontSize: fontSizes.extraExtraSmall,
        },
      }}
      timeFormat="HH:mm"
    />
  );
};

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
        <Header title={title} onBack={this.handleChatDismissal} />
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
            loadEarlier={showLoadEarlierButton}
            onLoadEarlier={this.handleLoadEarlier}
            renderLoadEarlier={renderLoadEarlier}
            renderMessage={renderMessage}
            renderTime={renderTime}
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
