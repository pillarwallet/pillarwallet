import React from 'react';
import { Alert } from 'react-native';
import Styleguide from 'utils/StyleguideSystem/styleguide';

import Scene from './scene.js';

const meUser = {
  picture: 'someUrl',
  username: 'foobar',
  persona: 'Master',
};

Styleguide.add({
  parent: 'SCREEN',
  group: 'Me',
  id: 'ME_DEFAULT',
  title: 'Default',
  component: (
    <Scene
      currentPersona={meUser}
      onSwitchPersona={() => Alert.alert('switch persona')}
      onNewSession={() => Alert.alert('new session')}
      onPersonalData={() => Alert.alert('personal data and visibility')}
      onAssociated={() => Alert.alert('associated DIDs')}
      onPermissions={() => Alert.alert('permissions')}
    />
  ),
});
