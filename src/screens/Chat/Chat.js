// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Alert, View, Platform, Linking } from 'react-native';
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
import { CHAT_LIST, CONTACT } from 'constants/navigationConstants';
import { UNDECRYPTABLE_MESSAGE } from 'constants/messageStatus';

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
  currentMessage: Object,
}

type State = {
  contact: Object,
  showLoadEarlierButton: boolean,
  isFetching: boolean,
}

const isWarningMessage = (type) => {
  return type === 'warning';
};

// chat elements
const renderBubble = (props: Props) => {
  const isWarning = isWarningMessage(props.currentMessage.type);
  return (<Bubble
    {...props}
    textStyle={{
      left: {
        color: isWarning ? baseColors.white : baseColors.slateBlack,
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
        backgroundColor: isWarning ? baseColors.brightBlue : baseColors.white,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: isWarning ? baseColors.brightBlue : baseColors.whiterSmoke,
        maxWidth: 262,
        marginTop: 4,
      },
      right: {
        backgroundColor: baseColors.lightYellow,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: baseColors.whiterSmoke,
        maxWidth: 262,
        marginTop: 4,
      },
    }}
    touchableProps={{
      onPress: () => {
        const { status } = props.currentMessage;

        if (status === UNDECRYPTABLE_MESSAGE) {
          // TODO: change the alert message text
          Alert.alert(
            'Cannot decrypt the message',
            'We are using end-to-end encryption. You or your interlocutor should update chat keys.',
          );
        }
      },
    }}
  />);
};

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
        lineHeight: fontSizes.small,
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
      textTransform: 'capitalize',
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
          color: isWarningMessage(props.currentMessage.type) ? baseColors.veryLightBlue : baseColors.darkGray,
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

const parsePatterns = () => [
  {
    type: 'url',
    style: { color: baseColors.clearBlue },
    onPress: (url) => Linking.openURL(url),
  },
  {
    type: 'email',
    style: { color: baseColors.clearBlue },
    onPress: (email) => Linking.openURL(`mailto:${email}`),
  },
  {
    type: 'phone',
    style: { color: baseColors.black },
  },
];

const ChatContainer = styled(Container)`
  backgroundColor: ${baseColors.snowWhite};
`;

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
      navigation.goBack();
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

  handleNavigationToContact = () => {
    const { navigation } = this.props;
    const { contact } = this.state;
    navigation.navigate(CONTACT, { contact });
  }

  renderCustomAvatar = () => {
    const { contact } = this.state;
    return (
      <ProfileImage
        uri={contact.profileImage}
        userName={contact.username}
        diameter={34}
        onPress={this.handleNavigationToContact}
        textStyle={{
          fontSize: 16,
        }}
      />
    );
  }

  renderAvatar = () => {
    const { contact } = this.state;
    return (
      <Avatar
        {...contact}
        renderAvatar={this.renderCustomAvatar}
        containerStyle={{
          left: {
            marginRight: 2,
          },
        }}
      />
    );
  };

  render() {
    const { messages, navigation } = this.props;
    const { contact, showLoadEarlierButton } = this.state;
    const title = getUserName(contact).toLowerCase();

    return (
      <ChatContainer>
        <Header
          title={title}
          onBack={this.handleChatDismissal}
          onTitlePress={() => navigation.navigate(CONTACT, { contact })}
        />
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
              renderAvatar={this.renderAvatar}
              renderComposer={renderComposer}
              renderInputToolbar={renderInputToolbar}
              renderDay={renderDay}
              loadEarlier={showLoadEarlierButton}
              onLoadEarlier={this.handleLoadEarlier}
              renderLoadEarlier={renderLoadEarlier}
              renderMessage={renderMessage}
              renderTime={renderTime}
              minInputToolbarHeight={52}
              parsePatterns={parsePatterns}
            />}
        </Wrapper>
      </ChatContainer>
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
