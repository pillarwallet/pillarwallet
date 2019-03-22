import React from 'react';
import { Alert } from 'react-native';
import Styleguide from 'utils/StyleguideSystem/styleguide';

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
      onSwitchPersona={() => Alert.alert('switch persona')}
      onNewSession={() => Alert.alert('new session')}
      onPersonalData={() => Alert.alert('personal data and visibility')}
      onAssociated={() => Alert.alert('associated DIDs')}
      onPermissions={() => Alert.alert('permissions')}
    />
  ),
});

Styleguide.add({
  parent: 'SCREEN',
  group: 'Me',
  id: 'ME_PREMIUM',
  title: 'Premium User',
  component: (
    <Scene
      profile={{ ...meUser, isPremium: true }}
      onSwitchPersona={() => Alert.alert('switch persona')}
      onNewSession={() => Alert.alert('new session')}
      onPersonalData={() => Alert.alert('personal data and visibility')}
      onAssociated={() => Alert.alert('associated DIDs')}
      onPermissions={() => Alert.alert('permissions')}
    />
  ),
});
