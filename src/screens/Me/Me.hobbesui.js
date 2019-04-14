import React from 'react';
import { Alert } from 'react-native';
import { Styleguide } from 'StyleguideSystem';

import Scene from './scene.js';

const meUser = {
  profileUri: 'someUrl',
  username: 'foobar',
  activePersona: 'Master',
};

Styleguide.add({
  parent: 'SCREEN',
  group: 'Me',
  id: 'ME_DEFAULT',
  title: 'Default',
  component: (
    <Scene
      profile={meUser}
      onNewSession={() => Alert.alert('new session')}
      onManageDetails={() => Alert.alert('manage details / sessions')}
      onSetupRecovery={() => Alert.alert('setup recovery')}
      onPermissions={() => Alert.alert('permissions')}
      onChangePersona={() => Alert.alert('modal to change persona')}
    />
  ),
});
