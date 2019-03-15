import React from 'react';
import Styleguide from 'utils/StyleguideSystem/styleguide';

import Scene from './scene.js';

const meUser = {
  picture: 'someUrl',
  username: 'foobar',
  persona: 'Master',
};

Styleguide.add({
  group: 'Me',
  id: 'ME_DEFAULT',
  title: 'Default',
  component: (
    <Scene
      currentPersona={meUser}
      onSwitchPerson={() => console.log('switch person')}
      onNewSession={() => console.log('new session')}
      onPersonalData={() => console.log('personal data and visibility')}
      onAssociated={() => console.log('associated DIDs')}
      onPermissions={() => console.log('permissions')}
    />
  ),
});
