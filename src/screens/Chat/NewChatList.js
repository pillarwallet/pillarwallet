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
import orderBy from 'lodash.orderby';
import { FlatList, RefreshControl, View } from 'react-native';
import { Container, ScrollWrapper } from 'components/Layout';
import { connect } from 'react-redux';
import type { NavigationScreenProp, NavigationEventSubscription } from 'react-navigation';
import { CHAT, CHAT_LIST, CONTACT } from 'constants/navigationConstants';
import Header from 'components/Header';
import EmptyChat from 'components/EmptyState/EmptyChat';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Separator from 'components/Separator';
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

    const ChatWrapper = sortedContactsForNewChats.length ? ScrollWrapper : View;

    return (
      <Container inset={{ bottom: 0 }}>
        <Header title="new chat" onBack={this.goToChatList} />
        <ChatWrapper
          style={{
            paddingBottom: sortedContactsForNewChats.length ? 18 : 0,
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
            extraData={chats}
            keyExtractor={(item) => item.username}
            renderItem={this.renderItem}
            ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
            style={{ height: '100%' }}
            contentContainerStyle={{ height: '100%' }}
            ListEmptyComponent={
              <EmptyChat
                title="No new connections"
                bodyText="Check recent chats for existing chats"
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
  setUnreadChatNotificationsStatus: (status) => dispatch(setUnreadChatNotificationsStatusAction(status)),
});

export default connect(mapStateToProps, mapDispatchToProps)(NewChatListScreen);
