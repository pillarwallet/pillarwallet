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
import { Alert, Platform, Linking, AppState, BackHandler, View } from 'react-native';
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
import { baseColors, fontSizes, spacing, lineHeights, appFont, accentColors } from 'utils/variables';
import ProfileImage from 'components/ProfileImage';
import Icon from 'components/Icon';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Spinner from 'components/Spinner';
import { Wrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import {
  sendMessageByContactAction,
  clearChatDraftStateAction,
  getChatByContactAction,
  getChatDraftByContactAction,
  saveDraftAction,
} from 'actions/chatActions';
import { logEventAction, logScreenViewAction } from 'actions/analyticsActions';
import { isIphoneX, handleUrlPress } from 'utils/common';
import { getUserName } from 'utils/contacts';
import { UNDECRYPTABLE_MESSAGE } from 'constants/messageStatus';
import { CONTACT } from 'constants/navigationConstants';

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
  logScreenView: Function,
  logEvent: Function,
  isOnline: boolean,
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
      color: baseColors.secondaryText,
      fontSize: fontSizes.small,
      fontFamily: appFont.regular,
      fontWeight: 'normal',
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
          color: baseColors.secondaryText,
          fontFamily: appFont.regular,
          fontSize: fontSizes.small,
        },
        left: {
          color: isWarningMessage(props.currentMessage.type) ? baseColors.secondaryAccent : baseColors.secondaryText,
          fontFamily: appFont.regular,
          fontSize: fontSizes.small,
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
        color: baseColors.primary,
        fontSize: fontSizes.large,
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
        borderColor: baseColors.border,
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
    style: { color: baseColors.primary },
    onPress: (url) => handleUrlPress(url),
  },
  {
    type: 'email',
    style: { color: baseColors.primary },
    onPress: (email) => Linking.openURL(`mailto:${email}`),
  },
  {
    type: 'phone',
    style: { color: baseColors.primary },
    onPress: (phone) => Linking.openURL(`tel:${phone}`),
  },
];

class Chat extends React.Component<Props, State> {
  composer: Object;

  static defaultProps = {
    isOpen: false,
  };

  constructor(props) {
    super(props);
    const username = this.props.navigation.getParam('username', '');
    const contact = props.contacts.find(c => c.username === username) || {};
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
      logScreenView,
    } = this.props;
    getChatByContact(contact.username, contact.id, contact.profileImage);
    logScreenView('View chat list', 'Chat');
    AppState.addEventListener('change', this.shouldPersistDraft);
    getChatDraftByContact(contact.id);
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', this.physicalBackAction);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const {
      isFetching,
      draft,
      isOnline,
      getChatByContact,
    } = this.props;
    const { draft: prevDraft } = prevProps;

    if (this.state.isFetching && !isFetching) {
      this.setState({ isFetching: false }); // eslint-disable-line
    }

    if (!prevDraft && draft) {
      this.setState({ chatText: draft }); // eslint-disable-line
    }

    if (prevProps.isOnline !== isOnline && isOnline) {
      const { contact } = this.state;
      getChatByContact(contact.username, contact.id, contact.profileImage);
    }
  }

  componentWillUnmount() {
    const { saveDraft, clearChatDraftState } = this.props;
    const { chatText, contact } = this.state;

    AppState.removeEventListener('change', this.shouldPersistDraft);

    if (Platform.OS === 'android') {
      BackHandler.removeEventListener('hardwareBackPress', this.physicalBackAction);
    }

    if (chatText && chatText !== '') {
      saveDraft(contact.id, chatText);
    }
    clearChatDraftState();
  }

  physicalBackAction = () => {
    this.handleChatDismissal();
    return true;
  };

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
    const {
      sendMessageByContact,
      clearChatDraftState,
      messages: chatMessages,
      logEvent,
    } = this.props;
    const { contact } = this.state;
    const contactMessages = chatMessages[contact.username];

    if (!contactMessages || !contactMessages.length) {
      logEvent('first_chat_message_sent');
    }

    sendMessageByContact(contact.username, messages[0]);
    clearChatDraftState();
    this.setState({ chatText: '' });
  };

  renderCustomAvatar = () => {
    const { contact } = this.state;
    const { profileImage, username } = contact;

    return (
      <ProfileImage
        uri={profileImage}
        userName={username}
        diameter={32}
        onPress={this.handleOnContactPress}
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
          fontSize: fontSizes.regular,
          lineHeight: lineHeights.regular,
          fontFamily: appFont.regular,
        }}
        placeholder="Type your message here"
      />
    );
  };

  renderBubble = (props) => {
    const isWarning = isWarningMessage(props.currentMessage.type);
    return (<Bubble
      {...props}
      textStyle={{
        left: {
          color: isWarning ? baseColors.control : baseColors.text,
          fontSize: fontSizes.regular,
          fontFamily: appFont.regular,
        },
        right: {
          color: baseColors.text,
          fontSize: fontSizes.regular,
          fontFamily: appFont.regular,
        },
      }}
      wrapperStyle={{
        left: {
          backgroundColor: isWarning ? baseColors.primary : accentColors.chatBubble,
          borderRadius: 5,
          borderWidth: 1,
          borderColor: isWarning ? baseColors.primary : accentColors.chatBubbleBorder,
          maxWidth: 262,
          marginTop: 4,
          paddingHorizontal: 2,
          paddingTop: 2,
          minWidth: 120,
        },
        right: {
          backgroundColor: baseColors.card,
          borderRadius: 5,
          borderWidth: 1,
          borderColor: accentColors.chatBubbleBorder,
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
      }}
    />);
  };

  renderCustomSystemMessage = (props) => {
    if (props.currentMessage.empty) {
      return (
        <SystemMessageWrapper style={{ paddingTop: 0 }}>
          <EmptyStateParagraph
            title="Break the ice"
            bodyText="Start chatting - recent chats will appear here"
          />
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

  handleChatDismissal = () => {
    const {
      navigation,
    } = this.props;
    const backTo = navigation.getParam('backTo');
    if (backTo && backTo !== CONTACT) {
      navigation.navigate(backTo);
    } else {
      navigation.goBack(null);
    }
  };

  handleOnContactPress = () => {
    const { contact: { username } } = this.state;
    this.props.navigation.navigate(CONTACT, { username });
  };

  render() {
    const {
      messages,
    } = this.props;
    const {
      contact,
      showLoadEarlierButton,
      chatText,
      isFetching,
    } = this.state;

    const title = getUserName(contact);

    let messagesToShow = [];
    if (!messages[contact.username] || !messages[contact.username].length) {
      messagesToShow = [
        {
          _id: 1,
          system: true,
          empty: true,
          contactName: contact.username,
        },
      ];
    } else {
      messagesToShow = messages[contact.username];
    }

    return (
      <ContainerWithHeader
        inset={{ bottom: 'never' }}
        headerProps={{ centerItems: [{ title, onPress: this.handleOnContactPress }] }}
        customOnBack={this.handleChatDismissal}
      >
        <Wrapper fullScreen flex={1}>
          {!!isFetching &&
            <View style={{ flex: 1, paddingTop: spacing.rhythm, alignItems: 'center' }}>
              <Spinner />
            </View>
          }
          {!isFetching &&
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
          }
        </Wrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  user: { data: user },
  chat: { data: { messages, isFetching, chats }, draft },
  contacts: { data: contacts },
  session: { data: { isOnline } },
}) => ({
  user,
  messages,
  isFetching,
  chats,
  contacts,
  draft,
  isOnline,
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
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
  logEvent: (name: string, properties: Object) => dispatch(logEventAction(name, properties)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Chat);
