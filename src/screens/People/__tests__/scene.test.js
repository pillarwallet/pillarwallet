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
import renderer from 'react-test-renderer';
import PeopleScene from '../scene';
import { navigation, searchResults } from '../stories/mocks';

/* eslint no-console:0, comma-dangle:0 */
describe('People scene', () => {
  it('should render People screen correctly', () => {
    const component = renderer.create(
      <PeopleScene
        navigation={navigation}
        onSearchChange={(q) => console.log(q)}
        contactState=""
        pendingConnectionRequests={0}
        invitations={[]}
        onHandleConnectionsRequestBannerPress={() => console.log('handle connection request')}
        searchResults={searchResults}
        sortedLocalContacts={[]}
        fetchInviteNotifications={() => console.log('fetch invite notifications')}
        onHandleContactCardPress={(contact) => console.log(contact)}
        disconnectContact={(contact) => console.log(`disconnect contact ${contact.username}`)}
      />
    ).toJSON();
    expect(component).toMatchSnapshot();
  });
});
