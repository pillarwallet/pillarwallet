import React from 'react';
import { Alert } from 'react-native';
import { Styleguide } from 'StyleguideSystem';

import Scene from './scene';

const openSessions = [
  {
    id: '1',
    name: 'iPhone 8',
    lastActiveDate: '07.04.19',
  },
  {
    id: '2',
    name: 'Desktop MacOS 12.3',
    lastActiveDate: '20.12.18',
  },
];

const sessionsHistory = [
  {
    id: '3',
    name: 'Android',
    fromActiveDate: '10.03.19',
    lastActiveDate: '06.04.19',
  },
  {
    id: '4',
    name: 'Windows Desktop',
    fromActiveDate: '01.02.18',
    lastActiveDate: '26.10.18',
  },
];

Styleguide.add({
  parent: 'SCREEN',
  group: 'ManageSessions',
  id: 'MANAGE_SESSIONS',
  title: 'Manage Sessions',
  component: (
    <Scene
      sessionTitle="cryptokitties"
      openSessions={openSessions}
      sessionsHistory={sessionsHistory}
      onBack={() => Alert.alert('back to assets')}
      onTerminateSessions={() => Alert.alert('terminate sessions')}
      onRevokeAccessFor={(idToRevoke) => Alert.alert(`id to revoke ${idToRevoke}`)}
    />
  ),
});
