// @flow
import React from 'react';
import { storiesOf } from '@storybook/react-native';

import { navigation, searchResults } from './mocks';
import PeopleScene from '../scene';

/* eslint no-console: 0 */
storiesOf('People', module)
  .add('Empty list', () => {
    const sortedLocalContacts = [];

    return (
      <PeopleScene
        navigation={navigation}
        onSearchChange={(q) => console.log(q)}
        contactState=""
        pendingConnectionRequests={0}
        invitations={[]}
        onHandleConnectionsRequestBannerPress={() => console.log('handle connection request')}
        searchResults={searchResults}
        sortedLocalContacts={sortedLocalContacts}
        fetchInviteNotifications={() => console.log('fetch invite notifications')}
        onHandleContactCardPress={(contact) => console.log(contact)}
        disconnectContact={(contact) => console.log(`disconnect contact ${contact.username}`)}
      />
    );
  })
  .add('Populated list', () => {
    const sortedLocalContacts = [
      { username: 'foobar', profileImage: '', id: 'foobar' },
    ];

    return (
      <PeopleScene
        navigation={navigation}
        onSearchChange={(q) => console.log(q)}
        contactState=""
        pendingConnectionRequests={0}
        invitations={[]}
        onHandleConnectionsRequestBannerPress={() => console.log('handle connection request')}
        searchResults={searchResults}
        sortedLocalContacts={sortedLocalContacts}
        fetchInviteNotifications={() => console.log('fetch invite notifications')}
        onHandleContactCardPress={(contact) => console.log(contact)}
        disconnectContact={(contact) => console.log(`disconnect contact ${contact.username}`)}
      />
    );
  });
