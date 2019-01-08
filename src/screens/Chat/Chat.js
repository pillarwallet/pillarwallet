// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Alert, View, Platform, Linking, BackHandler } from 'react-native';
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
  resetUnreadAction,
} from 'actions/chatActions';
import Spinner from 'components/Spinner';
import { ScrollShadow } from 'components/ScrollWithShadow/ScrollShadow';
import { getUserName } from 'utils/contacts';
import { isIphoneX } from 'utils/common';
import { CONTACT } from 'constants/navigationConstants';
import { UNDECRYPTABLE_MESSAGE } from 'constants/messageStatus';

type Props = {
  navigation: NavigationScreenProp<*>,
  user: Object,
  sendMessageByContact: Function,
  getChatByContact: Function,
  messages: Object,
  isFetching: boolean,
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
  shadowOpacity: number,
  contentHeight?: number,
  layoutHeight?: number,
  contentOffsetY?: number,
}

const INPUT_HEIGHT = isIphoneX() ? 62 : 52;

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
        fontFamily: 'Aktiv Grotesk App',
        fontWeight: '400',
      },
      right: {
        color: baseColors.slateBlack,
        fontSize: fontSizes.extraSmall,
        fontFamily: 'Aktiv Grotesk App',
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
        marginLeft: Platform.select({
          ios: 10,
          android: 16,
        }),
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
        minHeight: INPUT_HEIGHT,
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
      fontFamily: 'Aktiv Grotesk App',
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
          fontFamily: 'Aktiv Grotesk App',
          fontWeight: '400',
          fontSize: fontSizes.extraExtraSmall,
        },
        left: {
          color: isWarningMessage(props.currentMessage.type) ? baseColors.veryLightBlue : baseColors.darkGray,
          fontFamily: 'Aktiv Grotesk App',
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
    const username = props.navigation.getParam('username', '');
    const contact = props.contacts.find(c => c.username === username) || {};
    this.state = {
      contact,
      showLoadEarlierButton: false, // make dynamic depending on number of messages in memory?
      isFetching: true,
      shadowOpacity: 0,
    };
  }

  componentDidMount() {
    const { contact } = this.state;
    const { getChatByContact } = this.props;
    getChatByContact(contact.username, contact.profileImage);
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', this.physicalBackAction);
    }
  }

  componentWillUnmount() {
    if (Platform.OS === 'android') {
      BackHandler.removeEventListener('hardwareBackPress', this.physicalBackAction);
    }
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
      resetUnread,
    } = this.props;
    resetUnread(this.state.contact.username);
    const { backTo } = navigation.state.params;
    if (backTo) {
      navigation.navigate(backTo);
    } else {
      navigation.goBack(null);
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
    const { navigation, resetUnread } = this.props;
    const { contact } = this.state;
    resetUnread(this.state.contact.username);
    navigation.navigate(CONTACT, { contact });
  };

  physicalBackAction = () => {
    this.handleChatDismissal();
    return true;
  };

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
  };

  renderAvatar = () => {
    const { contact } = this.state;
    return (
      <Avatar
        {...contact}
        renderAvatar={this.renderCustomAvatar}
        containerStyle={{
          left: {
            marginRight: Platform.select({
              ios: -2,
              android: -14,
            }),
          },
        }}
      />
    );
  };

  handleShadow = (layoutHeight, contentHeight, contentOffsetY) => {
    const { shadowOpacity } = this.state;
    if (contentOffsetY === undefined) {
      this.setState({ shadowOpacity: 0 });
      return;
    }
    const contentOffsetHeight = parseInt(contentHeight, 10) - parseInt(layoutHeight, 10);

    if (contentOffsetHeight - contentOffsetY <= 0 && shadowOpacity) {
      this.setState({ shadowOpacity: 0 });
    } else if (contentOffsetHeight - contentOffsetY > 0 && !shadowOpacity) {
      this.setState({ shadowOpacity: 1 });
    }
  };

  render() {
    const { messages } = this.props;
    const {
      contact,
      showLoadEarlierButton,
      shadowOpacity,
      contentHeight,
      layoutHeight,
      contentOffsetY,
    } = this.state;
    const title = getUserName(contact).toLowerCase();

    return (
      <ChatContainer inset={{ bottom: 0 }}>
        <Header
          title={title}
          onBack={this.handleChatDismissal}
          onTitlePress={this.handleNavigationToContact}
        />
        {!!this.state.isFetching &&
        <Wrapper fullScreen flex={1}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Spinner />
          </View>
        </Wrapper>}
        {!this.state.isFetching &&
        <Wrapper fullScreen flex={1}>
          <ScrollShadow shadowOpacity={shadowOpacity} />
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
            minInputToolbarHeight={INPUT_HEIGHT}
            parsePatterns={parsePatterns}
            listViewProps={{
              onScroll: ({ nativeEvent }) => {
                const { contentOffset } = nativeEvent;
                const { y } = contentOffset;
                this.setState({ contentOffsetY: y });
                this.handleShadow(layoutHeight, contentHeight, y);
              },
              onContentSizeChange: (w, h) => {
                this.setState({ contentHeight: h });
                if (h > layoutHeight && contentOffsetY === undefined) {
                  this.setState({ shadowOpacity: 1 });
                  return;
                }
                this.handleShadow(layoutHeight, h, contentOffsetY);
              },
              onLayout: (event) => {
                const { height } = event.nativeEvent.layout;
                this.setState({ layoutHeight: height });
                if (contentHeight > height && contentOffsetY === undefined) {
                  this.setState({ shadowOpacity: 1 });
                  return;
                }
                this.handleShadow(height, contentOffsetY, shadowOpacity);
              },
            }}
          />
        </Wrapper>}
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
  resetUnread: (contactUsername) => dispatch(resetUnreadAction(contactUsername)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ChatScreen);
