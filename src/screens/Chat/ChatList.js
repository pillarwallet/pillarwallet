// @flow
import * as React from 'react';
import orderBy from 'lodash.orderby';
import isEqual from 'lodash.isequal';
import { FlatList, RefreshControl, View, Alert } from 'react-native';
import { Container, ScrollWrapper } from 'components/Layout';
import { connect } from 'react-redux';
import Swipeout from 'react-native-swipeout';
import styled from 'styled-components/native/index';
import { isToday, isYesterday, isThisYear, format as formatDate } from 'date-fns';
import type { NavigationScreenProp, NavigationEventSubscription } from 'react-navigation';
import { CHAT, NEW_CHAT, CONTACT } from 'constants/navigationConstants';
import EmptyChat from 'components/EmptyState/EmptyChat';
import Header from 'components/Header';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Separator from 'components/Separator';
import Icon from 'components/Icon';
import { BaseText } from 'components/Typography';
import { getExistingChatsAction, resetUnreadAction, deleteChatAction } from 'actions/chatActions';
import { setUnreadChatNotificationsStatusAction } from 'actions/notificationsActions';
import { fontSizes, baseColors, spacing } from 'utils/variables';

type Props = {
  navigation: NavigationScreenProp<*>,
  setUnreadChatNotificationsStatus: Function,
  contacts: Object[],
  chats: Object[],
  notifications: Object[],
  getExistingChats: Function,
  resetUnread: Function,
  deleteChat: Function,
}

type State = {
  forceClose: boolean,
}

const DeleteButttonWrapper = styled.TouchableOpacity`
  height: 84px;
  width: 64px;
  justify-content: center;
  align-items: center;
  margin-right: ${spacing.mediumLarge}px;
`;

const ButtonIcon = styled(Icon)`
  font-size: ${fontSizes.small}px;
  color: ${baseColors.burningFire};
`;

const ButtonLabel = styled(BaseText)`
  font-size: ${fontSizes.extraExtraSmall}px;
  color: ${baseColors.burningFire};
  margin-top: ${spacing.small}px;
`;

class ChatListScreen extends React.Component<Props, State> {
  _willFocus: NavigationEventSubscription;

  state = {
    forceClose: false,
  };

  componentDidMount() {
    this.props.getExistingChats();
    this._willFocus = this.props.navigation.addListener(
      'willFocus',
      () => {
        this.props.setUnreadChatNotificationsStatus(false);
      },
    );
  }

  componentWillUnmount() {
    this._willFocus.remove();
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    return !isEq;
  }

  handleChatItemClick = (contact) => {
    const { navigation, resetUnread } = this.props;
    navigation.navigate(CHAT, { username: contact.username });
    resetUnread(contact.username);
  };

  goToNewChatList = () => {
    this.props.navigation.navigate(NEW_CHAT);
  };

  renderSwipeoutBtn = (username: string, unreadCount?: number) => {
    return [{
      component: (
        <DeleteButttonWrapper
          onPress={() => { this.deleteChat(username, unreadCount); }}
        >
          <ButtonIcon
            name="delete"
          />
          <ButtonLabel>
            Delete
          </ButtonLabel>
        </DeleteButttonWrapper>),
      backgroundColor: 'transparent',
      disabled: true,
    }];
  };

  deleteChat = (username: string, unreadCount: number = 0) => {
    const { deleteChat } = this.props;
    const msg = unreadCount > 1 ? 'messages' : 'message';
    const allertBody = unreadCount
      ? `This will delete your chat with ${username}. Including ${unreadCount} unread ${msg}.`
      : `This will delete your chat with ${username}.`;

    Alert.alert(
      'Are you sure?',
      allertBody,
      [
        { text: 'Cancel', onPress: () => { this.setState({ forceClose: true }); }, style: 'cancel' },
        {
          text: 'Delete',
          onPress: () => {
            this.setState({ forceClose: true });
            deleteChat(username);
          },
        },
      ],
    );
  }

  renderItem = ({ item: contact }: Object) => {
    if (!Object.keys(contact).length) return null;

    const { chats, contacts, navigation } = this.props;
    const { forceClose } = this.state;

    const chatWithContact = chats.find(({ username }) => contact.username === username) || {};
    const { lastMessage, unread } = chatWithContact;
    const contactInfo = contacts.find(({ username }) => contact.username === username) || {};

    let timeSent = '';

    if (lastMessage.serverTimestamp) {
      const lastMessageDate = new Date(lastMessage.serverTimestamp);
      if (isToday(lastMessageDate)) {
        timeSent = formatDate(lastMessageDate, 'HH:mm');
      } else if (isYesterday(lastMessageDate)) {
        timeSent = 'yesterday';
      } else if (isThisYear(lastMessageDate)) {
        timeSent = formatDate(lastMessageDate, 'D MMM');
      } else {
        timeSent = formatDate(lastMessageDate, 'D MMM YYYY');
      }
    }
    const newMessageCopy = unread > 1 ? 'New Messages' : 'New Message';

    return (
      <Swipeout
        right={this.renderSwipeoutBtn(contactInfo.username, unread)}
        sensitivity={10}
        backgroundColor="transparent"
        buttonWidth={80}
        close={forceClose}
        onClose={() => { this.setState({ forceClose: false }); }}
      >
        <ListItemWithImage
          label={contactInfo.username}
          avatarUrl={contactInfo.profileImage}
          navigateToProfile={() => navigation.navigate(CONTACT, { contact: contactInfo })}
          paragraph={unread ? newMessageCopy : lastMessage.content}
          timeSent={timeSent}
          unreadCount={unread}
          onPress={() => this.handleChatItemClick(contactInfo)}
        />
      </Swipeout>
    );
  };

  render() {
    const { chats, getExistingChats } = this.props;
    const ChatWrapper = chats.length ? ScrollWrapper : View;
    const sortedChats = orderBy(chats, ['lastMessage.serverTimestamp', 'username'], 'desc');

    return (
      <Container>
        <Header
          title="chat"
          nextText="New chat"
          onNextPress={this.goToNewChatList}
        />
        <ChatWrapper
          style={{
            paddingBottom: sortedChats.length ? 18 : 0,
          }}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={getExistingChats}
            />
          }
        >
          <FlatList
            data={sortedChats}
            extraData={chats}
            keyExtractor={(item) => item.username}
            renderItem={this.renderItem}
            ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
            style={{ height: '100%' }}
            contentContainerStyle={{ height: '100%' }}
            ListEmptyComponent={
              <EmptyChat
                title="Break the ice"
                bodyText="Start chatting with someone. Recent chats will appear here."
              />}
          />
        </ChatWrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts },
  chat: { data: { chats } },
  notifications: { data: notifications },
}) => ({
  contacts,
  chats,
  notifications,
});

const mapDispatchToProps = (dispatch) => ({
  getExistingChats: () => dispatch(getExistingChatsAction()),
  resetUnread: (contactUsername) => dispatch(resetUnreadAction(contactUsername)),
  setUnreadChatNotificationsStatus: (status) => dispatch(setUnreadChatNotificationsStatusAction(status)),
  deleteChat: (username) => dispatch(deleteChatAction(username)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ChatListScreen);
