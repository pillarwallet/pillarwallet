import React from 'react';
import { Alert } from 'react-native';
import { Styleguide } from 'StyleguideSystem';

import Scene from './scene';

Styleguide.add({
  parent: 'SCREEN',
  group: 'Persona',
  id: 'PERSONA_CREATE',
  title: 'Create Persona',
  component: (
    <Scene
      onBack={() => Alert.alert('back to Personas')}
      onSavePersona={(persona) => Alert.alert('Save Persona')}
      persona={{
        id: null,
        details: [
          { value: null, isVisible: false, key: 'username' },
          { value: null, isVisible: false, key: 'name' },
          { value: null, isVisible: false, key: 'email' },
          { value: null, isVisible: false, key: 'phone' },
          { value: null, isVisible: false, key: 'country' },
          { value: null, isVisible: false, key: 'city' },
        ]
      }}
    />
  ),
});

Styleguide.add({
  parent: 'SCREEN',
  group: 'Persona',
  id: 'PERSONA_EDIT',
  title: 'Edit Persona',
  component: (
    <Scene
      onBack={() => Alert.alert('back to Personas')}
      onSavePersona={(persona) => Alert.alert('Save Persona')}
      persona={{
        id: 1,
        details: [
          { value: 'foo', isVisible: true, key: 'username' },
          { value: 'foo bar', isVisible: false, key: 'name' },
          { value: 'foo@bar.com', isVisible: false, key: 'email' },
          { value: '+555888979', isVisible: false, key: 'phone' },
          { value: 'Uruguay', isVisible: false, key: 'country' },
          { value: 'Montevideo', isVisible: false, key: 'city' },
        ],
      }}
    />
  ),
});
