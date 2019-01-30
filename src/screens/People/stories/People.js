// @flow

import React from 'react';
import { storiesOf } from '@storybook/react-native';

import PeopleScene from '../scene';

const navigation = {
  addListener: (event, callback) => console.log(`listener on ${event}`),
  isFocused: () => console.log('is focused'),
};

storiesOf('People', module)
  .add('Empty list', () => {
    const searchResults = {
      apiUsers: [],
      localContacts: [],
    };
    const sortedLocalContacts = new Array();

    return (
      <PeopleScene
        navigation={navigation}
        onSearchChange={(q) => console.log(q)}
        contactState=""
        pendingConnectionRequests={null}
        invitations={[]}
        onHandleConnectionsRequestBannerPress={() => console.log('handle connection request')}
        searchResults={searchResults}
        sortedLocalContacts={sortedLocalContacts}
        fetchInviteNotifications={() => console.log('fetch invite notifications')}
        onHandleContactCardPress={(contact) => console.log(contact)}
      />
    );
  })
  .add('Populated list', () => {
    const searchResults = {
      apiUsers: [],
      localContacts: [],
    };
    const sortedLocalContacts = new Array();
    sortedLocalContacts.push({ username: 'foobar', profileImage: '', id: 'foobar' });

    return (
      <PeopleScene
        navigation={navigation}
        onSearchChange={(q) => console.log(q)}
        contactState=""
        pendingConnectionRequests={null}
        invitations={[]}
        onHandleConnectionsRequestBannerPress={() => console.log('handle connection request')}
        searchResults={searchResults}
        sortedLocalContacts={sortedLocalContacts}
        fetchInviteNotifications={() => console.log('fetch invite notifications')}
        onHandleContactCardPress={(contact) => console.log(contact)}
      />
    );
  });
