// @flow
import * as React from 'react';
import orderBy from 'lodash.orderby';
import { RefreshControl } from 'react-native';
import { Container } from 'components/Layout';
import { connect } from 'react-redux';
import type { NavigationScreenProp, NavigationEventSubscription } from 'react-navigation';
import { CHAT, CHAT_LIST, CONTACT } from 'constants/navigationConstants';
import Header from 'components/Header';
import EmptyChat from 'components/EmptyState/EmptyChat';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Separator from 'components/Separator';
import ScrollWithShadow from 'components/ScrollWithShadow';
import { getExistingChatsAction } from 'actions/chatActions';
import { setUnreadChatNotificationsStatusAction } from 'actions/notificationsActions';

type Props = {
  navigation: NavigationScreenProp<*>,
  setUnreadChatNotificationsStatus: Function,
  contacts: Object[],
  chats: Object[],
  notifications: Object[],
  getExistingChats: Function,
}

class NewChatListScreen extends React.Component<Props, {}> {
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
    navigation.navigate(CHAT, { username: contact.username, fromNewChatList: true });
  };

  goToChatList = () => {
    this.props.navigation.navigate(CHAT_LIST);
  };

  renderItem = ({ item: contact }: Object) => {
    if (!contact.username) return null;

    const { contacts, navigation } = this.props;
    const contactInfo = contacts.find(({ username }) => contact.username === username) || {};

    return (
      <ListItemWithImage
        label={contactInfo.username}
        avatarUrl={contactInfo.profileImage}
        navigateToProfile={() => navigation.navigate(CONTACT, { contact: contactInfo })}
        onPress={() => this.handleChatItemClick(contactInfo)}
      />
    );
  };

  render() {
    const { chats, getExistingChats, contacts } = this.props;
    const contactsForNewChats = contacts.map((contact) => {
      const existingChat = chats.find(({ username }) => contact.username === username);
      if (existingChat) return {};
      return contact;
    });

    const sortedContactsForNewChats = orderBy(contactsForNewChats
      .filter(value => Object.keys(value).length !== 0), [user => user.username.toLowerCase()], 'asc');

    return (
      <Container inset={{ bottom: 0 }}>
        <Header
          title="new chat"
          onBack={this.goToChatList}
        />
        <ScrollWithShadow
          data={sortedContactsForNewChats}
          extraData={chats}
          keyExtractor={(item) => item.username}
          renderItem={this.renderItem}
          ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
          style={{ width: '100%' }}
          contentContainerStyle={{
            width: '100%',
            paddingBottom: sortedContactsForNewChats.length ? 18 : 0,
          }}
          ListEmptyComponent={
            <EmptyChat
              title="No new connections"
              bodyText="Check recent chats for existing chats"
            />}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={getExistingChats}
            />
          }
        />
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
  setUnreadChatNotificationsStatus: (status) => dispatch(setUnreadChatNotificationsStatusAction(status)),
});

export default connect(mapStateToProps, mapDispatchToProps)(NewChatListScreen);
