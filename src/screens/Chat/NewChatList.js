// @flow
import * as React from 'react';
import orderBy from 'lodash.orderby';
import { FlatList, RefreshControl, View } from 'react-native';
import { Container, ScrollWrapper } from 'components/Layout';
import { connect } from 'react-redux';
import type { NavigationScreenProp, NavigationEventSubscription } from 'react-navigation';
import { CHAT, CHAT_LIST } from 'constants/navigationConstants';
import Header from 'components/Header';
import { baseColors } from 'utils/variables';
import { getExistingChatsAction, resetUnreadAction } from 'actions/chatActions';
import { setUnreadChatNotificationsStatusAction } from 'actions/notificationsActions';
import ChatListItem from './ChatListItem';

type Props = {
  navigation: NavigationScreenProp<*>,
  setUnreadChatNotificationsStatus: Function,
  contacts: Object[],
  chats: Object[],
  notifications: Object[],
  getExistingChats: Function,
  resetUnread: Function,
}

type State = {
  showChat: boolean,
  receiver: string,
  receiverAvatar: string,
  chatList: Array<Object>,
}

class NewChatListScreen extends React.Component<Props, State> {
  _willFocus: NavigationEventSubscription;

  componentDidMount() {
    this._willFocus = this.props.navigation.addListener(
      'willFocus',
      () => {
        this.props.setUnreadChatNotificationsStatus(false);
        this.props.getExistingChats();
      },
    );
  }

  componentWillUnmount() {
    this._willFocus.remove();
  }

  handleChatItemClick = (contact) => {
    const { navigation } = this.props;
    navigation.navigate(CHAT, { contact, fromNewChatList: true });
  };

  goToChatList = () => {
    this.props.navigation.navigate(CHAT_LIST);
  };

  renderItem = ({ item: contact }: Object) => {
    const { contacts } = this.props;
    const contactInfo = contacts.find(({ username }) => contact.username === username) || {};

    return (
      <ChatListItem
        userName={contactInfo.username}
        avatar={contactInfo.profileImage}
        onPress={() => this.handleChatItemClick(contactInfo)}
        centerVertical
      />
    );
  };

  renderSeparator = () => {
    return (
      <View style={{ paddingLeft: 74, paddingRight: 18 }}>
        <View style={{ height: 1, width: '100%', backgroundColor: baseColors.lightGray }} />
      </View>
    );
  };

  render() {
    const { chats, getExistingChats, contacts } = this.props;
    const ChatWrapper = chats.length ? ScrollWrapper : View;
    const contactsForNewChats = contacts.map((contact) => {
      const existingChat = chats.find(({ username }) => contact.username === username);
      if (existingChat) return {};
      return contact;
    });

    const sortedContactsForNewChats = orderBy(contactsForNewChats
      .filter(value => Object.keys(value).length !== 0), [user => user.username.toLowerCase()], 'asc');

    return (
      <Container>
        <Header title="new chat" onBack={this.goToChatList} />
        <ChatWrapper
          style={{
            paddingBottom: chats.length ? 18 : 0,
          }}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={getExistingChats}
            />
          }
        >
          <FlatList
            data={sortedContactsForNewChats}
            extraData={this.props.contacts}
            keyExtractor={(item) => item.username}
            renderItem={this.renderItem}
            ItemSeparatorComponent={this.renderSeparator}
            style={{ height: '100%' }}
            contentContainerStyle={{ height: '100%' }}
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
});

export default connect(mapStateToProps, mapDispatchToProps)(NewChatListScreen);
