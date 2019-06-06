// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as React from 'react';
import { Alert, Platform, Linking, AppState, Keyboard } from 'react-native';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
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
import ProfileImage from 'components/ProfileImage';
import Icon from 'components/Icon';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import {
  sendMessageByContactAction,
  clearChatDraftStateAction,
  getChatByContactAction,
  getChatDraftByContactAction,
  saveDraftAction,
} from 'actions/chatActions';
import Spinner from 'components/Spinner';
import { isIphoneX, handleUrlPress } from 'utils/common';
import { UNDECRYPTABLE_MESSAGE } from 'constants/messageStatus';
import { Answers } from 'react-native-fabric';
import truncate from 'lodash.truncate';

type Props = {
  navigation: NavigationScreenProp<*>,
  user: Object,
  sendMessageByContact: Function,
  clearChatDraftState: Function,
  getChatByContact: Function,
  getChatDraftByContact: Function,
  saveDraft: Function,
  messages: Object,
  isFetching: boolean,
  contact: Object,
  chats: any,
  contacts: Object,
  currentMessage: Object,
  draft: ?string,
  isOpen: boolean,
  hasUnreads?: boolean,
  getCollapseHeight: Function,
}

type State = {
  contact: Object,
  showLoadEarlierButton: boolean,
  isFetching: boolean,
  chatText: string,
  firstChatLoaded: boolean,
}

const INPUT_HEIGHT = isIphoneX() ? 62 : 52;

const isWarningMessage = (type) => {
  return type === 'warning';
};

const SystemMessageWrapper = styled.View`
  flex: 1;
  padding: 30px;
  align-items: center;
`;

const TimeWrapper = styled.View`
  flex: 1;
  flex-direction: row;
  justify-content: flex-end;
  margin-bottom: 2px;
`;

// chat elements
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
        paddingLeft: 8,
      },
      right: {
        paddingRight: 8,
      },
    }}
  />
);

const parsePatterns = () => [
  {
    type: 'url',
    style: { color: baseColors.clearBlue },
    onPress: (url) => handleUrlPress(url),
  },
  {
    type: 'email',
    style: { color: baseColors.clearBlue },
    onPress: (email) => Linking.openURL(`mailto:${email}`),
  },
  {
    type: 'phone',
    style: { color: baseColors.clearBlue },
    onPress: (phone) => Linking.openURL(`tel:${phone}`),
  },
];

class ChatTab extends React.Component<Props, State> {
  composer: Object;

  static defaultProps = {
    isOpen: false,
  };

  constructor(props) {
    super(props);
    const contact = props.contacts.find(c => c.username === this.props.contact.username) || {};
    this.state = {
      contact,
      showLoadEarlierButton: false, // make dynamic depending on number of messages in memory?
      isFetching: true,
      chatText: '',
      firstChatLoaded: true, // check this issue https://github.com/FaridSafi/react-native-gifted-chat/issues/638
    };
    this.composer = React.createRef();
  }

  componentDidMount() {
    const { contact } = this.state;
    const {
      getChatByContact,
      getChatDraftByContact,
      isOpen,
      chats,
      navigation,
    } = this.props;
    const chatInfo = chats.find(({ username }) => username === contact.username) || {};

    if (!chatInfo.unread) getChatByContact(contact.username, contact.id, contact.profileImage);
    if (isOpen) {
      getChatByContact(contact.username, contact.id, contact.profileImage);
      navigation.setParams({ chatTabOpen: true });
    }
    Answers.logContentView('Chat screen');
    AppState.addEventListener('change', this.shouldPersistDraft);

    getChatDraftByContact(contact.id);
  }

  componentDidUpdate(prevProps: Props) {
    const {
      isFetching,
      draft,
      isOpen,
      getChatByContact,
      navigation,
      hasUnreads,
    } = this.props;
    const { contact } = this.state;
    const { draft: prevDraft } = prevProps;

    if (this.state.isFetching && !isFetching) {
      this.setState({ isFetching: false }); // eslint-disable-line
    }

    if (!prevDraft && draft) {
      this.setState({ chatText: draft }); // eslint-disable-line
    }

    if (prevProps.isOpen !== isOpen && isOpen && hasUnreads) {
      navigation.setParams({ chatTabOpen: true });
      getChatByContact(contact.username, contact.id, contact.profileImage);
    }

    if (prevProps.isOpen !== isOpen && !isOpen) {
      navigation.setParams({ chatTabOpen: false });
      Keyboard.dismiss();
    }

    if (prevProps.isOpen !== isOpen && isOpen && this.composer && this.composer.focus !== undefined) {
      this.composer.focus();
    }
  }

  componentWillUnmount() {
    const { saveDraft, clearChatDraftState, navigation } = this.props;
    const { chatText, contact } = this.state;
    navigation.setParams({ chatTabOpen: false });

    AppState.removeEventListener('change', this.shouldPersistDraft);

    if (chatText && chatText !== '') {
      saveDraft(contact.id, chatText);
    }
    clearChatDraftState();
  }

  shouldPersistDraft = (nextAppState) => {
    const { saveDraft } = this.props;
    const { chatText, contact } = this.state;

    if (nextAppState === 'inactive' || nextAppState === 'background') {
      saveDraft(contact.id, chatText);
    }
  };

  handleLoadEarlier = () => {
    const { getChatByContact } = this.props;
    const { contact } = this.state;
    getChatByContact(contact.username, contact.id, contact.profileImage, true);
    this.setState({
      showLoadEarlierButton: false,
    });
  };

  onSend = (messages: Object[] = []) => {
    const { sendMessageByContact, clearChatDraftState } = this.props;
    const { contact } = this.state;

    sendMessageByContact(contact.username, messages[0]);
    clearChatDraftState();
    this.setState({ chatText: '' });
  };

  handleComposerFocus = () => {
    const { isOpen } = this.props;
    if (isOpen && this.composer && this.composer.focus !== undefined) {
      this.composer.focus();
    }
  };

  renderCustomAvatar = () => {
    const { contact } = this.state;
    const { profileImage, username } = contact;

    return (
      <ProfileImage
        uri={profileImage}
        userName={username}
        diameter={32}
        onPress={null}
        textStyle={{
          fontSize: 16,
        }}
        noShadow
        borderWidth={0}
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
            marginRight: 4,
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
        textInputProps={{
          ref: (input) => { this.composer = input; },
          onLayout: this.handleComposerFocus,
        }}
      />
    );
  };

  renderBubble = (props) => {
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
          backgroundColor: isWarning ? baseColors.brightBlue : baseColors.zumthor,
          borderRadius: 5,
          borderWidth: 1,
          borderColor: isWarning ? baseColors.brightBlue : baseColors.tropicalBlue,
          maxWidth: 262,
          marginTop: 4,
          paddingHorizontal: 2,
          paddingTop: 2,
          minWidth: 120,
        },
        right: {
          backgroundColor: baseColors.white,
          borderRadius: 5,
          borderWidth: 1,
          borderColor: baseColors.tropicalBlue,
          maxWidth: 262,
          marginTop: 4,
          paddingHorizontal: 2,
          paddingTop: 2,
          minWidth: 120,
          marginLeft: 20,
        },
      }}
      renderTime={() => (
        <TimeWrapper>
          {renderTime(props)}
        </TimeWrapper>
      )}
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
        onLayout: (e) => {
          const { getCollapseHeight } = this.props;
          if (!Object.keys(props.nextMessage).length && getCollapseHeight) {
            getCollapseHeight(e.nativeEvent.layout.height);
          }
          },
      }}
    />);
  };

  renderCustomSystemMessage = (props) => {
    if (props.currentMessage.empty) {
      return (
        <SystemMessageWrapper
          onLayout={(e) => {
            const { getCollapseHeight } = this.props;
            if (!Object.keys(props.nextMessage).length && getCollapseHeight) {
              getCollapseHeight(e.nativeEvent.layout.height);
            }
          }}
          style={{ paddingTop: 0 }}
        >
          <EmptyStateParagraph
            title="Break the ice"
            bodyText="Start chatting - recent chats will appear here"
          />
        </SystemMessageWrapper>
      );
    }
    if (props.currentMessage.loading) {
      return (
        <SystemMessageWrapper
          onLayout={(e) => {
            const { getCollapseHeight } = this.props;
            if (!Object.keys(props.nextMessage).length && getCollapseHeight) {
              getCollapseHeight(e.nativeEvent.layout.height);
            }
          }}
        >
          <Spinner />
        </SystemMessageWrapper>
      );
    }
    return null;
  };

  updateChatInput = (text) => {
    const { firstChatLoaded } = this.state;

    if (firstChatLoaded) {
      this.setState({ firstChatLoaded: false });
    } else {
      this.setState({ chatText: text });
    }
  };

  render() {
    const {
      messages,
      isOpen,
      chats,
      user,
    } = this.props;
    const {
      contact,
      showLoadEarlierButton,
      chatText,
      isFetching,
    } = this.state;

    const chatInfo = chats.find(({ username }) => username === contact.username) || {};
    const { unread = 0, lastMessage = { serverTimestamp: '' } } = chatInfo;

    let messagesToShow = [];

    if (!Object.keys(chatInfo).length
      && (!messages[contact.username] || !messages[contact.username].length) && !isOpen) {
      messagesToShow = [
        {
          _id: 1,
          system: true,
          empty: true,
          contactName: contact.username,
        },
      ];
    } else if (isFetching) {
      messagesToShow = [
        {
          _id: 1,
          system: true,
          loading: true,
          contactName: contact.username,
        },
      ];
    } else if (unread && !isOpen) {
      messagesToShow = [
        {
          _id: 1,
          text: unread > 1
            ? 'You have received new messages. Tap here to decrypt and read them'
            : 'You have received a new message. Tap here to decrypt and read it',
          createdAt: lastMessage.serverTimestamp,
          user: {
            _id: user.username,
            name: user.username,
          },
        },
      ];
    } else if (messages[contact.username] && messages[contact.username].length && !isOpen) {
      const messageToShowCopy = messages[contact.username];
      const lastMessageToShow = { ...messageToShowCopy[0] };

      if (lastMessageToShow.text.length > 65) {
        const messageTextCopy = lastMessageToShow.text;
        lastMessageToShow.text = truncate(messageTextCopy, { length: 65 });
      }
      messagesToShow = [lastMessageToShow];
    } else if (messages[contact.username] && messages[contact.username].length) {
      messagesToShow = messages[contact.username];
    }

    return (
      <GiftedChat
        text={chatText}
        onInputTextChanged={this.updateChatInput}
        messages={messagesToShow}
        onSend={msgs => this.onSend(msgs)}
        user={{
          _id: this.props.user.username,
        }}
        renderBubble={this.renderBubble}
        renderAvatar={this.renderAvatar}
        renderComposer={this.renderComposer}
        renderInputToolbar={renderInputToolbar}
        renderDay={renderDay}
        loadEarlier={showLoadEarlierButton}
        onLoadEarlier={this.handleLoadEarlier}
        renderLoadEarlier={renderLoadEarlier}
        renderMessage={renderMessage}
        renderTime={renderTime}
        minInputToolbarHeight={INPUT_HEIGHT}
        parsePatterns={parsePatterns}
        renderSystemMessage={this.renderCustomSystemMessage}
      />
    );
  }
}

const mapStateToProps = ({
  user: { data: user },
  chat: { data: { messages, isFetching, chats }, draft },
  contacts: { data: contacts },
}) => ({
  user,
  messages,
  isFetching,
  chats,
  contacts,
  draft,
});

const mapDispatchToProps = (dispatch) => ({
  getChatByContact: (
    username,
    userId,
    avatar,
    loadEarlier,
  ) => dispatch(getChatByContactAction(username, userId, avatar, loadEarlier)),
  sendMessageByContact: (username: string, message: Object) => {
    dispatch(sendMessageByContactAction(username, message));
  },
  clearChatDraftState: () => dispatch(clearChatDraftStateAction()),
  getChatDraftByContact: (contactId: string) => dispatch(getChatDraftByContactAction(contactId)),
  saveDraft: (contactId: string, draftText: string) => dispatch(saveDraftAction(contactId, draftText)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ChatTab);
